The first bug in an agent appeared. The questioner asked me to verify the expert list for the debate. But this was an old feature.
It was changed so that the debate moderator would choose experts without my input or approval. I asked the questioner to verify that this was the case.
And indeed it was. The questioner and debate moderator both knew of the change. But the design pipeline itself was passing around outdated instruction.
An interesting type of bug to say the least.

The next task was having the pipeline rewrite the service workers I had written for the two
main sites I maintain. The behavior is simple. All assets are cached, when an asset sees a new
last-modified header, it tells the client to update. This makes server rendered pages load in 0ms (on second visits).
But also keeps them up to date. Web workers are easy to write, easy to get wrong.

Session crashed and claude was not able to recover it from memory. Instead I was able to pick up stage 6 from existing documentation.
When it crashed again the background code writers kept going.
