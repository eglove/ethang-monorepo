@{
    # Closed enum of valid @tla-action-none-reason tokens.
    # When a BDD Scenario uses @tla-action-none it MUST also carry
    # @tla-action-none-reason="<token>" where <token> is one of these.
    ValidTokens = @(
        'NOT_YET_SPECCED'
        'INFRASTRUCTURE_ONLY'
        'TEST_DOUBLE_ONLY'
        'AGGREGATE_BOUNDARY'
        'COMPOSITION_ROOT'
    )
}
