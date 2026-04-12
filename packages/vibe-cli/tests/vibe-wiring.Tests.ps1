BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    $vibeContent = Get-Content "$root/vibe.ps1" -Raw
}

Describe 'vibe.ps1 wiring (7-stage pipeline)' {
    It 'dot-sources all 7 stage scripts' {
        $vibeContent | Should -Match '1-elicitor\.ps1'
        $vibeContent | Should -Match '2-parallel-writers\.ps1'
        $vibeContent | Should -Match '3-unified-debate\.ps1'
        $vibeContent | Should -Match '4-post-debate\.ps1'
        $vibeContent | Should -Match '5-implementation-writer\.ps1'
        $vibeContent | Should -Match '6-implementation-debate\.ps1'
        $vibeContent | Should -Match '7-coding\.ps1'
    }

    It 'does not reference old stage scripts' {
        $vibeContent | Should -Not -Match '2-bdd-writer\.ps1'
        $vibeContent | Should -Not -Match '3-bdd-debate\.ps1'
        $vibeContent | Should -Not -Match '4-tla-writer\.ps1'
        $vibeContent | Should -Not -Match '5-tla-debate\.ps1'
        $vibeContent | Should -Not -Match '8-coding\.ps1'
    }

    It 'has -Resume switch parameter and no -Stage param in top block' {
        $vibeContent | Should -Match '\[switch\]\$Resume'
        # The top-level param block should not have [int]$Stage
        $vibeContent | Should -Not -Match 'param\([^)]*\[int\]\$Stage'
    }

    It 'dot-sources resolve-pipeline-state.ps1' {
        $vibeContent | Should -Match 'resolve-pipeline-state\.ps1'
    }

    It 'dot-sources unified-debate-loop.ps1' {
        $vibeContent | Should -Match 'unified-debate-loop\.ps1'
    }

    It 'dot-sources invoke-parallel.ps1' {
        $vibeContent | Should -Match 'invoke-parallel\.ps1'
    }

    It 'runs stages in sequential order 1 through 7' {
        $vibeContent | Should -Match 'Stage 1'
        $vibeContent | Should -Match 'Stage 2'
        $vibeContent | Should -Match 'Stage 3'
        $vibeContent | Should -Match 'Stage 4'
        $vibeContent | Should -Match 'Stage 5'
        $vibeContent | Should -Match 'Stage 6'
        $vibeContent | Should -Match 'Stage 7'
    }

    It 'calls Resolve-PipelineState for inter-stage validation' {
        $vibeContent | Should -Match 'Resolve-PipelineState'
    }
}
