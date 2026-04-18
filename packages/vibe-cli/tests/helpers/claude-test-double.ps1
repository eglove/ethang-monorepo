function Invoke-ClaudeTestDouble {
    param(
        [string]$Role,
        [string]$Model,
        [string]$SystemPromptFile,
        [string]$AppendSystemPromptFile,
        [string]$Prompt,
        [string]$JsonSchema,
        [string]$AddDir,
        [switch]$Interactive,
        [string]$TaskId,
        [switch]$SkipCloseHook
    )

    return @{
        content       = ''
        filesModified = @()
        exitCode      = 0
        cost          = 0.0
    }
}
