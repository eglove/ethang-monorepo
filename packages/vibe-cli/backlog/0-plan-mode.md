When it comes to using fixtures to produce tests this is really only designed
for vibe-cli. If work is done on other projects, this will likely break or put
fixtures into vibe-cli. Most other projects colocate vitest tests with project
files and have a seperate e2e directory for playwright. For test fixtures
generated from BDD and TLA+ place them in the root directory of the app or
package. vibe-cli can move to the same place for consistency.
