# Test-only replacement for the removed utils/config.ps1.
# Provides transitive imports and Get-PipelineConfig for state machine tests.

. "$PSScriptRoot/../../utils/invoke-claude.ps1"
. "$PSScriptRoot/../../utils/invoke-verify.ps1"
. "$PSScriptRoot/../../utils/pipeline-log.ps1"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$Config = @{
    NumTasks = 1
}

function Get-PipelineConfig {
    $snapshot = @{}
    foreach ($key in $Config.Keys) {
        $snapshot[$key] = $Config[$key]
    }

    if ($env:VIBE_NUM_TASKS) {
        $snapshot.NumTasks = [int]$env:VIBE_NUM_TASKS
    }
    elseif ($null -ne $env:VIBE_NUM_TASKS -and $env:VIBE_NUM_TASKS -eq '0') {
        $snapshot.NumTasks = 0
    }

    if ($snapshot.NumTasks -lt 1) {
        throw [System.ArgumentException]::new(
            "NumTasks must be >= 1, got $($snapshot.NumTasks). " +
            "Each tier must have at least one task."
        )
    }

    $dict = [System.Collections.Generic.Dictionary[string,object]]::new()
    foreach ($key in $snapshot.Keys) {
        $dict[$key] = $snapshot[$key]
    }
    $readOnly = [System.Collections.ObjectModel.ReadOnlyDictionary[string,object]]::new($dict)
    return $readOnly
}
