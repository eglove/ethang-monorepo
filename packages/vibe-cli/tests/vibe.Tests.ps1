BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
}

Describe 'vibe.ps1 parameter validation' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
        Mock Set-Content {}
    }

    It 'throws when Stage > 1 and no Feature provided' {
        { & "$PSScriptRoot/../vibe.ps1" -Stage 2 } |
            Should -Throw '*requires -Feature*'
    }

    It 'throws when Stage > 1 and Feature dir missing' {
        { & "$PSScriptRoot/../vibe.ps1" -Stage 2 -Feature 'nonexistent-feature-xyz' } |
            Should -Throw '*not found*'
    }

    It 'throws when no Seed provided for fresh run' {
        { & "$PSScriptRoot/../vibe.ps1" } |
            Should -Throw '*seed prompt is required*'
    }
}

Describe 'Resolve-PipelineState edge cases' {
    BeforeAll {
        # Stub: pipeline-state.ps1 was removed in code-simplify
        function global:Resolve-PipelineState {
            param([int]$FromStage, [string]$Dir)
            $result = @{}
            $result.FeatureDir = $Dir
            if ($FromStage -le 1) { return $result }
            # Stage 2+: Briefing
            $elicitor = Join-Path $Dir 'elicitor.md'
            if (-not (Test-Path $elicitor)) { throw "missing elicitor.md in $Dir" }
            $result.Briefing = Get-Content $elicitor -Raw
            if ($FromStage -le 2) { return $result }
            # Stage 3+: GherkinFile
            $bdd = Join-Path $Dir 'bdd.feature'
            if (-not (Test-Path $bdd)) { throw "missing bdd.feature in $Dir" }
            $result.GherkinFile = $bdd
            if ($FromStage -le 4) { return $result }
            # Stage 5+: TLA
            $tlaDir = Join-Path $Dir 'tla'
            $tlaFile = Get-ChildItem $tlaDir -Filter '*.tla' -ErrorAction SilentlyContinue | Select-Object -First 1
            if (-not $tlaFile) { throw "missing TLA+ spec in $Dir" }
            $result.TlaFile = $tlaFile.FullName
            $result.TlaDir = $tlaDir
            if ($FromStage -le 6) { return $result }
            # Stage 7+: Implementation plan
            $implMd = Join-Path $Dir 'implementation-plan.md'
            if (-not (Test-Path $implMd)) { throw "missing implementation-plan.md in $Dir" }
            $result.ImplFile = $implMd
            $implJson = Join-Path $Dir 'implementation-plan.json'
            if (-not (Test-Path $implJson)) { throw "missing implementation-plan.json in $Dir" }
            $result.ImplJson = $implJson
            if ($FromStage -le 7) { return $result }
            # Stage 8: logs
            $logsDir = Join-Path $Dir 'logs'
            if (-not (Test-Path $logsDir)) { throw "missing logs directory in $Dir" }
            $implJsonContent = Get-Content $implJson -Raw | ConvertFrom-Json
            $result.Plan = $implJsonContent
            $result.CompletedTasks = @()
            $result.MergedTasks = @()
            return $result
        }

        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "vibestate-test-$(Get-Random)"
        New-Item -ItemType Directory -Path $script:tempDir -Force | Out-Null
        Set-Content (Join-Path $script:tempDir 'elicitor.md') -Value '# Briefing'
    }

    AfterAll {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns only FeatureDir for stage 1' {
        $state = Resolve-PipelineState -FromStage 1 -Dir $script:tempDir
        $state.FeatureDir | Should -Be $script:tempDir
        $state.Keys.Count | Should -Be 1
    }

    It 'includes Briefing for stage 2' {
        $state = Resolve-PipelineState -FromStage 2 -Dir $script:tempDir
        $state.Briefing | Should -Not -BeNullOrEmpty
    }

    It 'returns GherkinFile for stage 4 (between 3 and 5)' {
        Set-Content (Join-Path $script:tempDir 'bdd.feature') -Value 'Feature: test'
        $state = Resolve-PipelineState -FromStage 4 -Dir $script:tempDir
        $state.GherkinFile | Should -Match 'bdd\.feature'
        $state.TlaFile | Should -BeNullOrEmpty
    }

    It 'returns TlaFile for stage 6 (between 5 and 7)' {
        $tlaDir = Join-Path $script:tempDir 'tla'
        New-Item -ItemType Directory -Path $tlaDir -Force | Out-Null
        Set-Content (Join-Path $tlaDir 'Spec.tla') -Value '---- MODULE Spec ----'

        $state = Resolve-PipelineState -FromStage 6 -Dir $script:tempDir
        $state.TlaFile | Should -Not -BeNullOrEmpty
        $state.ImplFile | Should -BeNullOrEmpty
    }

    It 'returns all state for stage 7+' {
        Set-Content (Join-Path $script:tempDir 'implementation-plan.md') -Value '# Plan'
        Set-Content (Join-Path $script:tempDir 'implementation-plan.json') -Value '{}'

        $state = Resolve-PipelineState -FromStage 7 -Dir $script:tempDir
        $state.FeatureDir | Should -Be $script:tempDir
        $state.Briefing | Should -Not -BeNullOrEmpty
        $state.GherkinFile | Should -Not -BeNullOrEmpty
        $state.TlaFile | Should -Not -BeNullOrEmpty
        $state.ImplFile | Should -Match 'implementation-plan\.md'
        $state.ImplJson | Should -Match 'implementation-plan\.json'
    }

    It 'throws when impl json missing but impl md exists for stage 7' {
        $partialDir = Join-Path $script:tempDir 'partial'
        New-Item -ItemType Directory -Path $partialDir -Force | Out-Null
        Set-Content (Join-Path $partialDir 'elicitor.md') -Value '# Brief'
        Set-Content (Join-Path $partialDir 'bdd.feature') -Value 'Feature: t'
        $ptla = Join-Path $partialDir 'tla'
        New-Item -ItemType Directory -Path $ptla -Force | Out-Null
        Set-Content (Join-Path $ptla 'S.tla') -Value '---- MODULE S ----'
        Set-Content (Join-Path $partialDir 'implementation-plan.md') -Value '# Plan'

        { Resolve-PipelineState -FromStage 7 -Dir $partialDir } |
            Should -Throw '*missing*implementation-plan.json*'

        Remove-Item $partialDir -Recurse -Force
    }
}

