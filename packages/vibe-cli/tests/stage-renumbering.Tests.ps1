BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
}

Describe 'Stage renumbering (5-7)' {
    It 'stages/5-implementation-writer.ps1 exists' {
        "$root/stages/5-implementation-writer.ps1" | Should -Exist
    }

    It 'stages/6-implementation-debate.ps1 exists' {
        "$root/stages/6-implementation-debate.ps1" | Should -Exist
    }

    It 'stages/7-coding.ps1 exists' {
        "$root/stages/7-coding.ps1" | Should -Exist
    }

    It 'stage 5 reads unified-debate.md instead of separate debate files' {
        $content = Get-Content "$root/stages/5-implementation-writer.ps1" -Raw
        $content | Should -Match 'unified-debate'
        $content | Should -Not -Match 'bdd-debate\.md'
        $content | Should -Not -Match 'tla-debate\.md'
    }

    It 'stage 6 uses bus path (not Invoke-DebateLoop or Invoke-UnifiedDebateLoop)' {
        $content = Get-Content "$root/stages/6-implementation-debate.ps1" -Raw
        $content | Should -Not -Match '\bInvoke-DebateLoop\b'
        $content | Should -Not -Match '\bInvoke-UnifiedDebateLoop\b'
        $content | Should -Match '_Invoke-ImplementationDebateBusPath'
    }

    It 'stage 5 writes STAGE_COMPLETE:5 marker' {
        $content = Get-Content "$root/stages/5-implementation-writer.ps1" -Raw
        $content | Should -Match 'STAGE_COMPLETE:5'
    }

    It 'stage 6 writes STAGE_COMPLETE:6 marker' {
        $content = Get-Content "$root/stages/6-implementation-debate.ps1" -Raw
        $content | Should -Match 'STAGE_COMPLETE:6'
    }

    It 'stage 7 writes STAGE_COMPLETE:7 marker' {
        $content = Get-Content "$root/stages/7-coding.ps1" -Raw
        $content | Should -Match 'STAGE_COMPLETE:7'
    }
}
