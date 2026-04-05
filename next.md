I'm not a fan of the design of design-pipeline tyepscript cli.

Use @ethang/store for state machines and it's methods to follow an event driven architecture

Find ALL opportunities in the current design-pipeline to not pass objects as parameters and then mutate them.
In ALL of these cases we should be using a @ethang/store and watching for events.
We want to minimize the number of parameters per function to nearly 0.
Prefer store classes that communicate via events, (classes are easy to mock for tests)
If you need to implement a general event bus, this makes sense to have, but @ethang/store already provides the mechanism for this.
Except in the case of pure functions such as utilities.
Also use functional error handling everywhere. Make use of lodash attempt, and @ethang/toolbelt attemptAsync
