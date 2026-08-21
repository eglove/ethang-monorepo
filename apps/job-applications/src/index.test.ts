/* eslint-disable unicorn/no-object-as-default-parameter, unicorn/no-unreadable-new-expression */
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { SignJWT } from "jose";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { beforeAll, beforeEach, describe, expect, inject, it } from "vitest";

import { JobApplicationsService } from "./index.ts";

const SECRET = "test-secret";
const EMAIL = "me@example.com";

const sign = async (payload: Record<string, string> = { email: EMAIL }) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1yr")
    .sign(new TextEncoder().encode(SECRET));
};

const service = new JobApplicationsService(
  { waitUntil: () => {} } as unknown as ExecutionContext,
  {
    jobApplications: env.jobApplications,
    jobResumes: env.jobResumes,
    "token-auth": SECRET,
  },
);

const OTHER_EMAIL = "other@example.com";
const JULY_DATE = "2026-07-30";

const jobUrl = (slug: string) => {
  return `https://example.com/jobs/${slug}`;
};

const SETUP_FAILED = "setup failed";
const RESUME_FILENAME = "resume.pdf";

const CREATE = {
  applicationUrl: "https://example.com/jobs/1",
  appliedDate: "2026-08-01",
  company: "Acme",
  title: "Engineer",
};

beforeAll(async () => {
  const migrations = inject("migrations");
  await applyD1Migrations(env.jobApplications, migrations);
});

beforeEach(async () => {
  await env.jobApplications.exec("DELETE FROM job_applications");
  const objects = await env.jobResumes.list();
  await Promise.all(
    map(objects.objects, async (o) => {
      return env.jobResumes.delete(o.key);
    }),
  );
});

describe("JobApplicationsService RPC", () => {
  it("createApplication succeeds and returns the record", async () => {
    const result = await service.createApplication({
      ...CREATE,
      token: await sign(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("applied");
      expect(result.value.email).toBe(EMAIL);
    }
  });

  it("createApplication returns DUPLICATE for a repeat (email, url)", async () => {
    const token = await sign();
    await service.createApplication({ ...CREATE, token });
    const second = await service.createApplication({ ...CREATE, token });
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.code).toBe("DUPLICATE");
    }
  });

  it("createApplication returns VALIDATION for an empty company", async () => {
    const result = await service.createApplication({
      ...CREATE,
      company: "",
      token: await sign(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
    }
  });

  it("returns UNAUTHENTICATED for a token with the wrong secret", async () => {
    const token = await new SignJWT({ email: EMAIL })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1yr")
      .sign(new TextEncoder().encode("wrong-secret"));
    const result = await service.createApplication({ ...CREATE, token });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHENTICATED");
    }
  });

  it("getApplication returns NOT_FOUND for a foreign id", async () => {
    const created = await service.createApplication({
      ...CREATE,
      token: await sign(),
    });
    if (!created.ok) {
      throw new Error(SETUP_FAILED);
    }
    const foreignToken = await sign({ email: OTHER_EMAIL });
    const result = await service.getApplication({
      id: created.value.id,
      token: foreignToken,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("cycleStatus advances applied -> screening and rejects terminal", async () => {
    const created = await service.createApplication({
      ...CREATE,
      token: await sign(),
    });
    if (!created.ok) {
      throw new Error(SETUP_FAILED);
    }
    const token = await sign();
    const advanced = await service.cycleStatus({ id: created.value.id, token });
    expect(advanced.ok).toBe(true);
    if (advanced.ok) {
      expect(advanced.value.status).toBe("screening");
    }
    const terminal = await service.updateApplication({
      id: created.value.id,
      status: "offer",
      token,
    });
    expect(terminal.ok).toBe(true);
    const rejected = await service.cycleStatus({ id: created.value.id, token });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error.code).toBe("INVALID_TRANSITION");
    }
  });

  it("uploadResume and getResume round-trip a PDF", async () => {
    const created = await service.createApplication({
      ...CREATE,
      token: await sign(),
    });
    if (!created.ok) {
      throw new Error(SETUP_FAILED);
    }
    const token = await sign();
    const pdf = new TextEncoder().encode("%PDF-1.7 integration").buffer;
    const uploaded = await service.uploadResume({
      data: pdf,
      filename: RESUME_FILENAME,
      id: created.value.id,
      token,
    });
    expect(uploaded.ok).toBe(true);
    if (uploaded.ok) {
      expect(uploaded.value.resumeFilename).toBe(RESUME_FILENAME);
    }
    const fetched = await service.getResume({ id: created.value.id, token });
    expect(fetched.ok).toBe(true);
    if (fetched.ok && !isNil(fetched.value)) {
      expect(fetched.value.size).toBe(pdf.byteLength);
    }
  });

  it("deleteApplication removes the record and its resume", async () => {
    const created = await service.createApplication({
      ...CREATE,
      token: await sign(),
    });
    if (!created.ok) {
      throw new Error(SETUP_FAILED);
    }
    const token = await sign();
    await service.uploadResume({
      data: new TextEncoder().encode("%PDF-1.7 delete").buffer,
      filename: RESUME_FILENAME,
      id: created.value.id,
      token,
    });
    const deleted = await service.deleteApplication({
      id: created.value.id,
      token,
    });
    expect(deleted.ok).toBe(true);
    const { objects: r2Objects } = await env.jobResumes.list();
    const keys = map(r2Objects, ({ key }) => {
      return key;
    });
    expect(keys).toHaveLength(0);
  });

  it("still responds OK to a plain fetch", async () => {
    const response = service.fetch(new Request("https://example.com/"));
    expect(await response.text()).toBe("OK");
  });
});

describe("JobApplicationsService RPC (applications list)", () => {
  it("listApplications returns only the requested date for the owner", async () => {
    const token = await sign();
    const a = await service.createApplication({ ...CREATE, token });
    const b = await service.createApplication({
      ...CREATE,
      applicationUrl: jobUrl("2"),
      token,
    });
    expect(a.ok && b.ok).toBe(true);
    await service.createApplication({
      ...CREATE,
      applicationUrl: jobUrl("3"),
      appliedDate: JULY_DATE,
      token,
    });
    const foreign = await service.createApplication({
      ...CREATE,
      applicationUrl: jobUrl("4"),
      token: await sign({ email: OTHER_EMAIL }),
    });
    expect(foreign.ok).toBe(true);
    const list = await service.listApplications({
      appliedDate: CREATE.appliedDate,
      token,
    });
    expect(list.ok).toBe(true);
    if (list.ok) {
      expect(list.value.items).toHaveLength(2);
      expect(
        Object.keys(list.value).toSorted((x, y) => {
          return x.localeCompare(y);
        }),
      ).toStrictEqual(["items"]);
    }
  });

  it("listAppliedDates returns the owner's distinct dates newest first", async () => {
    const token = await sign();
    await service.createApplication({ ...CREATE, token });
    await service.createApplication({
      ...CREATE,
      applicationUrl: jobUrl("2"),
      appliedDate: JULY_DATE,
      token,
    });
    await service.createApplication({
      ...CREATE,
      applicationUrl: jobUrl("3"),
      token,
    });
    const dates = await service.listAppliedDates({ token });
    expect(dates.ok).toBe(true);
    if (dates.ok) {
      expect(dates.value).toStrictEqual([CREATE.appliedDate, JULY_DATE]);
    }
  });

  it("listApplications returns VALIDATION for a malformed applied date", async () => {
    const result = await service.listApplications({
      appliedDate: "not-a-date",
      token: await sign(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
    }
  });
});
