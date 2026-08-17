import { DateTime, Effect } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import { v7 } from "uuid";

import { InvalidStatusTransitionError } from "../../errors/invalid-status-transition-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
import { isStatus, nextStatus, type Status } from "./status.ts";

export type CreateApplicationInput = {
  readonly applicationUrl: string;
  readonly appliedDate: string;
  readonly company: string;
  readonly email: string;
  readonly location?: null | string;
  readonly nextInterviewDate?: null | string;
  readonly notes?: null | string;
  readonly salary?: null | string;
  readonly status?: null | Status;
  readonly title: string;
};

export type JobApplication = {
  readonly applicationUrl: string;
  readonly appliedDate: string;
  readonly company: string;
  readonly createdAt: string;
  readonly email: string;
  readonly id: string;
  readonly location: null | string;
  readonly nextInterviewDate: null | string;
  readonly notes: null | string;
  readonly resumeFilename: null | string;
  readonly resumeKey: null | string;
  readonly resumeSize: null | number;
  readonly salary: null | string;
  readonly status: Status;
  readonly title: string;
  readonly updatedAt: string;
};

export type ResumeAttachment = {
  readonly filename: string;
  readonly key: string;
  readonly size: number;
};

export type UpdateApplicationChanges = {
  readonly appliedDate?: string | undefined;
  readonly company?: string | undefined;
  readonly location?: null | string | undefined;
  readonly nextInterviewDate?: null | string | undefined;
  readonly notes?: null | string | undefined;
  readonly salary?: null | string | undefined;
  readonly status?: null | Status | undefined;
  readonly title?: string | undefined;
};

const nowIso = () => {
  return DateTime.formatIso(DateTime.unsafeNow());
};

const isIsoDate = (value: string) => {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/u.test(value);
};

const requireText = (
  value: string,
  field: string
): Effect.Effect<string, ValidationError> => {
  if (isEmpty(value)) {
    return Effect.fail(new ValidationError(`${field} must not be empty`));
  }
  return Effect.succeed(value);
};

const requireStatus = (
  value: Status
): Effect.Effect<Status, ValidationError> => {
  if (!isStatus(value)) {
    const message = String(value);
    return Effect.fail(new ValidationError(`invalid status: ${message}`));
  }
  return Effect.succeed(value);
};

const requireDate = (value: string): Effect.Effect<string, ValidationError> => {
  if (!isIsoDate(value)) {
    return Effect.fail(new ValidationError("appliedDate must be YYYY-MM-DD"));
  }
  return Effect.succeed(value);
};

const optional = <T>(value: null | T | undefined) => {
  return isNil(value) ? null : value;
};

export const createJobApplication = (input: CreateApplicationInput) => {
  return Effect.gen(function* () {
    const company = yield* requireText(input.company, "company");
    const title = yield* requireText(input.title, "title");
    const appUrl = yield* requireText(input.applicationUrl, "applicationUrl");
    const email = yield* requireText(input.email, "email");
    const appliedDate = yield* requireDate(input.appliedDate);
    const status = isNil(input.status)
      ? "applied"
      : yield* requireStatus(input.status);
    const now = nowIso();
    const app: JobApplication = {
      applicationUrl: appUrl,
      appliedDate,
      company,
      createdAt: now,
      email,
      id: v7(),
      location: optional(input.location),
      nextInterviewDate: optional(input.nextInterviewDate),
      notes: optional(input.notes),
      resumeFilename: null,
      resumeKey: null,
      resumeSize: null,
      salary: optional(input.salary),
      status,
      title,
      updatedAt: now
    };
    return app;
  });
};

const validateChangeField = (
  newValue: null | string | undefined,
  currentValue: string,
  fieldName: string
): Effect.Effect<string, ValidationError> => {
  if (isNil(newValue)) {
    return Effect.succeed(currentValue);
  }
  return requireText(newValue, fieldName);
};

const validateChangeDateField = (
  newValue: null | string | undefined,
  currentValue: string
): Effect.Effect<string, ValidationError> => {
  if (isNil(newValue)) {
    return Effect.succeed(currentValue);
  }
  return requireDate(newValue);
};

const validateChangeStatusField = (
  newValue: null | Status | undefined,
  currentValue: Status
): Effect.Effect<Status, ValidationError> => {
  if (isNil(newValue)) {
    return Effect.succeed(currentValue);
  }
  return requireStatus(newValue);
};

// Semantics: distinguish undefined (keep current) from null (clear to null).

const hasAnyChanges = (changes: UpdateApplicationChanges) => {
  return Object.values(changes).some((v) => {
    // eslint-disable-next-line @ethang/no-null-undefined-check, no-undefined
    return v !== undefined;
  });
};

export const withChanges = (
  app: JobApplication,
  changes: UpdateApplicationChanges
) => {
  return Effect.gen(function* () {
    if (!hasAnyChanges(changes)) {
      return yield* Effect.fail(new ValidationError("no changes provided"));
    }
    const company = yield* validateChangeField(
      changes.company,
      app.company,
      "company"
    );
    const title = yield* validateChangeField(changes.title, app.title, "title");
    const appliedDate = yield* validateChangeDateField(
      changes.appliedDate,
      app.appliedDate
    );
    const status = yield* validateChangeStatusField(changes.status, app.status);
    /* eslint-disable @ethang/no-null-undefined-check, no-undefined */
    return {
      ...app,
      appliedDate,
      company,
      location:
        changes.location === undefined
          ? app.location
          : optional(changes.location),
      nextInterviewDate:
        changes.nextInterviewDate === undefined
          ? app.nextInterviewDate
          : optional(changes.nextInterviewDate),
      notes: changes.notes === undefined ? app.notes : optional(changes.notes),
      salary:
        changes.salary === undefined ? app.salary : optional(changes.salary),
      status,
      title,
      updatedAt: nowIso()
    };
    /* eslint-enable @ethang/no-null-undefined-check, no-undefined */
  });
};

export const advanceStatus = (app: JobApplication) => {
  const next = nextStatus(app.status);
  if (isNil(next)) {
    return Effect.fail(
      new InvalidStatusTransitionError(`cannot advance from ${app.status}`)
    );
  }
  return Effect.succeed({ ...app, status: next, updatedAt: nowIso() });
};

export const attachResume = (
  app: JobApplication,
  attachment: ResumeAttachment
) => {
  return {
    ...app,
    resumeFilename: attachment.filename,
    resumeKey: attachment.key,
    resumeSize: attachment.size,
    updatedAt: nowIso()
  };
};
