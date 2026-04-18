@{
    # Directed publisher→subscriber edges — acyclic (no context-level cycles)
    #
    # AgentLifecycle ↔ Consensus is a Customer-Supplier relationship documented
    # in bounded-context-map.md. The `done` event from AgentLifecycle initiates
    # Consensus processing, but this is mediated by the Router (orchestration layer).
    # Direct edges here only capture non-cyclic upstream→downstream flows.
    #
    # Acyclic topological order:
    #   Verification → AgentLifecycle
    #   ProtocolError → AgentLifecycle
    #   Consensus → AgentLifecycle
    #
    # The AgentLifecycle→Consensus trigger (via `done` events) is an event-driven
    # kickoff handled at the bus/router level, not a bounded-context contract.

    Edges = @(
        @{
            Publisher  = 'Consensus'
            Subscriber = 'AgentLifecycle'
            Events     = @('consensus_ratified', 'consensus_failed')
        }
        @{
            Publisher  = 'Verification'
            Subscriber = 'AgentLifecycle'
            Events     = @('verify_result')
        }
        @{
            Publisher  = 'ProtocolError'
            Subscriber = 'AgentLifecycle'
            Events     = @('protocol_error')
        }
    )
}
