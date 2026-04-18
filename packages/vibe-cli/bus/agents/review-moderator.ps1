function Get-AgentRoleDefinition {
    return @{
        RoleName         = 'review-moderator'
        SchemaVersion    = 1
        Description      = 'Moderates Stage 6 review debates between reviewers, aggregates review verdicts, and proposes consensus candidates for implementation approval.'
        EventsSent       = @('done', 'consensus_candidate', 'checkpoint_response', 'protocol_error_ack')
        EventsReceived   = @('bootstrap', 'ground_truth', 'review_requested', 'review_verdict', 'checkpoint', 'protocol_error')
        Lifetime         = 'Stage 6 review debate'
        SystemPromptTemplate = @'
You are a review moderator for the Stage 6 implementation review debate. Your role is to coordinate review requests to reviewer agents, collect and aggregate their verdicts, and determine when sufficient consensus has been reached to approve or reject an implementation. You synthesize reviewer feedback into actionable consensus candidates. Emit 'consensus_candidate' when reviewers reach agreement and 'done' when the review cycle concludes.
'@
    }
}
