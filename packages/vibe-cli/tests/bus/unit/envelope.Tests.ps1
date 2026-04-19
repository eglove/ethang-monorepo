BeforeAll {
    . "$PSScriptRoot/../../../bus/router/envelope.ps1"
}

Describe 'New-Envelope' {
    BeforeEach {
        Reset-EnvelopeState
    }

    It 'creates envelope with correct fields' {
        $env = New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap'
        $env.EvtId     | Should -Be 1
        $env.From      | Should -Be 'orchestrator'
        $env.To        | Should -Be 'worker'
        $env.Type      | Should -Be 'bootstrap'
        $env.InReplyTo | Should -Be 0
        $env.GroupId   | Should -BeNullOrEmpty
        $env.CreatedAt | Should -Not -BeNullOrEmpty
    }

    It 'throws for EvtId = 0 (NoDuplicateEvtId/positive check)' {
        { New-Envelope -EvtId 0 -From 'orchestrator' -To 'worker' -Type 'bootstrap' } |
            Should -Throw 'EvtId must be positive'
    }

    It 'throws for duplicate EvtId (NoDuplicateEvtId)' {
        New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap' | Out-Null
        { New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'ground_truth' } |
            Should -Throw 'Duplicate EvtId: 1'
    }

    It 'throws for unknown Type' {
        { New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'not_a_real_type' } |
            Should -Throw 'Unknown event type: not_a_real_type'
    }

    It 'throws for empty From' {
        { New-Envelope -EvtId 1 -From '' -To 'worker' -Type 'bootstrap' } |
            Should -Throw 'From cannot be empty'
    }

    It 'throws for empty To' {
        { New-Envelope -EvtId 1 -From 'orchestrator' -To '' -Type 'bootstrap' } |
            Should -Throw 'To cannot be empty'
    }

    It 'throws when EvtId < last seen EvtId (EvtIdMonotone)' {
        New-Envelope -EvtId 5 -From 'orchestrator' -To 'worker' -Type 'bootstrap' | Out-Null
        { New-Envelope -EvtId 3 -From 'orchestrator' -To 'worker' -Type 'ground_truth' } |
            Should -Throw 'EvtId violates monotone invariant'
    }

    It 'accepts valid bootstrap payload' {
        $payload = '{"task":"do something"}'
        $env = New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap' -Payload $payload
        $env.Payload | Should -Be $payload
    }

    It 'with InReplyTo=5 sets InReplyTo correctly' {
        $env = New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap' -InReplyTo 5
        $env.InReplyTo | Should -Be 5
    }

    It 'with GroupId sets GroupId' {
        $env = New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap' -GroupId 'grp-1'
        $env.GroupId | Should -Be 'grp-1'
    }

    It 'uses event-types.psd1 AllEventTypes for type validation' {
        # All valid types from psd1 should be accepted (spot-check several)
        $validTypes = @('bootstrap','done','objection','verify','protocol_error','checkpoint_response')
        $id = 1
        foreach ($t in $validTypes) {
            { New-Envelope -EvtId $id -From 'orchestrator' -To 'worker' -Type $t } |
                Should -Not -Throw
            Reset-EnvelopeState
            $id++
        }
    }
}

Describe 'Test-EnvelopeValid' {
    BeforeEach {
        Reset-EnvelopeState
    }

    It 'returns $true for valid envelope' {
        $env = New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap'
        Test-EnvelopeValid -Envelope $env | Should -Be $true
    }

    It "returns `$false for envelope missing 'EvtId' key" {
        $bad = @{ From='orchestrator'; To='worker'; Type='bootstrap'; InReplyTo=0; GroupId=$null; CreatedAt=[DateTime]::UtcNow; Payload=$null }
        Test-EnvelopeValid -Envelope $bad | Should -Be $false
    }
}

Describe 'Get-EnvelopeJson' {
    BeforeEach {
        Reset-EnvelopeState
    }

    It 'returns valid JSON string containing EvtId, From, To, Type' {
        $env = New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap'
        $json = Get-EnvelopeJson -Envelope $env
        $json | Should -Match '"EvtId"'
        $json | Should -Match '"From"'
        $json | Should -Match '"To"'
        $json | Should -Match '"Type"'
        { $json | ConvertFrom-Json } | Should -Not -Throw
    }
}

Describe 'Reset-EnvelopeState' {
    It 'allows reuse of previously seen EvtId after reset' {
        Reset-EnvelopeState
        New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap' | Out-Null
        Reset-EnvelopeState
        # Should not throw after reset
        { New-Envelope -EvtId 1 -From 'orchestrator' -To 'worker' -Type 'bootstrap' } |
            Should -Not -Throw
    }
}
