Import-Module Pester -MinimumVersion 5.0 -ErrorAction Stop

$config = New-PesterConfiguration

$config.Run.Path = "$PSScriptRoot/tests"
$config.Run.Exit = $true

$config.Output.Verbosity = 'Normal'
$config.Output.StackTraceVerbosity = 'Filtered'

$config.CodeCoverage.Enabled = $true
$config.CodeCoverage.Path = @(
    "$PSScriptRoot/utils/*.ps1"
    "$PSScriptRoot/stages/*.ps1"
    "$PSScriptRoot/vibe.ps1"
)
$config.CodeCoverage.OutputFormat = 'JaCoCo'
$config.CodeCoverage.OutputPath = "$PSScriptRoot/coverage.xml"
$config.CodeCoverage.CoveragePercentTarget = 92

$config.TestResult.Enabled = $true
$config.TestResult.OutputFormat = 'NUnitXml'
$config.TestResult.OutputPath = "$PSScriptRoot/test-results.xml"

$config
