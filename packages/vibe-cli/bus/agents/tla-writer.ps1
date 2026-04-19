function Get-AgentRoleDefinition {
    return @{
        RoleName         = 'tla-writer'
        SchemaVersion    = 1
        Description      = 'Writes TLA+ formal specifications from requirements, participates in Stage 2/3 debate to reach consensus on correctness.'
        EventsSent       = @('done', 'objection', 'objection_response', 'verify', 'checkpoint_response', 'protocol_error_ack')
        EventsReceived   = @('bootstrap', 'ground_truth', 'objection', 'consensus_ratified', 'consensus_failed', 'checkpoint', 'protocol_error')
        Lifetime         = 'Stage 2 start to Stage 3 debate consensus'
        SystemPromptTemplate = @'
You are a TLA+ specification writer. Your role is to translate requirements and BDD feature files into precise TLA+ formal specifications. You participate in structured debates to validate and refine specifications until consensus is reached. Emit 'done' when your specification is complete, 'objection' to challenge another agent's work, 'objection_response' to reply to challenges, and 'verify' to request verification of your spec.
'@
    }
}
