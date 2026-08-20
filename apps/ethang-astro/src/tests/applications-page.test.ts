import { actions } from "astro:actions";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeEach, describe, expect, it, vi } from "vitest";

const jobApplications = vi.hoisted(() => {
  return {
    listApplications: vi.fn(),
    updateApplication: vi.fn(),
    jobResumes: { get: vi.fn() },
  };
});

vi.mock("cloudflare:workers", () => {
  return {
    env: {
      job_applications: jobApplications,
      jobResumes: jobApplications.jobResumes,
    },
  };
});

import Applications from "../pages/applications.astro";
type ResumeContext = Parameters<
  typeof import("../pages/applications/[id]/resume.ts").GET
>[0];

const getResume = async (context: ResumeContext) => {
  const module = await import("../pages/applications/[id]/resume.ts");
  return module.GET(context);
};

const APPLICATIONS_URL = "https://ethang.dev/applications";
const APPLICATION_URL = "https://acme.example/jobs/1";
const UNSAFE_APPLICATION_URL = ["java", "script:alert(1)"].join("");
const BACKEND_ERROR = "secret backend detail";
const RESUME_FILENAME = "resume.pdf";
const TOKEN = "token";
const SESSION = JSON.stringify({
  email: "ada@example.com",
  sessionToken: TOKEN,
  username: "ada",
});

const renderResponse = async (url: string, session = SESSION) => {
  const container = await AstroContainer.create();
  const request =
    "" === session
      ? new Request(url)
      : new Request(url, {
          headers: { Cookie: `session=${encodeURIComponent(session)}` },
        });
  return container.renderToResponse(Applications as never, { request });
};

const render = async (url: string, session = SESSION) => {
  const response = await renderResponse(url, session);
  return response.text();
};

const parseActionQuery = (action: unknown) => {
  return new URLSearchParams(String(action));
};

const renderActionResult = async (actionResult: {
  body: string;
  contentType: string;
  status: number;
  type: "data" | "error";
}) => {
  const container = await AstroContainer.create();
  const actionSearchParams = parseActionQuery(actions.updateApplicationStatus);
  return container.renderToResponse(
    Applications as never,
    {
      locals: {
        _actionPayload: {
          actionName: actionSearchParams.get("_action") ?? "",
          actionResult,
        },
      },
      request: new Request(`${APPLICATIONS_URL}?after=current-1`, {
        headers: { Cookie: `session=${encodeURIComponent(SESSION)}` },
      }),
    } as never,
  );
};

type Application = {
  applicationUrl?: null | string;
  appliedDate?: null | string;
  company?: null | string;
  id: string;
  location?: null | string;
  nextInterviewDate?: null | string;
  resumeFilename?: null | string;
  salary?: null | string;
  status:
    | "applied"
    | "interview"
    | "offer"
    | "rejected"
    | "screening"
    | "withdrawn";
  title?: null | string;
};

const makeApplication = (overrides: Partial<Application> = {}) => {
  return {
    applicationUrl: APPLICATION_URL,
    appliedDate: "2026-08-01",
    company: "Acme",
    id: "application-1",
    location: "Remote",
    nextInterviewDate: "2026-08-15",
    resumeFilename: RESUME_FILENAME,
    salary: "$120,000",
    status: "screening",
    title: "Engineer",
    ...overrides,
  };
};

beforeEach(() => {
  jobApplications.listApplications.mockReset();
  jobApplications.jobResumes.get.mockReset();
  jobApplications.listApplications.mockResolvedValue({
    ok: true,
    value: { items: [], nextCursor: null },
  });
});

