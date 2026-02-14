import { html } from "hono/html";

export const header = async () => {
  return html`
    <header>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <!--          <li><a href="/blog">Blogs</a></li>-->
          <!--          <li><a href="/tips">Tips</a></li>-->
          <!--          <li><a href="/projects">Projects</a></li>-->
          <li><a href="/courses">Courses</a></li>
        </ul>
      </nav>
    </header>
  `;
};
