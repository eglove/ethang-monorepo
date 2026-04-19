BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/../../.."
    . "$root/bus/router/routing-rules.ps1"
}

Describe 'Test-TypeSenderACL' {
    It 'tla-writer can send verify' {
        Test-TypeSenderACL -SenderRole 'tla-writer' -EventType 'verify' | Should -BeTrue
    }

    It 'coding-worker cannot send verify (tla-writer only)' {
        Test-TypeSenderACL -SenderRole 'coding-worker' -EventType 'verify' | Should -BeFalse
    }

    It 'orchestrator can send bootstrap' {
        Test-TypeSenderACL -SenderRole 'orchestrator' -EventType 'bootstrap' | Should -BeTrue
    }

    It 'tla-writer cannot send bootstrap' {
        Test-TypeSenderACL -SenderRole 'tla-writer' -EventType 'bootstrap' | Should -BeFalse
    }

    It 'coding-worker can send done' {
        Test-TypeSenderACL -SenderRole 'coding-worker' -EventType 'done' | Should -BeTrue
    }

    It 'orchestrator can send consensus_ratified' {
        Test-TypeSenderACL -SenderRole 'orchestrator' -EventType 'consensus_ratified' | Should -BeTrue
    }

    It 'tla-writer cannot send consensus_ratified' {
        Test-TypeSenderACL -SenderRole 'tla-writer' -EventType 'consensus_ratified' | Should -BeFalse
    }
}

Describe 'Resolve-EventTarget' {
    It 'done with ActiveModeratorName returns the moderator name (inferred)' {
        Resolve-EventTarget -EventType 'done' -ActiveModeratorName 'moderator-1' | Should -Be 'moderator-1'
    }

    It 'verify returns tlc (inferred handler)' {
        Resolve-EventTarget -EventType 'verify' -SenderName 'tla-writer-1' | Should -Be 'tlc'
    }

    It 'review_verdict with ExplicitTo returns explicit target' {
        Resolve-EventTarget -EventType 'review_verdict' -ExplicitTo 'moderator-1' | Should -Be 'moderator-1'
    }

    It 'review_verdict without ExplicitTo throws (explicit required)' {
        { Resolve-EventTarget -EventType 'review_verdict' } | Should -Throw
    }

    It 'bootstrap returns broadcast' {
        Resolve-EventTarget -EventType 'bootstrap' -SenderName 'orch' | Should -Be 'broadcast'
    }
}

Describe 'Test-RoutingRules' {
    It 'tla-writer sending verify resolves to tlc' {
        $result = Test-RoutingRules -SenderRole 'tla-writer' -EventType 'verify' -SenderName 'tla-1'
        $result.Valid | Should -BeTrue
        $result.ResolvedTarget | Should -Be 'tlc'
    }

    It 'coding-worker sending verify returns ACL violation' {
        $result = Test-RoutingRules -SenderRole 'coding-worker' -EventType 'verify'
        $result.Valid | Should -BeFalse
        $result.Reason | Should -Be 'TypeSenderACL violation'
    }

    It 'tla-writer sending review_verdict without ExplicitTo returns invalid' {
        $result = Test-RoutingRules -SenderRole 'tla-writer' -EventType 'review_verdict'
        $result.Valid | Should -BeFalse
    }
}

Describe 'routing-rules.psd1 structure' {
    It 'contains required top-level keys' {
        $rulesPath = Resolve-Path "$PSScriptRoot/../../../bus/router/routing-rules.psd1"
        $rules = Import-PowerShellDataFile -Path $rulesPath
        $rules.Keys | Should -Contain 'InferredTargets'
        $rules.Keys | Should -Contain 'ExplicitTargetRequired'
        $rules.Keys | Should -Contain 'BroadcastEvents'
        $rules.Keys | Should -Contain 'OrchestratorOnlyEvents'
    }
}
