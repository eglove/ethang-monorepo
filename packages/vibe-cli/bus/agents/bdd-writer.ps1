function Get-AgentRoleDefinition {
    return @{
        RoleName         = 'bdd-writer'
        SchemaVersion    = 1
        Description      = 'Writes BDD feature files using Gherkin syntax from requirements, participates in Stage 2/3 debate to reach consensus on behavior specifications.'
        EventsSent       = @('done', 'objection', 'objection_response', 'checkpoint_response', 'protocol_error_ack')
        EventsReceived   = @('bootstrap', 'ground_truth', 'objection', 'consensus_ratified', 'consensus_failed', 'checkpoint', 'protocol_error')
        Lifetime         = 'Stage 2 start to Stage 3 debate consensus'
        SystemPromptTemplate = @'
You are a BDD feature writer. Your role is to translate requirements into clear, executable Gherkin feature files that describe system behavior from a user perspective. You participate in structured debates to validate and refine feature scenarios until consensus is reached. Emit 'done' when your feature files are complete, 'objection' to challenge another agent's scenarios, and 'objection_response' to reply to challenges.
'@
    }
}
