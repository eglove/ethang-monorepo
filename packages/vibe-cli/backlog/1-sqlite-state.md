I'd like to refactor the vibe-cli to use a local sqlite file for state. This
includes the structured JSON that is passed downstream as variables, config, and
all other variables within the pipeline. Instead of passing parameters around we
should use a centralized object/class (or as close as powershell can get) to act
as a repository for sqlite access.

This should include ALL state except files themselves (store file paths), or
hardcoded prompts and strings
