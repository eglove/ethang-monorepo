BeforeAll {
    $script:AgentsDir  = "$PSScriptRoot/../../../bus/agents"
    $script:SchemaFile = "$PSScriptRoot/../../../bus/agents/agent-schema-version.psd1"

    $script:ValidEventTypes = @(
        'bootstrap', 'ground_truth', 'done',
        'objection', 'objection_response',
        'consensus_candidate', 'consensus_ratified', 'consensus_failed',
        'verify', 'review_requested', 'review_verdict',
        'checkpoint', 'checkpoint_response',
        'protocol_error', 'protocol_error_ack',
        'bootstrap_response'
    )

    $script:ExpectedRoles = @(
        'tla-writer', 'bdd-writer', 'debate-moderator',
        'review-moderator', 'coding-worker', 'reviewer', 'prompt-generator'
    )

    # Load schema version from PSD1
    $script:SchemaData    = Import-PowerShellDataFile $script:SchemaFile
    $script:SchemaVersion = $script:SchemaData.CurrentSchemaVersion

    # Dot-source all role .ps1 files and collect role definitions
    $script:RoleFiles = Get-ChildItem "$script:AgentsDir/*.ps1"
    $script:RoleDefinitions = @{}
    foreach ($file in $script:RoleFiles) {
        . $file.FullName
        $def = Get-AgentRoleDefinition
        $script:RoleDefinitions[$def.RoleName] = $def
    }
}

Describe 'agent-schema-version.psd1' {
    It 'has CurrentSchemaVersion = 1' {
        $script:SchemaData.CurrentSchemaVersion | Should -Be 1
    }

    It 'has Roles array with exactly 7 roles' {
        $script:SchemaData.Roles.Count | Should -Be 7
    }

    It 'Roles array contains all expected role names' {
        foreach ($role in $script:ExpectedRoles) {
            $script:SchemaData.Roles | Should -Contain $role
        }
    }
}

Describe 'Agent role .ps1 files exist' {
    It 'tla-writer.ps1 exists' {
        Test-Path "$script:AgentsDir/tla-writer.ps1" | Should -BeTrue
    }
    It 'bdd-writer.ps1 exists' {
        Test-Path "$script:AgentsDir/bdd-writer.ps1" | Should -BeTrue
    }
    It 'debate-moderator.ps1 exists' {
        Test-Path "$script:AgentsDir/debate-moderator.ps1" | Should -BeTrue
    }
    It 'review-moderator.ps1 exists' {
        Test-Path "$script:AgentsDir/review-moderator.ps1" | Should -BeTrue
    }
    It 'coding-worker.ps1 exists' {
        Test-Path "$script:AgentsDir/coding-worker.ps1" | Should -BeTrue
    }
    It 'reviewer.ps1 exists' {
        Test-Path "$script:AgentsDir/reviewer.ps1" | Should -BeTrue
    }
    It 'prompt-generator.ps1 exists' {
        Test-Path "$script:AgentsDir/prompt-generator.ps1" | Should -BeTrue
    }
}

