CREATE TABLE IF NOT EXISTS event_log (
    evt_id INTEGER PRIMARY KEY,"from" TEXT NOT NULL,"to" TEXT NOT NULL,
    in_reply_to INTEGER,group_id TEXT,type TEXT NOT NULL,payload TEXT,
    status TEXT NOT NULL DEFAULT 'routed'
);
CREATE TRIGGER IF NOT EXISTS trg_event_log_no_illegal_update BEFORE UPDATE ON event_log FOR EACH ROW BEGIN SELECT CASE WHEN NOT (OLD.status='routed' AND NEW.status IN ('committed','delivery_failed')) THEN RAISE(ABORT,'illegal status transition') END; END;
