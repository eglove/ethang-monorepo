import { html } from "hono/html";

import { image } from "../components/image.tsx";
import { mainLayout } from "../components/layouts/main-layout.tsx";
import { link } from "../components/link.tsx";
import { githubSvg } from "../components/svg/github.tsx";
import { linkedinSvg } from "../components/svg/linkedin.tsx";
import { mailSvg } from "../components/svg/mail.tsx";

const indexComponent = async () => {
  return html`
    <article>
      <div
        class="grid"
        style="align-items: center; grid-template-columns: auto 1fr;"
      >
        ${image({
          alt: "Profile",
          containerStyles: "border-radius: 50%;",
          height: 80,
          originalHeight: 200,
          originalWidth: 200,
          src: "/images/profile.jpeg",
          width: 80,
        })}
        <h2 style="margin: 0;">Ethan Glover</h2>
      </div>

      <footer
        style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;"
      >
        <nav style="padding: 0; margin-right: 0.5rem;">
          <ul style="margin: 0;">
            <li>
              ${link({
                className: "contrast",
                href: "https://www.linkedin.com/in/ethan-glover/",
                isExternal: true,
                label: "LinkedIn",
                title: linkedinSvg({ height: 36, width: 36 }),
              })}
            </li>
            <li>
              ${link({
                className: "contrast",
                href: "https://github.com/eglove",
                isExternal: true,
                label: "GitHub",
                title: githubSvg({ height: 36, width: 36 }),
              })}
            </li>
            <li>
              ${link({
                className: "contrast",
                href: "mailto:hello@ethang.email",
                isExternal: true,
                label: "Email",
                title: mailSvg({ height: 36, width: 36 }),
              })}
            </li>
          </ul>
        </nav>

        ${link({
          href: "https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7316126013938143232",
          isExternal: true,
          label: undefined,
          role: "button",
          title: "Subscribe to my Newsletter",
        })}
        ${link({
          className: "secondary",
          href: "https://cal.com/ethan-glover/meet",
          isExternal: true,
          label: undefined,
          role: "button",
          title: " Schedule a Meeting",
        })}
      </footer>
    </article>
  `;
};

export const home = async () => {
  return mainLayout({
    children: indexComponent(),
    title: "EthanG",
  });
};