Describe 'Get-AgentRoleDefinition exports' {
    Context 'Role: tla-writer' {
        It 'definition has required keys' {
            $def = $script:RoleDefinitions['tla-writer']
            $def | Should -Not -BeNullOrEmpty
            $def.Keys | Should -Contain 'RoleName'
            $def.Keys | Should -Contain 'SchemaVersion'
            $def.Keys | Should -Contain 'Description'
            $def.Keys | Should -Contain 'EventsSent'
            $def.Keys | Should -Contain 'EventsReceived'
            $def.Keys | Should -Contain 'Lifetime'
            $def.Keys | Should -Contain 'SystemPromptTemplate'
        }
        It 'SchemaVersion matches CurrentSchemaVersion from PSD1' {
            $script:RoleDefinitions['tla-writer'].SchemaVersion | Should -Be $script:SchemaVersion
        }
        It 'SystemPromptTemplate is a non-empty string' {
            $t = $script:RoleDefinitions['tla-writer'].SystemPromptTemplate
            $t | Should -Not -BeNullOrEmpty
            $t.Trim().Length | Should -BeGreaterThan 0
        }
        It 'all EventsSent are valid event types' {
            foreach ($event in $script:RoleDefinitions['tla-writer'].EventsSent) {
                $script:ValidEventTypes | Should -Contain $event
            }
        }
    }

    Context 'Role: bdd-writer' {
        It 'definition has required keys' {
            $def = $script:RoleDefinitions['bdd-writer']
            $def | Should -Not -BeNullOrEmpty
            $def.Keys | Should -Contain 'RoleName'
            $def.Keys | Should -Contain 'SchemaVersion'
            $def.Keys | Should -Contain 'Description'
            $def.Keys | Should -Contain 'EventsSent'
            $def.Keys | Should -Contain 'EventsReceived'
            $def.Keys | Should -Contain 'Lifetime'
            $def.Keys | Should -Contain 'SystemPromptTemplate'
        }
        It 'SchemaVersion matches CurrentSchemaVersion from PSD1' {
            $script:RoleDefinitions['bdd-writer'].SchemaVersion | Should -Be $script:SchemaVersion
        }
        It 'SystemPromptTemplate is a non-empty string' {
            $t = $script:RoleDefinitions['bdd-writer'].SystemPromptTemplate
            $t | Should -Not -BeNullOrEmpty
            $t.Trim().Length | Should -BeGreaterThan 0
        }
        It 'all EventsSent are valid event types' {
            foreach ($event in $script:RoleDefinitions['bdd-writer'].EventsSent) {
                $script:ValidEventTypes | Should -Contain $event
            }
        }
    }

    Context 'Role: debate-moderator' {
        It 'definition has required keys' {
            $def = $script:RoleDefinitions['debate-moderator']
            $def | Should -Not -BeNullOrEmpty
            $def.Keys | Should -Contain 'RoleName'
            $def.Keys | Should -Contain 'SchemaVersion'
            $def.Keys | Should -Contain 'Description'
            $def.Keys | Should -Contain 'EventsSent'
            $def.Keys | Should -Contain 'EventsReceived'
            $def.Keys | Should -Contain 'Lifetime'
            $def.Keys | Should -Contain 'SystemPromptTemplate'
        }
        It 'SchemaVersion matches CurrentSchemaVersion from PSD1' {
            $script:RoleDefinitions['debate-moderator'].SchemaVersion | Should -Be $script:SchemaVersion
        }
        It 'SystemPromptTemplate is a non-empty string' {
            $t = $script:RoleDefinitions['debate-moderator'].SystemPromptTemplate
            $t | Should -Not -BeNullOrEmpty
            $t.Trim().Length | Should -BeGreaterThan 0
        }
        It 'all EventsSent are valid event types' {
            foreach ($event in $script:RoleDefinitions['debate-moderator'].EventsSent) {
                $script:ValidEventTypes | Should -Contain $event
            }
        }
    }

    Context 'Role: review-moderator' {
        It 'definition has required keys' {
            $def = $script:RoleDefinitions['review-moderator']
            $def | Should -Not -BeNullOrEmpty
            $def.Keys | Should -Contain 'RoleName'
            $def.Keys | Should -Contain 'SchemaVersion'
            $def.Keys | Should -Contain 'Description'
            $def.Keys | Should -Contain 'EventsSent'
            $def.Keys | Should -Contain 'EventsReceived'
            $def.Keys | Should -Contain 'Lifetime'
            $def.Keys | Should -Contain 'SystemPromptTemplate'
        }
        It 'SchemaVersion matches CurrentSchemaVersion from PSD1' {
            $script:RoleDefinitions['review-moderator'].SchemaVersion | Should -Be $script:SchemaVersion
        }
        It 'SystemPromptTemplate is a non-empty string' {
            $t = $script:RoleDefinitions['review-moderator'].SystemPromptTemplate
            $t | Should -Not -BeNullOrEmpty
            $t.Trim().Length | Should -BeGreaterThan 0
        }
        It 'all EventsSent are valid event types' {
            foreach ($event in $script:RoleDefinitions['review-moderator'].EventsSent) {
                $script:ValidEventTypes | Should -Contain $event
            }
        }
    }

    Context 'Role: coding-worker' {
        It 'definition has required keys' {
            $def = $script:RoleDefinitions['coding-worker']
            $def | Should -Not -BeNullOrEmpty
            $def.Keys | Should -Contain 'RoleName'
            $def.Keys | Should -Contain 'SchemaVersion'
            $def.Keys | Should -Contain 'Description'
            $def.Keys | Should -Contain 'EventsSent'
            $def.Keys | Should -Contain 'EventsReceived'
            $def.Keys | Should -Contain 'Lifetime'
            $def.Keys | Should -Contain 'SystemPromptTemplate'
        }
        It 'SchemaVersion matches CurrentSchemaVersion from PSD1' {
            $script:RoleDefinitions['coding-worker'].SchemaVersion | Should -Be $script:SchemaVersion
        }
        It 'SystemPromptTemplate is a non-empty string' {
            $t = $script:RoleDefinitions['coding-worker'].SystemPromptTemplate
            $t | Should -Not -BeNullOrEmpty
            $t.Trim().Length | Should -BeGreaterThan 0
        }
        It 'all EventsSent are valid event types' {
            foreach ($event in $script:RoleDefinitions['coding-worker'].EventsSent) {
                $script:ValidEventTypes | Should -Contain $event
            }
        }
    }

    Context 'Role: reviewer' {
        It 'definition has required keys' {
            $def = $script:RoleDefinitions['reviewer']
            $def | Should -Not -BeNullOrEmpty
            $def.Keys | Should -Contain 'RoleName'
            $def.Keys | Should -Contain 'SchemaVersion'
            $def.Keys | Should -Contain 'Description'
            $def.Keys | Should -Contain 'EventsSent'
            $def.Keys | Should -Contain 'EventsReceived'
            $def.Keys | Should -Contain 'Lifetime'
            $def.Keys | Should -Contain 'SystemPromptTemplate'
        }
        It 'SchemaVersion matches CurrentSchemaVersion from PSD1' {
            $script:RoleDefinitions['reviewer'].SchemaVersion | Should -Be $script:SchemaVersion
        }
        It 'SystemPromptTemplate is a non-empty string' {
            $t = $script:RoleDefinitions['reviewer'].SystemPromptTemplate
            $t | Should -Not -BeNullOrEmpty
            $t.Trim().Length | Should -BeGreaterThan 0
        }
        It 'all EventsSent are valid event types' {
            foreach ($event in $script:RoleDefinitions['reviewer'].EventsSent) {
                $script:ValidEventTypes | Should -Contain $event
            }
        }
    }

    Context 'Role: prompt-generator' {
        It 'definition has required keys' {
            $def = $script:RoleDefinitions['prompt-generator']
            $def | Should -Not -BeNullOrEmpty
            $def.Keys | Should -Contain 'RoleName'
            $def.Keys | Should -Contain 'SchemaVersion'
            $def.Keys | Should -Contain 'Description'
            $def.Keys | Should -Contain 'EventsSent'
            $def.Keys | Should -Contain 'EventsReceived'
            $def.Keys | Should -Contain 'Lifetime'
            $def.Keys | Should -Contain 'SystemPromptTemplate'
        }
        It 'SchemaVersion matches CurrentSchemaVersion from PSD1' {
            $script:RoleDefinitions['prompt-generator'].SchemaVersion | Should -Be $script:SchemaVersion
        }
        It 'SystemPromptTemplate is a non-empty string' {
            $t = $script:RoleDefinitions['prompt-generator'].SystemPromptTemplate
            $t | Should -Not -BeNullOrEmpty
            $t.Trim().Length | Should -BeGreaterThan 0
        }
        It 'all EventsSent are valid event types' {
            foreach ($event in $script:RoleDefinitions['prompt-generator'].EventsSent) {
                $script:ValidEventTypes | Should -Contain $event
            }
        }
    }
}

