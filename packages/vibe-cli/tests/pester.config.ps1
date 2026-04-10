$config = New-PesterConfiguration

$config.Run.Path = "$PSScriptRoot"
$config.Output.Verbosity = 'Detailed'

$config.CodeCoverage.Enabled = $true
$config.CodeCoverage.Path = @(
    "$PSScriptRoot/../utils/*.ps1"
    "$PSScriptRoot/../stages/*.ps1"
    "$PSScriptRoot/../vibe.ps1"
)
$config.CodeCoverage.OutputFormat = 'JaCoCo'
$config.CodeCoverage.OutputPath = "$PSScriptRoot/../coverage.xml"
$config.CodeCoverage.CoveragePercentTarget = 90

Invoke-Pester -Configuration $config
