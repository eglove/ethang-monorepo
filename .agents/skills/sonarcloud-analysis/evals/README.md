# Eval Sets

These eval files use a flat JSON array format targeting `scripts/eval_win.py`:

```json
[{"query": "...", "should_trigger": true}]
```

This is **not** compatible with the skill-creator plugin's `run_loop.py` which expects:

```json
{"skill_name": "...", "evals": [{"id": "...", "prompt": "...", "should_trigger": true}]}
```

To convert for `run_loop.py`:

```bash
python3 -c "
import json, pathlib, uuid
data = json.loads(pathlib.Path('evals.json').read_text())
out = {'skill_name': 'SKILL-NAME-HERE', 'evals': [
    {'id': str(uuid.uuid4()), 'prompt': item['query'], 'should_trigger': item['should_trigger']}
    for item in data
]}
print(json.dumps(out, indent=2))
" > evals_skill_creator.json
```
