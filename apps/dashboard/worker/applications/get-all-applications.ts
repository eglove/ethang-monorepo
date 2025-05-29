import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { parseJson } from "@ethang/toolbelt/json/json";
import isError from "lodash/isError";
import isString from "lodash/isString";
import map from "lodash/map.js";
import { z } from "zod";

import { getPrismaClient } from "../prisma-client.ts";

export const getAllApplications = async (environment: Env, userId: string) => {
  const prisma = getPrismaClient(environment);
  const applications = await prisma.applications.findMany({
    where: { userId },
  });

  const converted = map(applications, (application) => {
    const interviewRounds = isString(application.interviewRounds)
      ? parseJson(application.interviewRounds, z.array(z.string()))
      : [];

    return {
      ...application,
      interviewRounds: isError(interviewRounds) ? [] : interviewRounds,
    };
  });

  return createJsonResponse(converted, "OK");
};
