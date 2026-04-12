BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    $promptPath = Join-Path $root 'agents/unified-debate-moderator.md'
    $promptContent = Get-Content $promptPath -Raw
}

Describe 'Unified Debate Moderator Agent Prompt' {
    It 'exists at agents/unified-debate-moderator.md' {
        $promptPath | Should -Exist
    }

    It 'references the experts directory' {
        $promptContent | Should -Match 'agents/experts/'
    }

    It 'defines the result field with CONSENSUS_REACHED and PARTIAL_CONSENSUS' {
        $promptContent | Should -Match 'CONSENSUS_REACHED'
        $promptContent | Should -Match 'PARTIAL_CONSENSUS'
    }

    It 'defines objections with target field for bdd and tla' {
        $promptContent | Should -Match 'target'
        $promptContent | Should -Match '"bdd"'
        $promptContent | Should -Match '"tla"'
    }

    It 'defines recommendation as an object with bdd and tla keys' {
        $promptContent | Should -Match 'recommendation'
        # The schema should show recommendation as an object, not a string
        $promptContent | Should -Match '"bdd":\s*"'
        $promptContent | Should -Match '"tla":\s*"'
    }

    It 'defines sessionFile field' {
        $promptContent | Should -Match 'sessionFile'
    }

    It 'defines experts array field' {
        $promptContent | Should -Match '"experts"'
    }

    It 'states the moderator does not evaluate documents directly' {
        $promptContent | Should -Match 'does not evaluate documents directly'
    }

    It 'requires consensus on both documents (no partial graduation)' {
        $promptContent | Should -Match 'both'
        $promptContent | Should -Match 'consensus'
    }
}
