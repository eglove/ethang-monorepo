Refactor @ethang/store to remove the localStorage backups and related code. This will be a breaking change that is acceptable.
Store will become less about persistance and more about syncronization that is agnostic to the platform. Meaning it should
be able to represent both state-machines and aid an event-driven architecture.

There are two major changes I want to implent.

1. waitFor that allows a system to waitFor a specific change:

public waitFor(predicate: (state: State) => boolean): Promise<State> {
  if (predicate(this._state)) return Promise.resolve(this._state);
  return new Promise((resolve) => {
  const unsubscribe = this.subscribe((state) => {
    if (predicate(state)) {
      unsubscribe();
      resolve(state);
    }
  });
  });
}

2. Reentrant update safety to prevent rercursive statck growth, and keep notification order deterministic.

protected update(updater, shouldNotify = true) {
  // ... produce new state ...
  if (this._isNotifying) {
    this._pendingPatches.push(...patches);  // queue, don't fire
    return;
  }
  this._isNotifying = true;
  // drain patches + notify subscribers
  this._isNotifying = false;
}

I am also open to other changes that would be helpful such as introducing dependency graphs. Unless the way immer works already cover this.
