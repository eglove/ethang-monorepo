BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"

    $agentsDir = "$PSScriptRoot/../agents"
    $graphInstructionsFile = "$agentsDir/graph-instructions.md"
}

Describe 'Graph instructions appended to role files' {
    It 'elicitor.md contains graph-instructions marker and API text' {
        $content = Get-Content "$agentsDir/doc-writers/elicitor.md" -Raw
        $content | Should -Match 'graph-instructions appended'
        $content | Should -Match '\.addNode'
    }

    It 'bdd-writer.md contains graph-instructions marker and API text' {
        $content = Get-Content "$agentsDir/doc-writers/bdd-writer.md" -Raw
        $content | Should -Match 'graph-instructions appended'
        $content | Should -Match '\.addNode'
    }

    It 'expert-tdd.md contains graph-instructions marker and API text' {
        $content = Get-Content "$agentsDir/experts/expert-tdd.md" -Raw
        $content | Should -Match 'graph-instructions appended'
        $content | Should -Match '\.addNode'
    }

    It 'debate-moderator.md contains graph-instructions marker and API text' {
        $content = Get-Content "$agentsDir/debate-moderator.md" -Raw
        $content | Should -Match 'graph-instructions appended'
        $content | Should -Match '\.addNode'
    }

    It 'reviewers/test.md contains graph-instructions marker and API text' {
        $content = Get-Content "$agentsDir/reviewers/test.md" -Raw
        $content | Should -Match 'graph-instructions appended'
        $content | Should -Match '\.addNode'
    }

    It 'code-writer.md contains graph-instructions marker and API text' {
        $content = Get-Content "$agentsDir/code-writer.md" -Raw
        $content | Should -Match 'graph-instructions appended'
        $content | Should -Match '\.addNode'
    }
}

Describe 'graph-instructions.md addNode signature and node types' {
    It 'contains .addNode signature and all five valid node types' {
        $content = Get-Content $graphInstructionsFile -Raw
        $content | Should -Match '\.addNode\('
        $content | Should -Match '\bapp\b'
        $content | Should -Match '\bpackage\b'
        $content | Should -Match '\bcomponent\b'
        $content | Should -Match '\bfunction\b'
        $content | Should -Match '\bfile\b'
    }
}

Describe 'graph-instructions.md addEdge signature and edge types' {
    It 'contains .addEdge signature and all seven valid edge types' {
        $content = Get-Content $graphInstructionsFile -Raw
        $content | Should -Match '\.addEdge\('
        $content | Should -Match '\bcalls\b'
        $content | Should -Match '\bimports\b'
        $content | Should -Match '\bexports\b'
        $content | Should -Match '\bdepends_on\b'
        $content | Should -Match '\bcontains\b'
        $content | Should -Match '\btested_by\b'
        $content | Should -Match '\btest_for\b'
    }
}

Describe 'graph-instructions.md bare filename validation' {
    It 'states that bare filenames without directory separators are invalid' {
        $content = Get-Content $graphInstructionsFile -Raw
        $content | Should -Match 'bare filename|without directory separator'
    }
}

Describe 'graph-instructions.md dedup notification protocol' {
    It 'explains that on duplicate error, agent must submit a DIFFERENT path' {
        $content = Get-Content $graphInstructionsFile -Raw
        $content | Should -Match 'DIFFERENT|different'
        $content | Should -Match 'duplicate'
    }
}
