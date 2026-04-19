@{
    # 16 event types partitioned across 4 bounded contexts
    # Each event type appears in exactly one context (partition property)

    AgentLifecycle = @(
        'bootstrap'
        'ground_truth'
        'done'
        'checkpoint'
        'checkpoint_response'
    )

    Consensus = @(
        'objection'
        'objection_response'
        'consensus_candidate'
        'consensus_ratified'
        'consensus_failed'
    )

    Verification = @(
        'verify'
        'verify_result'
        'review_requested'
        'review_verdict'
    )

    ProtocolError = @(
        'protocol_error'
        'protocol_error_ack'
    )
}
