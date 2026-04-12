# =============================================================================
# reviewer-agents.Tests.ps1 — Verify all 8 reviewer agent definitions exist
# and conform to the required schema.
# =============================================================================

BeforeAll {
    $script:ReviewersDir = Join-Path $PSScriptRoot '../agents/reviewers'
}

Describe 'Reviewer agent definitions' {

    It 'reviewers directory exists' {
        $script:ReviewersDir | Should -Exist
    }

    It 'all 8 agent files exist' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            $filePath | Should -Exist -Because "$agent.md must exist"
        }
    }

    It 'all 8 agent files are non-empty' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            (Get-Item $filePath).Length | Should -BeGreaterThan 0 -Because "$agent.md must be non-empty"
        }
    }

    It 'each agent contains "findings"' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            $content = Get-Content $filePath -Raw
            $content | Should -Match 'findings' -Because "$agent.md must reference findings"
        }
    }

    It 'each agent contains all 4 severity levels' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        $severities = @('critical', 'high', 'medium', 'low')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            $content = Get-Content $filePath -Raw
            foreach ($severity in $severities) {
                $content | Should -Match $severity -Because "$agent.md must reference severity '$severity'"
            }
        }
    }

    It 'each agent contains severity field' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            $content = Get-Content $filePath -Raw
            $content | Should -Match 'severity' -Because "$agent.md must contain field 'severity'"
        }
    }

    It 'each agent contains description field' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            $content = Get-Content $filePath -Raw
            $content | Should -Match 'description' -Because "$agent.md must contain field 'description'"
        }
    }

    It 'each agent contains files field' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            $content = Get-Content $filePath -Raw
            $content | Should -Match 'files' -Because "$agent.md must contain field 'files'"
        }
    }

    It 'each agent contains suggestion field' {
        $agents = @('a11y','ai-agent','bug','compliance','security','simplicity','test','type-design')
        foreach ($agent in $agents) {
            $filePath = Join-Path $script:ReviewersDir "$agent.md"
            $content = Get-Content $filePath -Raw
            $content | Should -Match 'suggestion' -Because "$agent.md must contain field 'suggestion'"
        }
    }
}
