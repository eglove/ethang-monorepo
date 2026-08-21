import { env } from "cloudflare:workers";
import constant from "lodash/constant.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import replace from "lodash/replace.js";

import { applicationsLoginRedirect } from "../../../lib/applications.ts";
import { decodeSessionCookie } from "../../../lib/session.ts";

// eslint-disable-next-line unicorn/consistent-boolean-name
export const prerender = false;

const contentDisposition = (filename: string) => {
  const safeFilename = replace(filename, /["\r\n]/gu, "_");
  return `inline; filename="${safeFilename}"`;
};

export const GET = async (context: {
  cookies: { get: (name: string) => { value?: string } | undefined };
  params: { id?: string };
}) => {
  const session = decodeSessionCookie(context.cookies.get("session")?.value);
  if (isNil(session)) {
    return new Response(null, {
      headers: { Location: applicationsLoginRedirect() },
      status: 302
    });
  }

  const id = context.params.id;
  if (isNil(id) || isEmpty(id)) {
    return new Response("Not found", { status: 404 });
  }

  // Authorization is delegated to the worker: the session token is verified
  // server-side and the email is derived from it, so a forged cookie email
  // grants access to nothing.
  const result = await env.job_applications
    .getResume({ id, token: session.sessionToken })
    .catch(constant(null));
  if (isNil(result) || !result.ok || isNil(result.value)) {
    return new Response("Not found", { status: 404 });
  }

  const resume = result.value;
  return new Response(resume.data, {
    headers: {
      "Content-Disposition": contentDisposition(
        isEmpty(resume.filename) ? "resume.pdf" : resume.filename
      ),
      "Content-Length": String(resume.size),
      "Content-Type": resume.contentType
    }
  });
};