describe("resume endpoint", () => {
  it("streams the authenticated application resume from R2", async () => {
    const data = new TextEncoder().encode("%PDF-1.7");
    jobApplications.jobResumes.get.mockResolvedValue({
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      }),
      customMetadata: { filename: RESUME_FILENAME },
      httpMetadata: { contentType: "application/pdf" },
    });

    const response = await getResume({
      cookies: { get: () => ({ value: SESSION }) },
      params: { id: "application-1" },
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      RESUME_FILENAME,
    );
    expect(await response.text()).toBe("%PDF-1.7");
    expect(jobApplications.jobResumes.get).toHaveBeenCalledWith(
      `ada@example.com/application-1`,
    );
  });

  it.each([undefined, null])(
    "rejects an unauthenticated request",
    async (session) => {
      const response = await getResume({
        cookies: { get: () => (session ? { value: session } : undefined) },
        params: { id: "application-1" },
      } as never);

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(
        "/login?redirect=%2Fapplications",
      );
      expect(jobApplications.jobResumes.get).not.toHaveBeenCalled();
    },
  );
});

describe("applications page authentication", () => {
  it.each(["", "{malformed", JSON.stringify({ sessionToken: TOKEN })])(
    "redirects a missing or malformed session %j to login",
    async (session) => {
      const response = await renderResponse(APPLICATIONS_URL, session);

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(
        "/login?redirect=%2Fapplications",
      );
      expect(jobApplications.listApplications).not.toHaveBeenCalled();
    },
  );
});

describe("applications page loading", () => {
  it("preserves the worker receiver when loading applications", async () => {
    jobApplications.listApplications.mockImplementation(async function (
      this: typeof jobApplications,
    ) {
      if (this !== jobApplications) {
        throw new Error("Worker receiver was lost");
      }

      return {
        ok: true,
        value: { items: [makeApplication()], nextCursor: null },
      };
    });

    const html = await render(APPLICATIONS_URL);

    expect(html).toContain("Acme");
  });

  it("loads 25 applications with the session token and cursor", async () => {
    jobApplications.listApplications.mockResolvedValue({
      ok: true,
      value: { items: [makeApplication()], nextCursor: "next-1" },
    });

    const html = await render(`${APPLICATIONS_URL}?after=current-1`);

    expect(jobApplications.listApplications).toHaveBeenCalledWith({
      after: "current-1",
      first: 25,
      status: null,
      token: TOKEN,
    });
    expect(html).toContain("Acme");
    expect(html).toContain('href="/applications?after=next-1"');
    expect(html).not.toContain("token");
  });

  it("ignores an empty cursor", async () => {
    await render(`${APPLICATIONS_URL}?after=`);

    expect(jobApplications.listApplications.mock.calls.at(-1)?.[0]).toEqual({
      after: null,
      first: 25,
      status: null,
      token: TOKEN,
    });
  });

  it.each([
    {
      error: { code: "INTERNAL", message: BACKEND_ERROR },
      ok: false,
    },
    new Error(BACKEND_ERROR),
  ])("renders a safe error when listing fails", async (failure) => {
    if (Error.isError(failure)) {
      jobApplications.listApplications.mockRejectedValue(failure);
    } else {
      jobApplications.listApplications.mockResolvedValue(failure);
    }

    const html = await render(APPLICATIONS_URL);

    expect(html).toContain("Unable to load applications.");
    expect(html).not.toContain(BACKEND_ERROR);
    expect(html).not.toContain("token");
  });
});

