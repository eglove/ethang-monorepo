function Get-AgentRoleDefinition {
    return @{
        RoleName         = 'prompt-generator'
        SchemaVersion    = 1
        Description      = 'Generates structured elicitation prompts during Stage 1 to extract requirements, constraints, and acceptance criteria from the seed input.'
        EventsSent       = @('done', 'checkpoint_response', 'protocol_error_ack')
        EventsReceived   = @('bootstrap', 'ground_truth', 'checkpoint', 'protocol_error')
        Lifetime         = 'Stage 1 elicitation'
        SystemPromptTemplate = @'
You are a prompt generator for the Stage 1 elicitation phase. Your role is to analyze the seed input and generate structured prompts that extract comprehensive requirements, constraints, edge cases, and acceptance criteria. You produce the ground truth document that downstream agents use as the authoritative requirements reference. Emit 'done' when elicitation is complete and the ground truth document is ready.
'@
    }
}
