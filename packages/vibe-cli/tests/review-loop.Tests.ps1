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
        $script:featureDir = Join-Path -Path $TestDrive -ChildPath 'docs' 'my-feature'
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

        It 'passes -JsonSchema to Invoke-Claude' {
            $script:capturedSchema = $null
            Mock Invoke-Claude {
                $script:capturedSchema = $JsonSchema
                return '{"verdict":"pass","findings":[],"notes":[],"warnings":[]}'
            }

            Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $script:capturedSchema | Should -Not -BeNullOrEmpty
            $script:capturedSchema | Should -Match '"verdict"'
            $script:capturedSchema | Should -Match '"enum":\["pass","fail"\]'
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

    Context 'Round number tracking' {
        It 'returns round number in result' {
            Mock Invoke-Claude {
                return '{"verdict":"pass","findings":[],"notes":[],"warnings":[]}'
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Round | Should -BeExactly 1
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

    Context 'Warnings array parsed from response (L98-101)' {
        It 'returns warnings array when present in response' {
            Mock Invoke-Claude {
                return (@{
                    verdict  = 'pass'
                    findings = @()
                    notes    = @()
                    warnings = @('watch out for flaky test', 'slow query detected')
                } | ConvertTo-Json -Depth 5 -Compress)
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'pass'
            $result.Warnings | Should -HaveCount 2
            $result.Warnings[0] | Should -BeExactly 'watch out for flaky test'
        }

        It 'returns fail verdict with warnings (L126-128)' {
            Mock Invoke-Claude {
                return (@{
                    verdict  = 'fail'
                    findings = @(@{ reviewer = 'bug'; severity = 'high'; description = 'bug'; suggestion = 'fix' })
                    notes    = @()
                    warnings = @('review took long')
                } | ConvertTo-Json -Depth 5 -Compress)
            }

            $result = Invoke-ReviewLoop -DiffContent $script:diff -FeatureDir $script:featureDir -Root $script:root

            $result.Verdict | Should -BeExactly 'fail'
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
# Write-UserNote — appends findings to user_notes.md
# =============================================================================

Describe 'Write-UserNote' {
    BeforeEach {
        $script:featureDir = Join-Path -Path $TestDrive -ChildPath 'docs' 'write-notes-feature'
        New-Item -Path $script:featureDir -ItemType Directory -Force | Out-Null
    }

    Context 'Creates user_notes.md on first write' {
        It 'creates the file if it does not exist' {
            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            Test-Path $notesPath | Should -BeFalse

            Write-UserNote -FeatureDir $script:featureDir -Notes @(
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

            Write-UserNote -FeatureDir $script:featureDir -Notes @(
                @{
                    reviewer    = 'first-reviewer'
                    severity    = 'low'
                    description = 'First note'
                    suggestion  = 'First suggestion'
                }
            )

            $firstContent = Get-Content $notesPath -Raw

            Write-UserNote -FeatureDir $script:featureDir -Notes @(
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
            Write-UserNote -FeatureDir $script:featureDir -Notes @(
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

    Context 'Write-UserNote defaults for missing fields (L159-162)' {
        It 'uses "unknown" for missing reviewer and severity, empty for description and suggestion' {
            Write-UserNote -FeatureDir $script:featureDir -Notes @(
                @{}
            )

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            $content = Get-Content $notesPath -Raw
            $content | Should -Match '### unknown \(unknown\)'
        }

        It 'omits suggestion line when suggestion is empty' {
            Write-UserNote -FeatureDir $script:featureDir -Notes @(
                @{
                    reviewer    = 'test-rev'
                    severity    = 'low'
                    description = 'Some desc'
                }
            )

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            $content = Get-Content $notesPath -Raw
            $content | Should -Match 'test-rev'
            $content | Should -Not -Match '\*\*Suggestion:\*\*'
        }
    }

    Context 'Empty notes array is a no-op' {
        It 'does not create file when notes array is empty' {
            Write-UserNote -FeatureDir $script:featureDir -Notes @()

            $notesPath = Join-Path $script:featureDir 'user_notes.md'
            Test-Path $notesPath | Should -BeFalse
        }
    }

    Context 'Note format structure' {
        It 'formats each note with ### header, description, and suggestion' {
            Write-UserNote -FeatureDir $script:featureDir -Notes @(
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
