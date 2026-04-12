BeforeAll {
    $script:agentPath = Join-Path "$PSScriptRoot/../" 'agents/review-moderator.md'
}

Describe 'Review Moderator Agent' {
    It 'agent file exists and is non-empty' {
        $script:agentPath | Should -Exist
        (Get-Item $script:agentPath).Length | Should -BeGreaterThan 0
    }

    Context 'agent content requirements' {
        BeforeAll {
            $script:content = Get-Content $script:agentPath -Raw
        }

        It 'documents pre-filter responsibility' {
            $script:content | Should -Match 'pre-filter'
        }

        It 'documents parallel dispatch' {
            $script:content | Should -Match 'parallel'
        }

        It 'documents critical severity level' {
            $script:content | Should -Match 'critical'
        }

        It 'documents high severity level' {
            $script:content | Should -Match 'high'
        }

        It 'documents medium severity level' {
            $script:content | Should -Match 'medium'
        }

        It 'documents low severity level' {
            $script:content | Should -Match 'low'
        }

        It 'documents pass verdict' {
            $script:content | Should -Match 'pass'
        }

        It 'documents fail verdict' {
            $script:content | Should -Match 'fail'
        }

        It 'documents timeout handling' {
            $script:content | Should -Match 'timeout'
        }

        It 'documents malformed or invalid response handling' {
            $script:content | Should -Match 'malformed|invalid'
        }

        It 'specifies 600 second reviewer timeout' {
            $script:content | Should -Match '600'
        }

        It 'specifies 300 second moderator timeout' {
            $script:content | Should -Match '300'
        }
    }
}
