BeforeAll {
    # Stub external dependencies before sourcing
    function Write-PipelineLog { }
    function Invoke-Claude { }

    . "$PSScriptRoot/../utils/review-loop.ps1"
}

# =============================================================================
# Invoke-ReviewLoop — dispatches review-moderator and handles verdict cycles
# =============================================================================

Describe 'Invoke-ReviewLoop' {
    BeforeEach {
        $script:featureDir = Join-Path $TestDrive 'docs' 'my-feature'
        New-Item -Path $script:featureDir -ItemType Directory -Force | Out-Null
        $script:root = $TestDrive
        $script:diff = "diff --git a/file.ts b/file.ts`n+added line"
    }

    Context 'Dispatches review-moderator agent' {
        It 'calls Invoke-Claude with the diff content' {
            $invokedWith = $null
            Mock Invoke-Claude {
                $invokedWith = $Prompt
                return '{"verdict":"pass","findings":[],"notes":[],"warnings":[]}'
            }

            Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            Should -Invoke Invoke-Claude -Times 1
        }
    }

    Context 'Verdict "pass" with 0 findings' {
        It 'returns pass and does NOT create user_notes.md' {
            Mock Invoke-Claude {
                return '{"verdict":"pass","findings":[],"notes":[],"warnings":[]}'
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'pass'
            $result.Blockers | Should -HaveCount 0
            $result.Notes | Should -HaveCount 0
            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            Test-Path $notesPath | Should -BeFalse
        }
    }

    Context 'Verdict "pass" with notes (medium/low findings)' {
        It 'returns pass AND appends notes to user_notes.md' {
            Mock Invoke-Claude {
                return (@{
                    verdict  = 'pass'
                    findings = @()
                    notes    = @(
                        @{
                            reviewer    = 'simplicity'
                            severity    = 'medium'
                            description = 'Consider extracting helper'
                            suggestion  = 'Move to utils/helper.ts'
                        }
                    )
                    warnings = @()
                } | ConvertTo-Json -Depth 5 -Compress)
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'pass'
            $result.Notes | Should -HaveCount 1

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            Test-Path $notesPath | Should -BeTrue
            $content = Get-Content $notesPath -Raw
            $content | Should -Match 'simplicity'
            $content | Should -Match 'medium'
            $content | Should -Match 'Consider extracting helper'
            $content | Should -Match 'Move to utils/helper.ts'
        }

        It 'each note includes reviewer name, severity, description, suggestion' {
            Mock Invoke-Claude {
                return (@{
                    verdict  = 'pass'
                    findings = @()
                    notes    = @(
                        @{
                            reviewer    = 'bug-hunter'
                            severity    = 'low'
                            description = 'Potential null ref'
                            suggestion  = 'Add null check'
                        }
                    )
                    warnings = @()
                } | ConvertTo-Json -Depth 5 -Compress)
            }

            Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            $content = Get-Content $notesPath -Raw
            $content | Should -Match '### bug-hunter \(low\)'
            $content | Should -Match 'Potential null ref'
            $content | Should -Match '\*\*Suggestion:\*\* Add null check'
        }
    }

    Context 'Verdict "fail" returns fail with blocker details' {
        It 'returns fail with critical/high findings as blockers' {
            Mock Invoke-Claude {
                return (@{
                    verdict  = 'fail'
                    findings = @(
                        @{
                            reviewer    = 'security'
                            severity    = 'critical'
                            description = 'SQL injection vulnerability'
                            suggestion  = 'Use parameterized queries'
                        }
                    )
                    notes    = @()
                    warnings = @()
                } | ConvertTo-Json -Depth 5 -Compress)
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'fail'
            $result.Blockers | Should -HaveCount 1
            $result.Blockers[0].reviewer | Should -BeExactly 'security'
            $result.Blockers[0].severity | Should -BeExactly 'critical'
            $result.Blockers[0].description | Should -BeExactly 'SQL injection vulnerability'
        }
    }

    Context 'Round count tracking — escalates at MaxReviewRounds' {
        It 'escalates when CurrentRound reaches MaxReviewRounds on fail' {
            Mock Invoke-Claude {
                return (@{
                    verdict  = 'fail'
                    findings = @(
                        @{
                            reviewer    = 'security'
                            severity    = 'high'
                            description = 'Persistent issue'
                            suggestion  = 'Fix it'
                        }
                    )
                    notes    = @()
                    warnings = @()
                } | ConvertTo-Json -Depth 5 -Compress)
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root -MaxReviewRounds 3 -CurrentRound 3

            $result.Verdict | Should -BeExactly 'escalated'
            $result.Round | Should -BeExactly 3
        }

        It 'returns round number in result' {
            Mock Invoke-Claude {
                return '{"verdict":"pass","findings":[],"notes":[],"warnings":[]}'
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Round | Should -BeExactly 1
        }
    }

    Context 'Escalation + Keep Going: Write-UserNotes appends "Unresolved Escalated Blocker"' {
        It 'writes escalated blocker notes to user_notes.md on escalation' {
            Mock Invoke-Claude {
                return (@{
                    verdict  = 'fail'
                    findings = @(
                        @{
                            reviewer    = 'security'
                            severity    = 'high'
                            description = 'Unresolved issue'
                            suggestion  = 'Needs manual review'
                        }
                    )
                    notes    = @()
                    warnings = @()
                } | ConvertTo-Json -Depth 5 -Compress)
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root -MaxReviewRounds 1 -CurrentRound 1

            $result.Verdict | Should -BeExactly 'escalated'

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            Test-Path $notesPath | Should -BeTrue
            $content = Get-Content $notesPath -Raw
            $content | Should -Match 'Unresolved Escalated Blocker'
            $content | Should -Match 'security'
        }
    }

    Context 'Moderator timeout treats as pass with warning' {
        It 'returns pass with warning when Invoke-Claude returns null (timeout)' {
            Mock Invoke-Claude { return $null }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'pass'
            $result.Warnings | Should -HaveCount 1
            $result.Warnings[0] | Should -Match -RegularExpression 'timeout|empty'
        }
    }

    Context 'Malformed response logs warning and treats as pass' {
        It 'returns pass with warning on invalid JSON response' {
            Mock Invoke-Claude { return 'not valid json {{{' }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'pass'
            $result.Warnings | Should -HaveCount 1
            $result.Warnings[0] | Should -Match -RegularExpression 'malformed|parse|invalid'
        }

        It 'returns pass with warning on JSON missing required fields' {
            Mock Invoke-Claude { return '{"some":"random","data":true}' }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'pass'
            $result.Warnings | Should -HaveCount 1
        }
    }

    Context 'Compound timeout: moderator timeout produces pass with warning + note' {
        It 'returns pass with warning when moderator returns empty on all rounds' {
            Mock Invoke-Claude { return $null }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'pass'
            $result.Warnings.Count | Should -BeGreaterOrEqual 1
        }
    }
}

# =============================================================================
# Write-UserNotes — appends findings to user_notes.md
# =============================================================================

Describe 'Write-UserNotes' {
    BeforeEach {
        $script:featureDir = Join-Path $TestDrive 'docs' 'write-notes-feature'
        New-Item -Path $script:featureDir -ItemType Directory -Force | Out-Null
    }

    Context 'Creates user_notes.md on first write' {
        It 'creates the file if it does not exist' {
            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            Test-Path $notesPath | Should -BeFalse

            Write-UserNotes -FeatureDir $script:featureDir -Notes @(
                @{
                    reviewer    = 'simplicity'
                    severity    = 'medium'
                    description = 'Too complex'
                    suggestion  = 'Simplify'
                }
            )

            Test-Path $notesPath | Should -BeTrue
        }
    }

    Context 'Subsequent writes append without modifying prior entries' {
        It 'preserves existing content and appends new notes' {
            $notesPath = Join-Path $script:featureDir 'user_notes.md'

            Write-UserNotes -FeatureDir $script:featureDir -Notes @(
                @{
                    reviewer    = 'first-reviewer'
                    severity    = 'low'
                    description = 'First note'
                    suggestion  = 'First suggestion'
                }
            )

            $firstContent = Get-Content $notesPath -Raw

            Write-UserNotes -FeatureDir $script:featureDir -Notes @(
                @{
                    reviewer    = 'second-reviewer'
                    severity    = 'medium'
                    description = 'Second note'
                    suggestion  = 'Second suggestion'
                }
            )

            $fullContent = Get-Content $notesPath -Raw
            # First entry still present
            $fullContent | Should -Match 'first-reviewer'
            $fullContent | Should -Match 'First note'
            # Second entry appended
            $fullContent | Should -Match 'second-reviewer'
            $fullContent | Should -Match 'Second note'
        }
    }

    Context 'Escalated blocker format' {
        It 'marks entries as "Unresolved Escalated Blocker" with -EscalatedBlocker' {
            Write-UserNotes -FeatureDir $script:featureDir -Notes @(
                @{
                    reviewer    = 'security'
                    severity    = 'high'
                    description = 'Critical unresolved issue'
                    suggestion  = 'Needs manual review'
                }
            ) -EscalatedBlocker

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            $content = Get-Content $notesPath -Raw
            $content | Should -Match 'Unresolved Escalated Blocker'
            $content | Should -Match 'security'
            $content | Should -Match 'Critical unresolved issue'
            $content | Should -Match '\*\*Suggestion:\*\* Needs manual review'
        }
    }

    Context 'Empty notes array is a no-op' {
        It 'does not create file when notes array is empty' {
            Write-UserNotes -FeatureDir $script:featureDir -Notes @()

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            Test-Path $notesPath | Should -BeFalse
        }
    }

    Context 'Note format structure' {
        It 'formats each note with ### header, description, and suggestion' {
            Write-UserNotes -FeatureDir $script:featureDir -Notes @(
                @{
                    reviewer    = 'perf-checker'
                    severity    = 'medium'
                    description = 'O(n^2) loop detected'
                    suggestion  = 'Use a hash map for O(n) lookup'
                }
            )

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            $content = Get-Content $notesPath -Raw
            $content | Should -Match '### perf-checker \(medium\)'
            $content | Should -Match 'O\(n\^2\) loop detected'
            $content | Should -Match '\*\*Suggestion:\*\* Use a hash map for O\(n\) lookup'
        }
    }
}
