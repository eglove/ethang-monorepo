@{
    RootModule        = 'state-repository.psm1'
    ModuleVersion     = '1.0.0'
    GUID              = 'f7a3c2d1-8b4e-4f6a-9c5d-0e1f2a3b4c5d'
    Author            = 'vibe-cli'
    Description       = 'SQLite state repository for vibe-cli pipeline'
    FunctionsToExport = @(
        'Open-StateDatabase',
        'Close-StateDatabase',
        'Reset-StateDatabase',
        'New-Feature',
        'Get-Feature',
        'Get-AllFeature',
        'Set-ActiveFeature',
        'Get-ActiveFeature',
        'Clear-ActiveFeature',
        'Set-StageComplete',
        'Get-LastCompletedStage',
        'Register-Artifact',
        'Get-Artifact',
        'Lock-PipelineState',
        'Unlock-PipelineState',
        'Get-PipelineLockState',
        'Add-CrashCount',
        'Update-PipelineState',
        'Get-PipelineState',
        'Set-StageOutput',
        'Get-StageOutput',
        'Update-DebateState',
        'Get-DebateState',
        'Get-DebateHistory',
        'Set-TierStatus',
        'Get-TierProgress',
        'Get-AllTierProgress',
        'Set-TaskResult',
        'Get-TaskResult',
        'Get-TierTaskResult',
        'Set-MergeResult',
        'Get-MergeResult',
        'Set-GateResult',
        'Get-GateResult',
        'Get-GateResults'
    )
    RequiredModules   = @('PSSQLite')
}
