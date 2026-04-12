BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
}

Describe 'Deleted old stage files' {
    It 'stages/2-bdd-writer.ps1 does not exist' {
        "$root/stages/2-bdd-writer.ps1" | Should -Not -Exist
    }

    It 'stages/3-bdd-debate.ps1 does not exist' {
        "$root/stages/3-bdd-debate.ps1" | Should -Not -Exist
    }

    It 'stages/4-tla-writer.ps1 does not exist' {
        "$root/stages/4-tla-writer.ps1" | Should -Not -Exist
    }

    It 'stages/5-tla-debate.ps1 does not exist' {
        "$root/stages/5-tla-debate.ps1" | Should -Not -Exist
    }

    It 'stages/6-implementation-writer.ps1 (old) does not exist' {
        "$root/stages/6-implementation-writer.ps1" | Should -Not -Exist
    }

    It 'stages/7-implementation-debate.ps1 (old) does not exist' {
        "$root/stages/7-implementation-debate.ps1" | Should -Not -Exist
    }

    It 'stages/8-coding.ps1 (old) does not exist' {
        "$root/stages/8-coding.ps1" | Should -Not -Exist
    }

    It 'no .ps1 file references deleted stage filenames via dot-source' {
        $allPs1 = Get-ChildItem "$root" -Recurse -Filter '*.ps1' |
            Where-Object { $_.FullName -notmatch '[/\\]tests[/\\]' -and $_.FullName -notmatch '[/\\]fixtures[/\\]' }
        $deletedNames = @('2-bdd-writer.ps1', '3-bdd-debate.ps1', '4-tla-writer.ps1', '5-tla-debate.ps1', '8-coding.ps1')

        foreach ($file in $allPs1) {
            $content = Get-Content $file.FullName -Raw
            foreach ($deleted in $deletedNames) {
                if ($content -match [regex]::Escape($deleted)) {
                    throw "File $($file.Name) references deleted stage $deleted"
                }
            }
        }
    }

    It 'vibe.ps1 does not reference any deleted stage' {
        $vibeContent = Get-Content "$root/vibe.ps1" -Raw
        $vibeContent | Should -Not -Match '2-bdd-writer'
        $vibeContent | Should -Not -Match '3-bdd-debate'
        $vibeContent | Should -Not -Match '4-tla-writer'
        $vibeContent | Should -Not -Match '5-tla-debate'
        $vibeContent | Should -Not -Match '8-coding'
    }
}
