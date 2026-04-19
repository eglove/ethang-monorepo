BeforeAll {
    $script:eventTypesDir = Join-Path $PSScriptRoot '../../../bus/event-types'
    $script:psd1Path      = Join-Path $script:eventTypesDir 'event-types.psd1'
    $script:validatorPath = Join-Path $script:eventTypesDir 'schema-validator.ps1'

    $script:allSchemaNames = @(
        'bootstrap', 'ground_truth', 'done', 'objection', 'objection_response',
        'consensus_candidate', 'consensus_ratified', 'consensus_failed',
        'verify', 'verify_result', 'review_requested', 'review_verdict',
        'checkpoint', 'checkpoint_response', 'protocol_error', 'protocol_error_ack'
    )
}

Describe 'event-types.psd1' {
    It 'AllEventTypes array has exactly 16 values' {
        $data = Import-PowerShellDataFile $script:psd1Path
        $data.AllEventTypes.Count | Should -Be 16
    }

    It 'AllEventTypes contains sample event types' {
        $data = Import-PowerShellDataFile $script:psd1Path
        $data.AllEventTypes | Should -Contain 'bootstrap'
        $data.AllEventTypes | Should -Contain 'done'
        $data.AllEventTypes | Should -Contain 'consensus_ratified'
        $data.AllEventTypes | Should -Contain 'protocol_error_ack'
    }

    It 'bounded context subsets partition AllEventTypes (no overlap, no gap)' {
        $data = Import-PowerShellDataFile $script:psd1Path
        $subsets = @($data.AgentLifecycle) + @($data.Consensus) + @($data.Verification) + @($data.ProtocolError)

        # No duplicates
        $unique = $subsets | Select-Object -Unique
        $unique.Count | Should -Be $subsets.Count

        # Covers exactly AllEventTypes
        $sorted_subsets = ($subsets | Sort-Object) -join ','
        $sorted_all     = ($data.AllEventTypes | Sort-Object) -join ','
        $sorted_subsets | Should -Be $sorted_all
    }

    It 'TypeSenderACL has an entry for every event type in AllEventTypes' {
        $data = Import-PowerShellDataFile $script:psd1Path
        foreach ($et in $data.AllEventTypes) {
            $data.TypeSenderACL.ContainsKey($et) | Should -BeTrue -Because "TypeSenderACL must have entry for '$et'"
        }
    }
}

Describe 'JSON schema files' {
    It 'all 16 JSON schema files exist and are valid JSON' {
        foreach ($name in $script:allSchemaNames) {
            $path = Join-Path $script:eventTypesDir "$name.schema.json"
            $path | Should -Exist -Because "$name.schema.json must exist"
            { Get-Content $path -Raw | ConvertFrom-Json } | Should -Not -Throw -Because "$name.schema.json must be valid JSON"
        }
    }

    It 'bootstrap.schema.json required array contains role, feature_name, ground_truth' {
        $path   = Join-Path $script:eventTypesDir 'bootstrap.schema.json'
        $schema = Get-Content $path -Raw | ConvertFrom-Json
        $schema.required | Should -Contain 'role'
        $schema.required | Should -Contain 'feature_name'
        $schema.required | Should -Contain 'ground_truth'
    }

    It 'ground_truth.schema.json has maxLength 8192 on content property' {
        $path   = Join-Path $script:eventTypesDir 'ground_truth.schema.json'
        $schema = Get-Content $path -Raw | ConvertFrom-Json
        $schema.properties.content.maxLength | Should -Be 8192
    }

    It 'checkpoint_response.schema.json has maxLength 4096 on summary property' {
        $path   = Join-Path $script:eventTypesDir 'checkpoint_response.schema.json'
        $schema = Get-Content $path -Raw | ConvertFrom-Json
        $schema.properties.summary.maxLength | Should -Be 4096
    }
}

Describe 'Test-BusEventPayload validator' {
    BeforeAll {
        . $script:validatorPath
    }

    It 'returns IsValid=$true for a valid bootstrap payload' {
        $result = Test-BusEventPayload -EventType 'bootstrap' -PayloadJson '{"role":"tla-writer","feature_name":"foo","ground_truth":"bar"}'
        $result.IsValid | Should -BeTrue
        $result.Errors  | Should -BeNullOrEmpty
    }

    It 'returns IsValid=$false for bootstrap missing required fields' {
        $result = Test-BusEventPayload -EventType 'bootstrap' -PayloadJson '{"role":"tla-writer"}'
        $result.IsValid | Should -BeFalse
        $result.Errors.Count | Should -BeGreaterThan 0
    }

    It 'returns IsValid=$false for unknown event type' {
        $result = Test-BusEventPayload -EventType 'no_such_type' -PayloadJson '{}'
        $result.IsValid | Should -BeFalse
    }

    It 'returns IsValid=$false for ground_truth with content exceeding 8192 chars' {
        $longContent = 'x' * 8193
        $payload = @{ content = $longContent } | ConvertTo-Json -Compress
        $result = Test-BusEventPayload -EventType 'ground_truth' -PayloadJson $payload
        $result.IsValid | Should -BeFalse
    }

    It 'returns IsValid=$true for review_verdict with verdict=approve' {
        $result = Test-BusEventPayload -EventType 'review_verdict' -PayloadJson '{"verdict":"approve"}'
        $result.IsValid | Should -BeTrue
    }

    It 'returns IsValid=$false for review_verdict with invalid enum value' {
        $result = Test-BusEventPayload -EventType 'review_verdict' -PayloadJson '{"verdict":"unknown_value"}'
        $result.IsValid | Should -BeFalse
    }
}
