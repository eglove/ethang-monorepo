The documentation writing and debates is currently the slowest part of the
vibe-cli pipeline. There is also an issue where downstream documents get
modified with suggestions but upstream documents do no get updates. This can
lead to conflicts in requirements.

Instead of doing documentation one at a time, I want both the BDD writer and
TLA+ writer to receive elicitation documentation at the same time. They should
write their documentation as they interpret what needs to be done.

Then a single debate process will receive both and send feedback for what's
needed divided to which is appropriate. So BDD feedback goes back to the TLA+
writer, BDD feedback goes to the BDD writer.

The implementation writing will remain after as it is based on the requirements
decided through that process.

This means TLA+ and BDD writing is done in parallel and there is only one debate
loop for the both. A single debate loop covers both documents at the same time
to maintain consistency and to debate with the context of both.

We will of course wait for both writers to finish before passing along their
documents to the debate moderator.
