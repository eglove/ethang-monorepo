export type RetryConfig = {
  baseDelayMs: number;
  maxDelayMs: number;
  maxRetries: number;
};

export type RetryResult = {
  delayMs: number;
  exhausted: boolean;
};

export const retryWithBackoff = (
  currentRetry: number,
  config: RetryConfig,
): RetryResult => {
  if (currentRetry >= config.maxRetries) {
    return { delayMs: 0, exhausted: true };
  }

  const exponentialDelay = config.baseDelayMs * 2 ** currentRetry;
  const cappedDelay = Math.min(config.maxDelayMs, exponentialDelay);
  // eslint-disable-next-line sonar/pseudo-random -- intentional full jitter for retry backoff
  const delayMs = Math.floor(Math.random() * (cappedDelay + 1));

  return { delayMs, exhausted: false };
};
