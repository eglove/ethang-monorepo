import isUndefined from "lodash/isUndefined.js";

export class LoggerClient {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly environment: string;
  private readonly serviceName: string;

  public constructor(config: {
    apiKey: string;
    endpoint: string;
    environment: string;
    serviceName: string;
  }) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.serviceName = config.serviceName;
    this.environment = config.environment;
  }

  public async debug(
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log("debug", message, metadata);
  }

  public async error(
    message: string,
    metadata?: Record<string, unknown>,
    stack?: string
  ): Promise<void> {
    await this.log("error", message, metadata, stack);
  }

  public async fatal(
    message: string,
    metadata?: Record<string, unknown>,
    stack?: string
  ): Promise<void> {
    await this.log("fatal", message, metadata, stack);
  }

  public async info(
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log("info", message, metadata);
  }

  public async warn(
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log("warn", message, metadata);
  }

  private async log(
    level: "debug" | "error" | "fatal" | "info" | "warn",
    message: string,
    metadata?: Record<string, unknown>,
    stack?: string
  ): Promise<void> {
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

    try {
      await fetch(`${this.endpoint}/log`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey
        },
        method: "POST"
      });
    } catch {
      // Suppress network and logging errors to not disrupt caller.
    }
  }
}
