BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/resolve-target-root.ps1"
}

Describe 'Resolve-TargetRoot' {
    BeforeEach {
        $testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "trt-test-$([guid]::NewGuid().ToString('N').Substring(0,8))"
        New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
        $featureDir = Join-Path $testRoot 'docs/test-feature'
        New-Item -ItemType Directory -Path $featureDir -Force | Out-Null
        # Create a fake monorepo root marker
        $monorepoRoot = Join-Path $testRoot 'monorepo'
        New-Item -ItemType Directory -Path $monorepoRoot -Force | Out-Null
        # Create a target package
        $targetPkg = Join-Path $monorepoRoot 'apps/my-app'
        New-Item -ItemType Directory -Path $targetPkg -Force | Out-Null
    }

    AfterEach {
        Remove-Item -Path $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    It 'returns target root from valid target.json' {
        Set-Content -Path (Join-Path $featureDir 'target.json') -Value '{"root":"apps/my-app"}'

        $result = Resolve-TargetRoot -FeatureDir $featureDir -MonorepoRoot $monorepoRoot -FallbackRoot $testRoot

        $result | Should -Be (Resolve-Path $targetPkg).Path
    }

    It 'falls back to FallbackRoot when target.json is missing' {
        $result = Resolve-TargetRoot -FeatureDir $featureDir -MonorepoRoot $monorepoRoot -FallbackRoot $testRoot

        $result | Should -Be $testRoot
    }

    It 'throws when target.json contains invalid JSON' {
        Set-Content -Path (Join-Path $featureDir 'target.json') -Value 'not valid json'

        { Resolve-TargetRoot -FeatureDir $featureDir -MonorepoRoot $monorepoRoot -FallbackRoot $testRoot } | Should -Throw
    }

    It 'throws when target.json root points outside monorepo (#16 — path escape)' {
        Set-Content -Path (Join-Path $featureDir 'target.json') -Value '{"root":"../../.."}'

        { Resolve-TargetRoot -FeatureDir $featureDir -MonorepoRoot $monorepoRoot -FallbackRoot $testRoot } | Should -Throw '*must be within the monorepo*'
    }

    It 'throws when target.json root points to non-existent directory' {
        Set-Content -Path (Join-Path $featureDir 'target.json') -Value '{"root":"apps/nonexistent"}'

        { Resolve-TargetRoot -FeatureDir $featureDir -MonorepoRoot $monorepoRoot -FallbackRoot $testRoot } | Should -Throw '*does not exist*'
    }
}
