export const auth = {
  EMAIL: "test@test.com",
  FAILED_TO_SIGN_IN: "Failed to sign in",
  // eslint-disable-next-line sonar/no-hardcoded-passwords
  HASHED_PASSWORD: "hashed-password",
  INVALID_CREDENTIALS: "Invalid Credentials",
  INVALID_RESPONSE: "Invalid response from server",
  PASSWORD: "password",
  SECRET: "test-secret-key-at-least-32-chars!",
  TEST_JWT_TOKEN: "test-jwt-token",
  TEST_TOKEN: "test-token",
  TEST_USERNAME: "testuser",
  UNAUTHORIZED: "Unauthorized",
  UNEXPECTED_ERROR: "An unexpected error occurred",
  USER_ID: "user-1"
} as const;
