import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";

export default {
  async fetch(request, environment) {
    const url = attempt(() => new URL(request.url));

    if (isError(url)) {
      return new Response("Not Found", { status: 404 });
    }

    if (startsWith(url.pathname, "/api/ai-microtask")) {
      const prompt = url.searchParams.get("prompt");

      if (isNil(prompt)) {
        return new Response("Bad Request", { status: 400 });
      }

      const response = await environment.AI.run(
        "@cf/meta/llama-3-8b-instruct",
        {
          messages: [
            {
              content:
                "You are a helpful assistant that only responds in JSON.",
              role: "system",
            },
            {
              content: `Break down this task into 3-5 tiny, low-effort subtasks (max five mins each). Task: "${prompt}". Return JSON: ["task1", "task2]`,
              role: "user",
            },
          ],
          response_format: { type: "json_object" },
        },
      );

      return Response.json(response, { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
