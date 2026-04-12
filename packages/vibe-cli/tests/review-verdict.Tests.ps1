BeforeAll {
    . "$PSScriptRoot/../utils/review-verdict.ps1"
}

# =============================================================================
# New-ReviewVerdict — constructor from moderator JSON (BDD: JSON schema)
# =============================================================================

Describe 'New-ReviewVerdict' {
    Context 'Happy path — pass verdict with no findings' {
        It 'creates a verdict object from a pass response with empty arrays' {
            $json = @{
                selectedReviewers = @('security', 'bug')
                excludedReviewers = @(
                    @{ reviewer = 'ai-agent'; reason = 'No agent prompts in diff' }
                )
                verdict  = 'pass'
                blockers = @()
                notes    = @()
            }
            $result = New-ReviewVerdict -ModeratorResponse $json
            $result.Verdict | Should -Be 'pass'
            $result.Blockers.Count | Should -Be 0
            $result.Notes.Count | Should -Be 0
            $result.SelectedReviewers | Should -Contain 'security'
            $result.SelectedReviewers | Should -Contain 'bug'
        }
    }

    Context 'Happy path — fail verdict with blockers and notes' {
        It 'creates a verdict with blockers from critical/high findings' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'fail'
                blockers = @(
                    @{
                        reviewer    = 'security'
                        severity    = 'critical'
                        description = 'SQL injection in query builder'
                        files       = @('src/db.ts')
                        suggestion  = 'Use parameterized queries'
                    }
                )
                notes = @()
            }
            $result = New-ReviewVerdict -ModeratorResponse $json
            $result.Verdict | Should -Be 'fail'
            $result.Blockers.Count | Should -Be 1
            $result.Blockers[0].Reviewer | Should -Be 'security'
            $result.Blockers[0].Severity | Should -Be 'critical'
            $result.Blockers[0].Description | Should -Be 'SQL injection in query builder'
            $result.Blockers[0].Files | Should -Contain 'src/db.ts'
            $result.Blockers[0].Suggestion | Should -Be 'Use parameterized queries'
        }

        It 'creates a verdict with notes from medium/low findings' {
            $json = @{
                selectedReviewers = @('simplicity')
                excludedReviewers = @()
                verdict  = 'pass'
                blockers = @()
                notes    = @(
                    @{
                        reviewer    = 'simplicity'
                        severity    = 'low'
                        description = 'Consider extracting helper function'
                        files       = @('src/handler.ts')
                        suggestion  = 'Extract to utils/helper.ts'
                    }
                )
            }
            $result = New-ReviewVerdict -ModeratorResponse $json
            $result.Notes.Count | Should -Be 1
            $result.Notes[0].Severity | Should -Be 'low'
        }
    }

    Context 'Excluded reviewers are preserved' {
        It 'stores excluded reviewer name and reason' {
            $json = @{
                selectedReviewers = @('bug')
                excludedReviewers = @(
                    @{ reviewer = 'ai-agent'; reason = 'No agent prompts in diff' }
                    @{ reviewer = 'a11y'; reason = 'No UI components in diff' }
                )
                verdict  = 'pass'
                blockers = @()
                notes    = @()
            }
            $result = New-ReviewVerdict -ModeratorResponse $json
            $result.ExcludedReviewers.Count | Should -Be 2
            $result.ExcludedReviewers[0].Reviewer | Should -Be 'ai-agent'
            $result.ExcludedReviewers[0].Reason | Should -Be 'No agent prompts in diff'
        }
    }
}

# =============================================================================
# Test-ReviewVerdict — schema validation (BDD: JSON schema, TLA+ TypeOK)
# =============================================================================

