// eslint-disable-next-line sonar/declarations-in-global-scope
export function* createCounter(start = 1) {
  let current = start;

  while (current < Number.MAX_SAFE_INTEGER) {
    yield current;
    current += 1;
  }
}