Describe 'tla-writer specific event checks' {
    It 'sends verify event' {
        $script:RoleDefinitions['tla-writer'].EventsSent | Should -Contain 'verify'
    }

    It 'receives bootstrap event' {
        $script:RoleDefinitions['tla-writer'].EventsReceived | Should -Contain 'bootstrap'
    }
}

Describe 'coding-worker specific event checks' {
    It 'sends review_requested event' {
        $script:RoleDefinitions['coding-worker'].EventsSent | Should -Contain 'review_requested'
    }
}

Describe 'Orchestrator-only events not sent by any role' {
    It 'no role sends bootstrap' {
        foreach ($role in $script:RoleDefinitions.Keys) {
            $script:RoleDefinitions[$role].EventsSent | Should -Not -Contain 'bootstrap' -Because "$role should not send bootstrap (orchestrator-only)"
        }
    }

    It 'no role sends consensus_ratified' {
        foreach ($role in $script:RoleDefinitions.Keys) {
            $script:RoleDefinitions[$role].EventsSent | Should -Not -Contain 'consensus_ratified' -Because "$role should not send consensus_ratified (orchestrator-only)"
        }
    }

    It 'no role sends consensus_failed' {
        foreach ($role in $script:RoleDefinitions.Keys) {
            $script:RoleDefinitions[$role].EventsSent | Should -Not -Contain 'consensus_failed' -Because "$role should not send consensus_failed (orchestrator-only)"
        }
    }
}
