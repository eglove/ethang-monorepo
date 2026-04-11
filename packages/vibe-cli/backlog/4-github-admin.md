I would like to add a github admin agent. That instead of anything writing to user notes
this agent could be launched in the background to create github issues with the gh cli.
As a background process it can be called at any time. The backlog agent would call it after its
analysis, for example. Other agents may call it mid run.

The GH admin should check current issues to make sure there are no duplicates.
Issues will be reviewed and approved/denied by the user.

The agent shouldn't be called directly, instead it should be a standalone powershell
function/file that can be called. This way if the process is currently running, new requests
can be queued until it is done.
