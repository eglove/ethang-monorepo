import isUndefined from "lodash/isUndefined.js";

export class LoggerClient {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly environment: string;
  private readonly serviceName: string;

  public constructor(config: {
    apiKey: string;
    endpoint?: string;
    environment: string;
    serviceName: string;
  }) {
    this.endpoint =
      config.endpoint ?? "https://logger-service.hello-a8f.workers.dev";
    this.apiKey = config.apiKey;
    this.serviceName = config.serviceName;
    this.environment = config.environment;
  }

  public debug(message: string, metadata?: Record<string, unknown>) {
    this.log("debug", message, metadata);
  }

  public error(
    message: string,
    metadata?: Record<string, unknown>,
    stack?: string
  ) {
    this.log("error", message, metadata, stack);
  }

  public fatal(
    message: string,
    metadata?: Record<string, unknown>,
    stack?: string
  ) {
    this.log("fatal", message, metadata, stack);
  }

  public info(message: string, metadata?: Record<string, unknown>) {
    this.log("info", message, metadata);
  }

  public warn(message: string, metadata?: Record<string, unknown>) {
    this.log("warn", message, metadata);
  }

  private log(
    level: "debug" | "error" | "fatal" | "info" | "warn",
    message: string,
    metadata?: Record<string, unknown>,
    stack?: string
  ) {
    const enrichedMetadata: Record<string, unknown> = {};

    if (!isUndefined(globalThis.window)) {
      enrichedMetadata["userAgent"] = globalThis.navigator.userAgent;
      enrichedMetadata["url"] = globalThis.window.location.href;
      enrichedMetadata["screenWidth"] = globalThis.window.screen.width;
      enrichedMetadata["screenHeight"] = globalThis.window.screen.height;
    }

    const mergedMetadata = metadata
      ? {
          ...enrichedMetadata,
          ...metadata
        }
      : enrichedMetadata;

    const body: Record<string, unknown> = {
      environment: this.environment,
      level,
      message,
      metadata: mergedMetadata,
      serviceName: this.serviceName
    };

    if (!isUndefined(stack)) {
      body["stack"] = stack;
    }

    fetch(`${this.endpoint}/log`, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      },
      method: "POST"
    }).catch(globalThis.console.error);
  }
}