Describe 'debate-loop.ps1 debateSchema' {
    It 'has valid JSON debate schema' {
        $content = Get-Content "$PSScriptRoot/../utils/debate-loop.ps1" -Raw
        $schemaMatch = [regex]::Match($content, "(?s)\`$DebateSchema = @'`n(.+?)`n'@")
        $schemaMatch.Success | Should -BeTrue

        $schema = $schemaMatch.Groups[1].Value | ConvertFrom-Json
        $schema.type | Should -Be 'object'
        $schema.properties.result | Should -Not -BeNullOrEmpty
        $schema.required | Should -Contain 'result'
    }
}

Describe 'vibe.ps1 pipeline execution' {
    BeforeAll {
        . "$PSScriptRoot/../utils/config.ps1"
        . "$PSScriptRoot/../utils/debate-loop.ps1"
        . "$PSScriptRoot/../utils/tlc-runner.ps1"
        . "$PSScriptRoot/../stages/1-elicitor.ps1"
        . "$PSScriptRoot/../stages/2-bdd-writer.ps1"
        . "$PSScriptRoot/../stages/3-bdd-debate.ps1"
        . "$PSScriptRoot/../stages/4-tla-writer.ps1"
        . "$PSScriptRoot/../stages/5-tla-debate.ps1"
        . "$PSScriptRoot/../stages/6-implementation-writer.ps1"
        . "$PSScriptRoot/../stages/7-implementation-debate.ps1"
        # Define stub for Invoke-CodingStage so Pester can mock it
        function global:Invoke-CodingStage { param($Feature, $Root, [switch]$Resume) }
        Mock Write-PipelineLog {}
        Mock Write-Host {}

        $script:vibeRoot = Resolve-Path "$PSScriptRoot/.."
        $script:createdDirs = [System.Collections.ArrayList]::new()
    }

    AfterAll {
        # Clean up any test dirs created under the project tree
        foreach ($dir in $script:createdDirs) {
            Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    It 'runs full pipeline from stage 1 through stage 7' {
        $featureName = "test-e2e-$(Get-Random)"
        $featureDir = Join-Path $script:vibeRoot "docs/$featureName"
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        $null = $script:createdDirs.Add($featureDir)
        # Create .feature file so BDD fixture generation works (T10)
        Set-Content (Join-Path $featureDir 'bdd.feature') -Value "Feature: Test`n  Scenario: S`n    Given x"
        # Create BDD fixture so stage 8 precondition passes
        $bddFixDir = Join-Path $script:vibeRoot "fixtures/$featureName"
        New-Item -ItemType Directory -Path $bddFixDir -Force | Out-Null
        $null = $script:createdDirs.Add($bddFixDir)
        @{ schemaVersion = 1; features = @() } | ConvertTo-Json | Set-Content (Join-Path $bddFixDir 'bdd.json')

        Mock Invoke-Elicitor {
            @{ FeatureDir = $featureDir; Briefing = 'test briefing' }
        }
        Mock Invoke-BddWriter { "$featureDir/bdd.feature" }
        Mock Invoke-BddDebate {}
        Mock Invoke-TlaWriter {
            @{
                TlaFile = [PSCustomObject]@{ FullName = "$featureDir/tla/Spec.tla" }
                TlaDir  = "$featureDir/tla"
            }
        }
        Mock Invoke-TlaDebate {}
        Mock Invoke-ImplementationWriter {
            @{
                ImplFile = "$featureDir/implementation-plan.md"
                ImplJson = "$featureDir/implementation-plan.json"
            }
        }
        Mock Invoke-ImplementationDebate {}
        Mock Invoke-CodingStage { @{ PipelineStatus = 'completed' } }

        & "$PSScriptRoot/../vibe.ps1" "test seed"

        Should -Invoke Invoke-Elicitor -Times 1
        Should -Invoke Invoke-BddWriter -Times 1
        Should -Invoke Invoke-BddDebate -Times 1
        Should -Invoke Invoke-TlaWriter -Times 1
        Should -Invoke Invoke-TlaDebate -Times 1
        Should -Invoke Invoke-ImplementationWriter -Times 1
        Should -Invoke Invoke-ImplementationDebate -Times 1

        Remove-Item $featureDir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $script:vibeRoot "fixtures/$featureName") -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'resumes at stage 3 skipping earlier stages' {
        $featureName = "test-resume-$(Get-Random)"
        $featureDir = Join-Path $script:vibeRoot "docs/$featureName"
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        $null = $script:createdDirs.Add($featureDir)
        Set-Content (Join-Path $featureDir 'elicitor.md') -Value '# Test briefing'
        Set-Content (Join-Path $featureDir 'bdd.feature') -Value 'Feature: test'
        # Create BDD fixture so stage 8 precondition passes
        $bddFixDir = Join-Path $script:vibeRoot "fixtures/$featureName"
        New-Item -ItemType Directory -Path $bddFixDir -Force | Out-Null
        $null = $script:createdDirs.Add($bddFixDir)
        @{ schemaVersion = 1; features = @() } | ConvertTo-Json | Set-Content (Join-Path $bddFixDir 'bdd.json')
        New-Item -ItemType Directory -Path (Join-Path $featureDir 'tla') -Force | Out-Null
        Set-Content (Join-Path $featureDir 'tla/Spec.tla') -Value '---- MODULE Spec ----'

        Mock Invoke-BddDebate {}
        Mock Invoke-TlaWriter {
            @{
                TlaFile = [PSCustomObject]@{ FullName = "$featureDir/tla/Spec.tla" }
                TlaDir  = "$featureDir/tla"
            }
        }
        Mock Invoke-TlaDebate {}
        Mock Invoke-ImplementationWriter {
            @{
                ImplFile = "$featureDir/implementation-plan.md"
                ImplJson = "$featureDir/implementation-plan.json"
            }
        }
        Mock Invoke-ImplementationDebate {}
        Mock Invoke-CodingStage { @{ PipelineStatus = 'completed' } }

        & "$PSScriptRoot/../vibe.ps1" -Stage 3 -Feature $featureName

        Should -Invoke Invoke-BddDebate -Times 1
        Should -Invoke Invoke-TlaWriter -Times 1

        Remove-Item $featureDir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $script:vibeRoot "fixtures/$featureName") -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'catch block logs error and re-throws on stage failure' {
        $featureName = "test-error-$(Get-Random)"
        $featureDir = Join-Path $script:vibeRoot "docs/$featureName"
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        $null = $script:createdDirs.Add($featureDir)

        Mock Invoke-Elicitor { throw 'Elicitor exploded' }

        { & "$PSScriptRoot/../vibe.ps1" "boom seed" } |
            Should -Throw '*Elicitor exploded*'

        Remove-Item $featureDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Describe 'Resume-Pipeline' {
    BeforeAll {
        . "$PSScriptRoot/../utils/config.ps1"
        # Stub: pipeline-state.ps1 was removed in code-simplify
        function global:New-PipelineState {
            return @{
                pipelineState      = 'idle'
                lockHolder         = $null
                reviewRound        = [int]0
                keepGoingResets    = [int]0
                tddKeepGoingCount = [int]0
                verdict            = $null
                tasksDone          = [int]0
                gateTimedOut       = $false
                globalTimedOut     = $false
                reviewGateType     = 'none'
            }
        }
        function global:Read-IdempotencyToken {
            param([string]$LogPath)
            $tokens = [System.Collections.Generic.HashSet[string]]::new()
            if (-not (Test-Path $LogPath)) { return $tokens }
            foreach ($line in (Get-Content $LogPath)) {
                if ($line -match 'INVOKE-CLAUDE\s+(INVOKE|COMPLETE)\s+stage=(\S+)') {
                    $null = $tokens.Add("$($Matches[1]):$($Matches[2])")
                }
            }
            return $tokens
        }
        function global:Test-IdempotencyComplete {
            param($Tokens, [string]$Stage)
            return ($Tokens.Contains("INVOKE:$Stage") -and $Tokens.Contains("COMPLETE:$Stage"))
        }
        . "$PSScriptRoot/../utils/pipeline-lock.ps1"
        . "$PSScriptRoot/../utils/resume.ps1"
    }

    BeforeEach {
        $script:tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "resume-test-$(Get-Random)"
        $script:lockDir = Join-Path $script:tempDir 'locks'
        $script:logPath = Join-Path $script:tempDir 'pipeline.log'
        $script:docsDir = Join-Path $script:tempDir 'docs'
        New-Item -ItemType Directory -Path $script:lockDir -Force | Out-Null
        New-Item -ItemType Directory -Path $script:docsDir -Force | Out-Null

        # Create valid lock file within budget
        @{ pid = $PID; startTime = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o'); crashCount = 0 } |
            ConvertTo-Json | Set-Content (Join-Path $script:lockDir 'pipeline.lock')
    }

    AfterEach {
        Remove-Item $script:tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'detects feature name from PIPELINE START line' {
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.Feature | Should -BeExactly 'cleanup'
    }

    It 'detects last completed stage' {
        $log = @(
            "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
            "[2026-04-11 12:01:00] Stage 1 complete"
            "[2026-04-11 12:02:00] Stage 2 complete"
            "[2026-04-11 12:03:00] Stage 3 complete"
        ) -join "`n"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.LastStage | Should -Be 3
        $result.ResumeStage | Should -Be 4
    }

    It 'throws when crash budget is exhausted' {
        @{ pid = 99999; startTime = '2000-01-01T00:00:00Z'; crashCount = 3 } |
            ConvertTo-Json | Set-Content (Join-Path $script:lockDir 'pipeline.lock')
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
        Set-Content $script:logPath -Value $log

        { Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir -MaxCrashes 3 } |
            Should -Throw '*Crash budget exhausted*'
    }

    It 'classifies missing fixtures correctly' {
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.BddFixtureState | Should -BeExactly 'missing'
    }

    It 'classifies valid fixtures correctly' {
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        # Create valid fixture files
        $fixtureBase = Join-Path $script:tempDir 'fixtures/cleanup'
        New-Item -ItemType Directory -Path $fixtureBase -Force | Out-Null
        Set-Content (Join-Path $fixtureBase 'bdd.json') -Value '{"valid": true}'

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.BddFixtureState | Should -BeExactly 'valid'
    }

    It 'classifies corrupt fixtures correctly' {
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        # Create corrupt fixture file
        $fixtureBase = Join-Path $script:tempDir 'fixtures/cleanup'
        New-Item -ItemType Directory -Path $fixtureBase -Force | Out-Null
        Set-Content (Join-Path $fixtureBase 'bdd.json') -Value 'not valid json {{{{'

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.BddFixtureState | Should -BeExactly 'corrupt'
    }

    It 'reuses runId from log' {
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.RunId | Should -BeExactly '20260411T120000-abcd'
    }

    It 'throws when log file does not exist' {
        { Resume-Pipeline -Root $script:tempDir -LogPath 'C:\nonexistent.log' -LockDir $script:lockDir } |
            Should -Throw
    }

    It 'throws when feature name cannot be detected' {
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd no-feature-here"
        Set-Content $script:logPath -Value $log

        { Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir } |
            Should -Throw '*Cannot detect feature name*'
    }

    It 'returns ResumeStage 1 when no stages completed' {
        $log = "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.LastStage | Should -Be 0
        $result.ResumeStage | Should -Be 1
    }

    It 'loads idempotency tokens from log' {
        $log = @(
            "[2026-04-11 12:00:00] PIPELINE START runId=20260411T120000-abcd feature=cleanup version=1"
            "[2026-04-11 12:01:00] runId=20260411T120000-abcd INVOKE-CLAUDE INVOKE stage=elicitor"
            "[2026-04-11 12:02:00] runId=20260411T120000-abcd INVOKE-CLAUDE COMPLETE stage=elicitor"
        ) -join "`n"
        Set-Content $script:logPath -Value $log
        Mock git { return '.git' }
        Mock Test-Path { return $false } -ParameterFilter { $Path -match 'MERGE_HEAD|REBASE_HEAD' }

        $result = Resume-Pipeline -Root $script:tempDir -LogPath $script:logPath -LockDir $script:lockDir
        $result.IdempotencyTokens | Should -Not -BeNullOrEmpty
        $result.IdempotencyTokens.Contains('INVOKE:elicitor') | Should -BeTrue
        $result.IdempotencyTokens.Contains('COMPLETE:elicitor') | Should -BeTrue
    }
}
