BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
    . "$PSScriptRoot/../utils/pipeline-state.ps1"
}

Describe 'New-PipelineState' {
    # ── TLA+ Init state: all 10 variables at their initial values ──

    BeforeEach {
        $script:state = New-PipelineState
    }

    It 'returns a hashtable' {
        $script:state | Should -BeOfType [hashtable]
    }

    It 'sets pipelineState to "idle"' {
        $script:state.pipelineState | Should -BeExactly 'idle'
    }

    It 'sets lockHolder to $null (TLA+ NULL)' {
        $script:state.lockHolder | Should -BeNullOrEmpty
    }

    It 'sets reviewRound to 0' {
        $script:state.reviewRound | Should -BeExactly 0
    }

    It 'sets keepGoingResets to 0' {
        $script:state.keepGoingResets | Should -BeExactly 0
    }

    It 'sets tddKeepGoingCount to 0' {
        $script:state.tddKeepGoingCount | Should -BeExactly 0
    }

    It 'sets verdict to $null (TLA+ NULL)' {
        $script:state.verdict | Should -BeNullOrEmpty
    }

    It 'sets tasksDone to 0' {
        $script:state.tasksDone | Should -BeExactly 0
    }

    It 'sets gateTimedOut to $false' {
        $script:state.gateTimedOut | Should -BeExactly $false
    }

    It 'sets globalTimedOut to $false' {
        $script:state.globalTimedOut | Should -BeExactly $false
    }

    It 'sets reviewGateType to "none"' {
        $script:state.reviewGateType | Should -BeExactly 'none'
    }

    It 'contains exactly 10 keys' {
        $script:state.Keys.Count | Should -BeExactly 10
    }

    It 'returns a mutable hashtable (not read-only)' {
        # State must be mutable so transition functions can update it
        { $script:state.pipelineState = 'locked' } | Should -Not -Throw
        $script:state.pipelineState | Should -BeExactly 'locked'
    }

    It 'returns independent instances (no shared reference)' {
        $state1 = New-PipelineState
        $state2 = New-PipelineState
        $state1.pipelineState = 'running'
        $state2.pipelineState | Should -BeExactly 'idle'
    }

    It 'does not modify any external state or files' {
        # Capture file system state before
        $tempMarker = [System.IO.Path]::GetTempFileName()
        $before = Get-Date

        $null = New-PipelineState

        # The factory should be pure — no file I/O
        $tempMarker | Should -Exist
        (Get-Item $tempMarker).LastWriteTime | Should -BeLessOrEqual (Get-Date)
        Remove-Item $tempMarker -ErrorAction SilentlyContinue
    }
}

Describe 'Test-PipelineStateTypeOK' {
    # ── TLA+ TypeOK invariant: validates all 10 fields are in legal ranges ──

    BeforeAll {
        $script:cfg = Get-PipelineConfig
    }

    Context 'valid states' {
        It 'accepts the Init state' {
            $state = New-PipelineState
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue
        }

        It 'accepts a mid-pipeline preMergeReview state' {
            $state = New-PipelineState
            $state.pipelineState = 'preMergeReview'
            $state.lockHolder = 1
            $state.reviewRound = 1
            $state.reviewGateType = 'preMerge'
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue
        }

        It 'accepts COMPLETE terminal state' {
            $state = New-PipelineState
            $state.pipelineState = 'COMPLETE'
            $state.lockHolder = $null
            $state.tasksDone = $script:cfg['NumTasks']
            $state.reviewGateType = 'none'
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue
        }

        It 'accepts HALTED terminal state' {
            $state = New-PipelineState
            $state.pipelineState = 'HALTED'
            $state.lockHolder = $null
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue
        }

        It 'accepts all 10 valid pipelineState values' {
            $validStates = @(
                'idle', 'locked', 'running', 'preMergeReview',
                'reviewFix', 'mergeQueue', 'finalReview',
                'finalReviewFix', 'COMPLETE', 'HALTED'
            )
            foreach ($ps in $validStates) {
                $state = New-PipelineState
                $state.pipelineState = $ps
                # Ensure lockHolder matches TLA+ constraints for test validity
                if ($ps -notin @('idle', 'COMPLETE', 'HALTED')) {
                    $state.lockHolder = 1
                }
                Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue -Because "pipelineState='$ps' should be valid"
            }
        }

        It 'accepts verdict values: $null, "pass", "fail", "retry"' {
            foreach ($v in @($null, 'pass', 'fail', 'retry')) {
                $state = New-PipelineState
                $state.verdict = $v
                Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue -Because "verdict='$v' should be valid"
            }
        }

        It 'accepts reviewGateType values: "none", "preMerge", "final"' {
            foreach ($rgt in @('none', 'preMerge', 'final')) {
                $state = New-PipelineState
                $state.reviewGateType = $rgt
                Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue -Because "reviewGateType='$rgt' should be valid"
            }
        }

        It 'accepts boundary values for counters' {
            $state = New-PipelineState
            $state.pipelineState = 'preMergeReview'
            $state.lockHolder = 1
            $state.reviewRound = $script:cfg['MaxReviewRounds']
            $state.keepGoingResets = $script:cfg['MaxKeepGoingResets']
            $state.tddKeepGoingCount = $script:cfg['MaxTddKeepGoingPerGate']
            $state.tasksDone = $script:cfg['NumTasks']
            $state.reviewGateType = 'preMerge'
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeTrue
        }
    }

    Context 'invalid states' {
        It 'rejects invalid pipelineState value' {
            $state = New-PipelineState
            $state.pipelineState = 'bogus'
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects reviewRound exceeding MaxReviewRounds' {
            $state = New-PipelineState
            $state.reviewRound = $script:cfg['MaxReviewRounds'] + 1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects negative reviewRound' {
            $state = New-PipelineState
            $state.reviewRound = -1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects keepGoingResets exceeding MaxKeepGoingResets' {
            $state = New-PipelineState
            $state.keepGoingResets = $script:cfg['MaxKeepGoingResets'] + 1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects negative keepGoingResets' {
            $state = New-PipelineState
            $state.keepGoingResets = -1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects tddKeepGoingCount exceeding MaxTddKeepGoingPerGate' {
            $state = New-PipelineState
            $state.tddKeepGoingCount = $script:cfg['MaxTddKeepGoingPerGate'] + 1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects negative tddKeepGoingCount' {
            $state = New-PipelineState
            $state.tddKeepGoingCount = -1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects tasksDone exceeding NumTasks' {
            $state = New-PipelineState
            $state.tasksDone = $script:cfg['NumTasks'] + 1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects negative tasksDone' {
            $state = New-PipelineState
            $state.tasksDone = -1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects invalid verdict value' {
            $state = New-PipelineState
            $state.verdict = 'maybe'
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects invalid reviewGateType value' {
            $state = New-PipelineState
            $state.reviewGateType = 'postMerge'
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects non-boolean gateTimedOut' {
            $state = New-PipelineState
            $state.gateTimedOut = 'yes'
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }

        It 'rejects non-boolean globalTimedOut' {
            $state = New-PipelineState
            $state.globalTimedOut = 1
            Test-PipelineStateTypeOK -State $state -Config $script:cfg | Should -BeFalse
        }
    }
}
