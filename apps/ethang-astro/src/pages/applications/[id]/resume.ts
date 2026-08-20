import { env } from "cloudflare:workers";
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

  const object = await env.jobResumes.get(`${session.email}/${id}`);
  if (isNil(object)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Disposition": contentDisposition(
        object.customMetadata?.["filename"] ?? "resume.pdf"
      ),
      "Content-Length": String(object.size),
      "Content-Type": object.httpMetadata?.contentType ?? "application/pdf"
    }
  });
};
