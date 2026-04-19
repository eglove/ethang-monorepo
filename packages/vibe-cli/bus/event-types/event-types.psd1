@{
    AllEventTypes = @('bootstrap', 'ground_truth', 'done', 'objection', 'objection_response',
                      'consensus_candidate', 'consensus_ratified', 'consensus_failed',
                      'verify', 'verify_result', 'review_requested', 'review_verdict',
                      'checkpoint', 'checkpoint_response', 'protocol_error', 'protocol_error_ack')

    AgentLifecycle = @('bootstrap', 'ground_truth', 'done', 'checkpoint', 'checkpoint_response')
    Consensus      = @('objection', 'objection_response', 'consensus_candidate', 'consensus_ratified', 'consensus_failed')
    Verification   = @('verify', 'verify_result', 'review_requested', 'review_verdict')
    ProtocolError  = @('protocol_error', 'protocol_error_ack')

    # TypeSenderACL: which roles can send each event type
    TypeSenderACL = @{
        bootstrap           = @('orchestrator')
        ground_truth        = @('orchestrator')
        done                = @('tla-writer', 'bdd-writer', 'debate-moderator', 'review-moderator', 'coding-worker', 'reviewer', 'prompt-generator')
        objection           = @('tla-writer', 'bdd-writer', 'debate-moderator', 'review-moderator', 'coding-worker', 'reviewer')
        objection_response  = @('tla-writer', 'bdd-writer', 'coding-worker', 'reviewer')
        consensus_candidate = @('debate-moderator', 'review-moderator')
        consensus_ratified  = @('orchestrator')
        consensus_failed    = @('orchestrator')
        verify              = @('tla-writer')
        verify_result       = @('orchestrator')
        review_requested    = @('coding-worker')
        review_verdict      = @('reviewer')
        checkpoint          = @('orchestrator')
        checkpoint_response = @('tla-writer', 'bdd-writer', 'debate-moderator', 'review-moderator', 'coding-worker', 'reviewer', 'prompt-generator')
        protocol_error      = @('orchestrator')
        protocol_error_ack  = @('tla-writer', 'bdd-writer', 'debate-moderator', 'review-moderator', 'coding-worker', 'reviewer', 'prompt-generator')
    }
}
