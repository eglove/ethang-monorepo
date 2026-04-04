Refactor the ts design-pipeline to fully take advantage of @ethang/store and an event driven architecture rather than passing objects around
  waitFor and reentract protection was recently added to the store. It's already used in the project but we can design around it better

The framework for a working design-pipeline already exists. We only need to fill it out. So we'll do 1 stage at a time.
First is the questioner. Currently the questioner.ts prompt is just one line and a seed. This doesn't nearly cover what is in the questioner claude skill.
We want to take everything from that skill except for programmatic instruction that is better handled by the TS cli.
The cli will validate output, but it doesn't necessarily have to keep track of an exact number of questions. The questioner should run as a single agent session.
While the user reads and answers one question it should be planning more in the background to help speed up the process.
Instead of having a hard cap on the  # of questions the user should be able to, at any point, ask what the current summary is and approve it.

Since other phases of the pipeline are incomplete, when the questioner is done I'd like to call the next stage as a skill and let claude take over from there. Meaning the cli doesn't run stages 2-7, it's completely handed off. This helps with incremental adoption and testing.
