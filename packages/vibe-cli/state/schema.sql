CREATE TABLE IF NOT EXISTS session (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    active_feature TEXT,
    started_at TEXT
);

CREATE TABLE IF NOT EXISTS features (
    name TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'complete', 'halted'))
);

CREATE TABLE IF NOT EXISTS stage_progress (
    feature_name TEXT NOT NULL,
    stage INTEGER NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (feature_name, stage),
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS pipeline_lock (
    feature_name TEXT NOT NULL PRIMARY KEY,
    pid INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    crash_count INTEGER NOT NULL DEFAULT 0,
    locked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    stage INTEGER NOT NULL,
    artifact_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS pipeline_state (
    feature_name TEXT NOT NULL PRIMARY KEY,
    pipeline_state TEXT NOT NULL DEFAULT 'none',
    lock_holder INTEGER,
    review_round INTEGER NOT NULL DEFAULT 0,
    keep_going_resets INTEGER NOT NULL DEFAULT 0,
    tdd_keep_going_count INTEGER NOT NULL DEFAULT 0,
    verdict TEXT,
    tasks_done INTEGER NOT NULL DEFAULT 0,
    review_gate_type TEXT NOT NULL DEFAULT 'none',
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS stage_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    stage INTEGER NOT NULL,
    output_type TEXT NOT NULL,
    json_data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS debate_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    stage INTEGER NOT NULL,
    round INTEGER NOT NULL,
    consensus_status TEXT NOT NULL CHECK (consensus_status IN ('pending', 'reached', 'failed')),
    moderator_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS tier_progress (
    feature_name TEXT NOT NULL,
    tier INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'pending', 'running', 'passed', 'failed')),
    completed_at TEXT,
    PRIMARY KEY (feature_name, tier),
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS task_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    task_id TEXT NOT NULL,
    tier INTEGER NOT NULL,
    phase TEXT,
    status TEXT NOT NULL,
    counters_json TEXT,
    escalated INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    test_files_json TEXT,
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS merge_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    task_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'none',
    checkpoint TEXT,
    conflict INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (feature_name) REFERENCES features(name)
);

CREATE TABLE IF NOT EXISTS gate_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    gate_type TEXT NOT NULL,
    task_id TEXT,
    status TEXT NOT NULL,
    round INTEGER NOT NULL DEFAULT 1,
    verdict_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (feature_name) REFERENCES features(name)
);