Describe 'Test-ReviewVerdict' {
    Context 'Valid responses pass validation' {
        It 'accepts a well-formed pass verdict' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'pass'
                blockers = @()
                notes    = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $true
        }

        It 'accepts a well-formed fail verdict with blockers' {
            $json = @{
                selectedReviewers = @('bug')
                excludedReviewers = @()
                verdict  = 'fail'
                blockers = @(
                    @{
                        reviewer    = 'bug'
                        severity    = 'high'
                        description = 'Off-by-one error'
                        files       = @('src/loop.ts')
                        suggestion  = 'Use < instead of <='
                    }
                )
                notes = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $true
        }
    }

    Context 'Missing required top-level fields fail validation' {
        It 'rejects response missing "verdict" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                blockers = @()
                notes    = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects response missing "blockers" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict = 'pass'
                notes   = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects response missing "notes" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'pass'
                blockers = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects response missing "selectedReviewers" field' {
            $json = @{
                excludedReviewers = @()
                verdict  = 'pass'
                blockers = @()
                notes    = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects response missing "excludedReviewers" field' {
            $json = @{
                selectedReviewers = @('security')
                verdict  = 'pass'
                blockers = @()
                notes    = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }
    }

    Context 'Invalid verdict values fail validation' {
        It 'rejects verdict value "maybe"' {
            $json = @{
                selectedReviewers = @()
                excludedReviewers = @()
                verdict  = 'maybe'
                blockers = @()
                notes    = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects empty string verdict' {
            $json = @{
                selectedReviewers = @()
                excludedReviewers = @()
                verdict  = ''
                blockers = @()
                notes    = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }
    }

    Context 'Blocker field validation (BDD line 342)' {
        It 'rejects blocker missing "reviewer" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'fail'
                blockers = @(
                    @{
                        severity    = 'critical'
                        description = 'Missing auth check'
                        files       = @('src/api.ts')
                        suggestion  = 'Add auth middleware'
                    }
                )
                notes = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects blocker missing "severity" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'fail'
                blockers = @(
                    @{
                        reviewer    = 'security'
                        description = 'Missing auth check'
                        files       = @('src/api.ts')
                        suggestion  = 'Add auth middleware'
                    }
                )
                notes = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects blocker missing "description" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'fail'
                blockers = @(
                    @{
                        reviewer   = 'security'
                        severity   = 'critical'
                        files      = @('src/api.ts')
                        suggestion = 'Add auth middleware'
                    }
                )
                notes = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects blocker missing "files" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'fail'
                blockers = @(
                    @{
                        reviewer    = 'security'
                        severity    = 'critical'
                        description = 'Missing auth check'
                        suggestion  = 'Add auth middleware'
                    }
                )
                notes = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }

        It 'rejects blocker missing "suggestion" field' {
            $json = @{
                selectedReviewers = @('security')
                excludedReviewers = @()
                verdict  = 'fail'
                blockers = @(
                    @{
                        reviewer    = 'security'
                        severity    = 'critical'
                        description = 'Missing auth check'
                        files       = @('src/api.ts')
                    }
                )
                notes = @()
            }
            $result = Test-ReviewVerdict -ModeratorResponse $json
            $result | Should -Be $false
        }
    }

    Context 'Null and empty input' {
        It 'rejects null input' {
            $result = Test-ReviewVerdict -ModeratorResponse $null
            $result | Should -Be $false
        }

        It 'rejects empty hashtable' {
            $result = Test-ReviewVerdict -ModeratorResponse @{}
            $result | Should -Be $false
        }
    }
}

# =============================================================================
# Get-VerdictSummary — human-readable summary for pipeline.log (BDD line 1081-1084)
# =============================================================================

Describe 'Get-VerdictSummary' {
    It 'returns summary string with verdict, blocker count, and note count' {
        $verdict = @{
            Verdict  = 'fail'
            Blockers = @(
                @{ Reviewer = 'security'; Severity = 'critical'; Description = 'SQL injection'; Files = @('db.ts'); Suggestion = 'fix' }
            )
            Notes = @(
                @{ Reviewer = 'simplicity'; Severity = 'low'; Description = 'Extract helper'; Files = @('a.ts'); Suggestion = 'refactor' }
                @{ Reviewer = 'test'; Severity = 'medium'; Description = 'Add edge case test'; Files = @('b.ts'); Suggestion = 'add test' }
            )
            SelectedReviewers = @('security', 'simplicity', 'test')
            ExcludedReviewers = @()
        }
        $summary = Get-VerdictSummary -Verdict $verdict
        $summary | Should -Match 'fail'
        $summary | Should -Match '1 blocker'
        $summary | Should -Match '2 note'
    }

    It 'returns summary for a pass verdict with zero blockers' {
        $verdict = @{
            Verdict  = 'pass'
            Blockers = @()
            Notes    = @()
            SelectedReviewers = @('bug')
            ExcludedReviewers = @()
        }
        $summary = Get-VerdictSummary -Verdict $verdict
        $summary | Should -Match 'pass'
        $summary | Should -Match '0 blocker'
    }
}

# =============================================================================
# ConvertTo-ReviewVerdict — parse raw JSON string into verdict (integration w/ response-parser)
# =============================================================================

Describe 'ConvertTo-ReviewVerdict' {
    It 'parses a valid JSON string into a verdict object' {
        $jsonString = @{
            selectedReviewers = @('security')
            excludedReviewers = @()
            verdict  = 'pass'
            blockers = @()
            notes    = @()
        } | ConvertTo-Json -Depth 5

        $result = ConvertTo-ReviewVerdict -JsonString $jsonString
        $result.Verdict | Should -Be 'pass'
    }

    It 'returns $null for invalid JSON string' {
        $result = ConvertTo-ReviewVerdict -JsonString 'this is not json'
        $result | Should -BeNullOrEmpty
    }

    It 'returns $null for valid JSON with wrong schema' {
        $jsonString = '{"foo": "bar"}'
        $result = ConvertTo-ReviewVerdict -JsonString $jsonString
        $result | Should -BeNullOrEmpty
    }

    It 'returns $null for empty string' {
        $result = ConvertTo-ReviewVerdict -JsonString ''
        $result | Should -BeNullOrEmpty
    }

    It 'returns $null for $null input' {
        $result = ConvertTo-ReviewVerdict -JsonString $null
        $result | Should -BeNullOrEmpty
    }
}

# =============================================================================
# Severity classification helpers (BDD: critical/high → blocker, medium/low → note)
# =============================================================================

Describe 'Test-BlockerSeverity' {
    It 'returns $true for "critical"' {
        Test-BlockerSeverity -Severity 'critical' | Should -Be $true
    }

    It 'returns $true for "high"' {
        Test-BlockerSeverity -Severity 'high' | Should -Be $true
    }

    It 'returns $false for "medium"' {
        Test-BlockerSeverity -Severity 'medium' | Should -Be $false
    }

    It 'returns $false for "low"' {
        Test-BlockerSeverity -Severity 'low' | Should -Be $false
    }

    It 'returns $false for unknown severity' {
        Test-BlockerSeverity -Severity 'info' | Should -Be $false
    }
}
