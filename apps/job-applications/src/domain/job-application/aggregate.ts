import { DateTime, Effect } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import padStart from "lodash/padStart.js";
import split from "lodash/split.js";
import { v7 } from "uuid";

import { InvalidStatusTransitionError } from "../../errors/invalid-status-transition-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
import { isStatus, nextStatus, type Status } from "./status.ts";

export type CreateAppInput = {
  readonly applicationUrl: string;
  readonly appliedDate: string;
  readonly company: string;
  readonly email: string;
  readonly location?: null | string;
  readonly nextInterviewDate?: null | string;
  readonly notes?: null | string;
  readonly salary?: null | string;
  readonly status?: Status;
  readonly title: string;
};

export type JobApp = {
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

export type UpdateAppChanges = {
  readonly appliedDate?: string;
  readonly company?: string;
  readonly location?: null | string;
  readonly nextInterviewDate?: null | string;
  readonly notes?: null | string;
  readonly salary?: null | string;
  readonly status?: Status;
  readonly title?: string;
};

const nowIso = () => {
  const iso = DateTime.formatIso(DateTime.unsafeNow());
  // eslint-disable-next-line sonar/pseudo-random
  const randomNumber = Math.floor(Math.random() * 1_000_000);
  const randomMicro = padStart(String(randomNumber), 6, "0");
  const parts = split(iso, ".");
  if (2 === parts.length) {
    const base = parts[0];
    return `${base}.${randomMicro.slice(0, 3)}${randomMicro.slice(3)}Z`;
  }
  return iso;
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

export const createJobApp = (input: CreateAppInput) => {
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
    const app: JobApp = {
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

const hasAnyChanges = (changes: UpdateAppChanges) => {
  return Object.values(changes).some((value) => {
    return !isNil(value);
  });
};

export const withChanges = (app: JobApp, changes: UpdateAppChanges) => {
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
    return {
      ...app,
      appliedDate,
      company,
      location: optional(changes.location),
      nextInterviewDate: optional(changes.nextInterviewDate),
      notes: optional(changes.notes),
      salary: optional(changes.salary),
      status,
      title,
      updatedAt: nowIso()
    };
  });
};

export const advanceStatus = (app: JobApp) => {
  const next = nextStatus(app.status);
  if (isNil(next)) {
    return Effect.fail(
      new InvalidStatusTransitionError(`cannot advance from ${app.status}`)
    );
  }
  return Effect.succeed({ ...app, status: next, updatedAt: nowIso() });
};

export const attachResume = (app: JobApp, attachment: ResumeAttachment) => {
  return {
    ...app,
    resumeFilename: attachment.filename,
    resumeKey: attachment.key,
    resumeSize: attachment.size,
    updatedAt: nowIso()
  };
};
