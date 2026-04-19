@{
    InferredTargets = @{
        done = 'moderator'
        verify = 'tlc'
        review_requested = 'review-moderator'
        verify_result = 'sender'
    }
    ExplicitTargetRequired = @('objection', 'objection_response', 'consensus_candidate',
                               'consensus_ratified', 'consensus_failed', 'review_verdict',
                               'checkpoint', 'checkpoint_response', 'protocol_error', 'protocol_error_ack')
    BroadcastEvents = @('ground_truth', 'bootstrap')
    OrchestratorOnlyEvents = @('consensus_ratified', 'consensus_failed', 'checkpoint', 'protocol_error')
}
