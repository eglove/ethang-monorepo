export const errors = {
  CONFLICT: "The request conflicts with the current state.",
  FORBIDDEN: "Access to this resource is forbidden.",
  INTERNAL_ERROR: "An internal error occurred. Please try again later.",
  INVALID_INPUT: "Invalid input provided.",
  NOT_FOUND: "The requested resource was not found.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  VALIDATION_FAILED: "One or more fields failed validation."
} as const;
