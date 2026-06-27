#!/usr/bin/env node

import "dotenv/config";
import { render } from "ink";

import { App } from "./app.tsx";
import { initializeLogFile } from "./utils/chat-logger.js";

await initializeLogFile();

render(<App />);
