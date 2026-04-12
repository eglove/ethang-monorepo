BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/pipeline-log.ps1"
    . "$root/utils/invoke-claude.ps1"
    . "$root/stages/1-elicitor.ps1"
}

Describe 'Invoke-Elicitor stage completion marker' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "elicitor-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $docsDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        New-Item -ItemType Directory -Path "$testRoot/agents/doc-writers" -Force | Out-Null
        Set-Content -Path "$testRoot/agents/doc-writers/elicitor.md" -Value "# Elicitor"
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'writes STAGE_COMPLETE:1:<feature> marker on success' {
        # Create the elicitor output that the function expects to find
        Set-Content -Path "$docsDir/elicitor.md" -Value "# Briefing content"

        # Mock Invoke-Claude to do nothing (interactive mode)
        Mock Invoke-Claude { }

        Invoke-Elicitor -Seed "test prompt" -Root $testRoot

        $logPath = Join-Path $testRoot 'pipeline.log'
        $logPath | Should -Exist
        $content = Get-Content $logPath -Raw
        $content | Should -Match 'STAGE_COMPLETE:1:test-feature'
    }

    It 'does NOT write STAGE_COMPLETE:1 marker when elicitor fails' {
        # Mock Invoke-Claude to do nothing — but no elicitor.md output exists
        Mock Invoke-Claude { }

        # Remove the docs dir so no elicitor output is found
        Remove-Item -Path $docsDir -Recurse -Force

        { Invoke-Elicitor -Seed "test prompt" -Root $testRoot } | Should -Throw

        $logPath = Join-Path $testRoot 'pipeline.log'
        if (Test-Path $logPath) {
            $content = Get-Content $logPath -Raw
            $content | Should -Not -Match 'STAGE_COMPLETE:1'
        }
    }
}
