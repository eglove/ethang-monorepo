@{
    bus_lifecycle_state = @{ Owner = 'BusLifecycle'; Readers = @('Get-BusReadProjection') }
    consensus_state     = @{ Owner = 'ConsensusRound'; Readers = @('Get-BusReadProjection') }
    rollback_state      = @{ Owner = 'RollbackCoordinator'; Readers = @('Get-BusReadProjection') }
    event_log           = @{ Owner = 'Router'; Readers = @('AgentSession', 'ConsensusRound', 'Get-BusReadProjection') }
    agent_sessions      = @{ Owner = 'AgentSession'; Readers = @('Get-BusReadProjection', 'BusLifecycle') }
    settings            = @{ Owner = 'Migration'; Readers = @('Open-BusDatabase', 'Get-BusReadProjection') }
}
