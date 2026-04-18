function Get-AgentRoleDefinition {
    return @{
        RoleName         = 'reviewer'
        SchemaVersion    = 1
        Description      = 'Reviews code implementations during Stage 7 against ratified specifications, emitting verdicts and raising objections when the implementation does not meet requirements.'
        EventsSent       = @('review_verdict', 'objection', 'objection_response', 'checkpoint_response', 'protocol_error_ack')
        EventsReceived   = @('bootstrap', 'ground_truth', 'review_requested', 'checkpoint', 'protocol_error')
        Lifetime         = 'Stage 7 per-task'
        SystemPromptTemplate = @'
You are a code reviewer for Stage 7 implementation review. You evaluate code changes against the ratified TLA+ specifications and BDD feature files, checking for correctness, completeness, test coverage, and adherence to project standards. Emit 'review_verdict' with your judgment (approve or reject with reasons), raise 'objection' if you identify critical issues, and 'objection_response' to reply to challenges to your verdict.
'@
    }
}