describe("applications page rendering", () => {
  it("renders the approved columns, status options, values, and links", async () => {
    jobApplications.listApplications.mockResolvedValue({
      ok: true,
      value: { items: [makeApplication()], nextCursor: null },
    });

    const html = await render(APPLICATIONS_URL);

    for (const header of [
      "Company",
      "Title",
      "Applied date",
      "Resume",
      "Salary",
      "Next interview",
      "Status",
      "Actions",
    ]) {
      expect(html).toContain(header);
    }

    for (const status of [
      "applied",
      "screening",
      "interview",
      "offer",
      "rejected",
      "withdrawn",
    ]) {
      expect(html).toContain(`<option value="${status}"`);
    }

    expect(html).toContain(
      '<option value="screening" selected>screening</option>',
    );
    expect(html).toContain("Aug 1, 2026");
    expect(html).toContain("Aug 15, 2026");
    expect(html).toContain(`href="${APPLICATION_URL}"`);
    expect(html).toContain('href="/applications/application-1/resume"');
    expect(html).toContain(RESUME_FILENAME);
    expect(html).not.toContain('<th class="px-4 py-3">Location</th>');
  });

  it("wires each row form to the status action and preserves the cursor", async () => {
    jobApplications.listApplications.mockResolvedValue({
      ok: true,
      value: {
        items: [
          makeApplication({ id: "application-1" }),
          makeApplication({ id: "application-2", status: "offer" }),
        ],
        nextCursor: null,
      },
    });

    const html = await render(`${APPLICATIONS_URL}?after=current-1`);

    expect(
      html.match(
        /<form method="POST" action="[^"]*updateApplicationStatus[^"]*"/gu,
      ),
    ).toHaveLength(2);
    expect(html.match(/name="after" value="current-1"/gu)).toHaveLength(2);
    expect(html).toContain(
      'action="?_action=updateApplicationStatus&amp;after=current-1"',
    );
    expect(html).toContain('name="id" value="application-1"');
    expect(html).toContain('name="id" value="application-2"');
    expect(html).not.toContain(TOKEN);
  });

  it("omits unsafe application URLs", async () => {
    jobApplications.listApplications.mockResolvedValue({
      ok: true,
      value: {
        items: [makeApplication({ applicationUrl: UNSAFE_APPLICATION_URL })],
        nextCursor: null,
      },
    });

    const html = await render(APPLICATIONS_URL);

    expect(html).not.toContain(`href="${UNSAFE_APPLICATION_URL}"`);
    expect(html).not.toContain("View application");
  });

  it("redirects a successful Astro action result with the current cursor", async () => {
    const response = await renderActionResult({
      body: '[{"success":1},true]',
      contentType: "application/json+devalue",
      status: 200,
      type: "data",
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "/applications?after=current-1",
    );
  });

  it("renders an Astro action error envelope while preserving the cursor", async () => {
    const response = await renderActionResult({
      body: JSON.stringify({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update application.",
        type: "AstroActionError",
      }),
      contentType: "application/json",
      status: 500,
      type: "error",
    });
    const html = await response.text();

    expect(response.status).toBe(500);
    expect(html).toContain("Unable to update application.");
    expect(html).not.toContain(BACKEND_ERROR);
    expect(jobApplications.listApplications).toHaveBeenCalledWith({
      after: "current-1",
      first: 25,
      status: null,
      token: TOKEN,
    });
  });

  it("uses placeholders and omits optional links when values are absent", async () => {
    jobApplications.listApplications.mockResolvedValue({
      ok: true,
      value: {
        items: [
          makeApplication({
            applicationUrl: null,
            appliedDate: null,
            company: null,
            location: null,
            nextInterviewDate: null,
            resumeFilename: null,
            salary: null,
            title: null,
          }),
        ],
        nextCursor: null,
      },
    });

    const html = await render(APPLICATIONS_URL);

    const placeholders = html.match(/—/gu) ?? [];
    expect(placeholders).toHaveLength(7);
    expect(html).not.toContain(`href="${APPLICATION_URL}"`);
    expect(html).not.toContain(RESUME_FILENAME);
    expect(html).not.toContain("/applications/application-1/resume");
  });

  it("does not add applications to the navigation links", async () => {
    jobApplications.listApplications.mockResolvedValue({
      ok: true,
      value: { items: [], nextCursor: null },
    });

    const html = await render(APPLICATIONS_URL);
    const navigation = /<nav[\s\S]*?<\/nav>/u.exec(html)?.[0] ?? "";

    expect(navigation).not.toContain("/applications");
  });
});
