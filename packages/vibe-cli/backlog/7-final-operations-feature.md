At the end of a vibe-cli build after all code is merged and approved I want to add some final tasks.

First graphify should be updated with all files changes. As far as I'm aware, graphify is designed to only work
in interactive mode, but if there  are flags or prompts we can send to automate it that would be better. Otherwise
it can use interactive mode.

Second, a backlog hunter agent. This agent would scan logs, the feature directory, user_notes or anything relevant
across the monorepo to look for future features. This could be bug fixes, improvements, modifications, or adding missing things.
Maybe the debates deferred objections to later. There were errors or warnings in the logs, or given all context
a new feature or refactor would make sense. This is relatively free form exploration across the entire codebase.
Anything it comes up with can be appended to user_notes. It could even identify code that is clearly written by
AI and has become too long/overengineered for what its meant to do.
