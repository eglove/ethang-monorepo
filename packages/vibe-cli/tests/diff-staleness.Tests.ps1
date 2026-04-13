BeforeAll {
    function Invoke-Claude { }
    function Write-PipelineLog { }
    function Write-StatusNote { }
    function Write-TaskLog { }

    . "$PSScriptRoot/helpers/test-config.ps1"
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
            reviewGateType     = 'none'
        }
    }
    function global:Test-PipelineStateTypeOK { param($State, $Config) return $true }
    . "$PSScriptRoot/../utils/diff-staleness.ps1"
}

# =============================================================================
# Test-DiffStaleness — pure query: is the diff base stale?
# TLA+ guard: NumTasks > 1, pipelineState = mergeQueue
# =============================================================================

Describe 'Test-DiffStaleness' {
    BeforeEach {
        $script:cfg   = Get-PipelineConfig
        $script:state = New-PipelineState
        $script:state.pipelineState = 'mergeQueue'
        $script:state.lockHolder    = 1

        Mock Write-PipelineLog {}
    }

    Context 'Single-task tiers skip staleness check (invariant S12)' {
        It 'returns $false when NumTasks = 1 regardless of SHAs' {
            $result = Test-DiffStaleness -State $script:state -Config $script:cfg `
                -ReviewTimeDiffBase 'abc123' -CurrentHead 'def456'
            $result | Should -BeExactly $false
        }
    }

    Context 'Multi-task tier: SHAs match — not stale' {
        It 'returns $false when ReviewTimeDiffBase equals CurrentHead' {
            $env:VIBE_NUM_TASKS = '3'
            try {
                $multiCfg = Get-PipelineConfig
                $result = Test-DiffStaleness -State $script:state -Config $multiCfg `
                    -ReviewTimeDiffBase 'abc123' -CurrentHead 'abc123'
                $result | Should -BeExactly $false
            }
            finally { Remove-Item Env:\VIBE_NUM_TASKS -ErrorAction SilentlyContinue }
        }
    }

    Context 'Multi-task tier: SHAs differ — stale' {
        It 'returns $true when SHAs differ and NumTasks > 1' {
            $env:VIBE_NUM_TASKS = '3'
            try {
                $multiCfg = Get-PipelineConfig
                $result = Test-DiffStaleness -State $script:state -Config $multiCfg `
                    -ReviewTimeDiffBase 'abc123' -CurrentHead 'def456'
                $result | Should -BeExactly $true
            }
            finally { Remove-Item Env:\VIBE_NUM_TASKS -ErrorAction SilentlyContinue }
        }
    }

    Context 'Guard — pipelineState must be mergeQueue' {
        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Test-DiffStaleness -State $script:state -Config $script:cfg `
                -ReviewTimeDiffBase 'abc' -CurrentHead 'def' } |
                Should -Throw -ExpectedMessage '*mergeQueue*'
        }

        It 'throws when pipelineState is "preMergeReview"' {
            $script:state.pipelineState = 'preMergeReview'
            { Test-DiffStaleness -State $script:state -Config $script:cfg `
                -ReviewTimeDiffBase 'abc' -CurrentHead 'def' } |
                Should -Throw -ExpectedMessage '*mergeQueue*'
        }
    }

    Context 'Does not mutate state (pure query)' {
        It 'preserves all 10 state variables' {
            $env:VIBE_NUM_TASKS = '3'
            try {
                $multiCfg = Get-PipelineConfig
                $before = $script:state.Clone()
                Test-DiffStaleness -State $script:state -Config $multiCfg `
                    -ReviewTimeDiffBase 'abc' -CurrentHead 'def'
                foreach ($key in $before.Keys) {
                    $script:state[$key] | Should -Be $before[$key] -Because "field '$key' should be unchanged"
                }
            }
            finally { Remove-Item Env:\VIBE_NUM_TASKS -ErrorAction SilentlyContinue }
        }
    }
}

# =============================================================================
# Resolve-DiffStaleness — TLA+ DiffBaseStale / DiffBaseStaleExhausted
# =============================================================================

Describe 'Resolve-DiffStaleness' {
    BeforeEach {
        $script:state = New-PipelineState
        $script:state.pipelineState    = 'mergeQueue'
        $script:state.lockHolder       = 1
        $script:state.reviewGateType   = 'none'
        $script:state.reviewRound      = 0
        $script:state.keepGoingResets   = 1
        $script:state.tddKeepGoingCount = 2
        $script:state.verdict          = $null
        $script:state.tasksDone        = 1

        $script:cfg = Get-PipelineConfig

        Mock Write-PipelineLog {}
    }

    Context 'DiffBaseStale — re-review (no round limit)' {
        It 'transitions pipelineState to preMergeReview' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'increments reviewRound by 1' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 1
        }

        It 'clears verdict to $null' {
            $script:state.verdict = 'pass'
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.verdict | Should -BeNullOrEmpty
        }

        It 'sets reviewGateType to preMerge' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.reviewGateType | Should -BeExactly 'preMerge'
        }

        It 'returns action "reReview"' {
            $result = Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $result.Action | Should -BeExactly 'reReview'
        }
    }

    Context 'DiffBaseStale UNCHANGED preservation' {
        It 'preserves lockHolder' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.lockHolder | Should -BeExactly 1
        }

        It 'preserves keepGoingResets (not reset on staleness)' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.keepGoingResets | Should -BeExactly 1
        }

        It 'preserves tddKeepGoingCount (not reset on staleness)' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.tddKeepGoingCount | Should -BeExactly 2
        }

        It 'preserves tasksDone' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.tasksDone | Should -BeExactly 1
        }

    }

    Context 'DiffBaseStale at high reviewRound still re-reviews (no exhaustion)' {
        It 'transitions pipelineState to preMergeReview at high round' {
            $script:state.reviewRound = 10
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.pipelineState | Should -BeExactly 'preMergeReview'
        }

        It 'increments reviewRound at high round' {
            $script:state.reviewRound = 10
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            $script:state.reviewRound | Should -BeExactly 11
        }
    }

    Context 'Guard — pipelineState must be mergeQueue' {
        It 'throws when pipelineState is "running"' {
            $script:state.pipelineState = 'running'
            { Resolve-DiffStaleness -State $script:state -Config $script:cfg } |
                Should -Throw -ExpectedMessage '*mergeQueue*'
        }
    }

    Context 'TypeOK invariant' {
        It 'state is TypeOK after DiffBaseStale transition' {
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }

        It 'state is TypeOK after DiffBaseStale transition at high round' {
            $script:state.reviewRound = 10
            Resolve-DiffStaleness -State $script:state -Config $script:cfg
            Test-PipelineStateTypeOK -State $script:state -Config $script:cfg | Should -BeTrue
        }
    }
}
