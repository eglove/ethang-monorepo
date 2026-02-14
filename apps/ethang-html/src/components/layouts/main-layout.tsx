import { Style } from "hono/css";
import { html } from "hono/html";

import { header } from "../header.tsx";

type LayoutProperties = {
  children: ReturnType<typeof html>;
  title: string;
};

export const mainLayout = async (
  properties: Readonly<LayoutProperties>,
) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${properties.title}</title>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.blue.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.colors.min.css"
      />
      ${Style()}
    </head>
    <body class="container">
      ${header()}
      <main>${properties.children}</main>
    </body>
  </html>
`;
