$ErrorActionPreference = 'Stop'

# Module-scoped database path - set by Open-StateDatabase, used by all functions
$script:StateDbPath = $null

function Assert-StateDatabaseOpen {
    if (-not $script:StateDbPath) {
        throw "State database is not open. Call Open-StateDatabase first."
    }
}

# Dot-source all function files
$functionDirs = @(
    'connection', 'session', 'features', 'progress', 'artifacts',
    'lock', 'runtime', 'outputs', 'debate', 'tiers', 'tasks', 'merges', 'gates'
)
foreach ($dir in $functionDirs) {
    $dirPath = Join-Path $PSScriptRoot $dir
    if (Test-Path $dirPath) {
        Get-ChildItem -Path $dirPath -Filter '*.ps1' | ForEach-Object {
            . $_.FullName
        }
    }
}

# Dot-source test helpers
$testHelpersDir = Join-Path $PSScriptRoot 'test-helpers'
if (Test-Path $testHelpersDir) {
    Get-ChildItem -Path $testHelpersDir -Filter '*.ps1' | ForEach-Object {
        . $_.FullName
    }
}
