Describe 'T31 Deleted Utils' {
    It 'invoke-parallel.ps1 does not exist' {
        Test-Path "$PSScriptRoot/../../../utils/invoke-parallel.ps1" | Should -BeFalse
    }
    It 'unified-debate-loop.ps1 does not exist' {
        Test-Path "$PSScriptRoot/../../../utils/unified-debate-loop.ps1" | Should -BeFalse
    }
    It 'debate-loop.ps1 does not exist' {
        Test-Path "$PSScriptRoot/../../../utils/debate-loop.ps1" | Should -BeFalse
    }
    It 'vibe.ps1 does not dot-source invoke-parallel' {
        $content = Get-Content "$PSScriptRoot/../../../vibe.ps1" -Raw
        $content | Should -Not -Match '"\$root/utils/invoke-parallel\.ps1"'
    }
    It 'vibe.ps1 does not dot-source unified-debate-loop' {
        $content = Get-Content "$PSScriptRoot/../../../vibe.ps1" -Raw
        $content | Should -Not -Match '"\$root/utils/unified-debate-loop\.ps1"'
    }
    It 'vibe.ps1 does not dot-source debate-loop' {
        $content = Get-Content "$PSScriptRoot/../../../vibe.ps1" -Raw
        $content | Should -Not -Match 'debate-loop\.ps1'
    }
    It 'Stage 2 does not call Invoke-Parallel' {
        $content = Get-Content "$PSScriptRoot/../../../stages/2-parallel-writers.ps1" -Raw
        $content | Should -Not -Match '\bInvoke-Parallel\b'
    }
    It 'Stage 3 does not call Invoke-UnifiedDebateLoop' {
        $content = Get-Content "$PSScriptRoot/../../../stages/3-unified-debate.ps1" -Raw
        $content | Should -Not -Match '\bInvoke-UnifiedDebateLoop\b'
    }
    It 'Stage 6 does not call Invoke-DebateLoop' {
        $content = Get-Content "$PSScriptRoot/../../../stages/6-implementation-debate.ps1" -Raw
        $content | Should -Not -Match '\bInvoke-DebateLoop\b'
    }
}
