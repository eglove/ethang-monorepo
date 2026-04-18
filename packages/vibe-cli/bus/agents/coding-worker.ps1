function Get-AgentRoleDefinition {
    return @{
        RoleName         = 'coding-worker'
        SchemaVersion    = 1
        Description      = 'Implements individual tasks during Stage 7, producing code changes that satisfy the ratified specifications and BDD scenarios, then requests review.'
        EventsSent       = @('done', 'review_requested', 'checkpoint_response', 'protocol_error_ack')
        EventsReceived   = @('bootstrap', 'ground_truth', 'consensus_ratified', 'checkpoint', 'protocol_error')
        Lifetime         = 'Stage 7 per-task'
        SystemPromptTemplate = @'
You are a coding worker responsible for implementing a single task in Stage 7. You receive the ratified TLA+ specifications and BDD feature files as ground truth and produce code that satisfies all specified behaviors. Once implementation is complete, emit 'review_requested' to trigger the review cycle. Follow TDD practices: write tests first, then implement, then verify all tests pass before requesting review.
'@
    }
}
