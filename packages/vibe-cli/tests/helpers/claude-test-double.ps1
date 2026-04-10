function Invoke-ClaudeTestDouble {
    param(
        [string]$SystemPromptFile,
        [string]$AppendSystemPromptFile,
        [string]$Prompt,
        [string]$JsonSchema,
        [string]$AddDir,
        [switch]$Interactive,
        [string]$TaskId
    )

    return @{
        content       = ''
        filesModified = @()
        exitCode      = 0
        cost          = 0.0
    }
}
