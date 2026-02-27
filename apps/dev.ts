import {buildScripts} from "./ethang-hono/build-utilities";

// @ts-expect-error top level await
await buildScripts(true);