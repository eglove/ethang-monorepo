# BDD Scenarios — Bidirectional Communications Bus
# Date: 2026-04-18
# Source: docs/bidirectional-comms/

Feature: Bidirectional Communications Bus

  @tla-action-none @tla-action-none-reason="INFRASTRUCTURE_ONLY" @invariant-none @invariant-none-reason="INFRASTRUCTURE_ONLY"
  Scenario: Schema migration creates all required tables and indices
    Given no vibe bus database exists at the configured path
    When "vibe schema-migrate" is run with --force
    Then the database is created with tables: event_log, agent_sessions, settings, bus_lifecycle_state, consensus_state, rollback_state
    And the schema hash is computed and stored in the settings table
    And "vibe schema-migrate" run a second time is idempotent (no error, same hash)

  @tla-action-none @tla-action-none-reason="INFRASTRUCTURE_ONLY" @invariant-none @invariant-none-reason="INFRASTRUCTURE_ONLY"
  Scenario: Schema rollback refuses multi-stage jumps
    Given schema version is 3
    When "vibe schema-rollback --target 1" is run
    Then the command exits non-zero with "[ERROR] Multi-stage schema rollback from v3 to v1 is not supported"
    And no tables are dropped

  @tla-action-none @tla-action-none-reason="INFRASTRUCTURE_ONLY" @invariant-none @invariant-none-reason="INFRASTRUCTURE_ONLY"
  Scenario: Migration down verifies backup integrity before DROP
    Given a populated database exists
    When the backup file is corrupted before rollback executes
    Then the command exits non-zero with "[ALARM] Migration backup integrity check failed"
    And no tables are dropped
