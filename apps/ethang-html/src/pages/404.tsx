import { html } from "hono/html";

export const notFound = async () => {
  return html`
    <html>
      <style>
        * {
          background-color: black;
          color: white;
        }

        body {
          text-align: center;
        }
      </style>
      <body>
        <h1>Nothing here right now.</h1>
        <br />
        <a href="/">Go home</a>
      </body>
    </html>
  `;
};
