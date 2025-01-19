import { writeFileSync } from "node:fs";

import { mainLayoutTemplate } from "../../layouts/main-layout.js";
import { compileTemplate } from "../../util/compile-template.js";
import { getStyles } from "../../util/get-styles.js";

export const homeTemplate = async () => {
  const styles = await getStyles({
    content: ["./src/layouts/main-layout.html", "./src/pages/home/home.html"],
  });

  const homeContent = compileTemplate({
    compileParameters: {
      blogs: [
        {
          link: "./blog/looking-at-no-misused-spread",
          title: "Looking At: no-misused-spread",
        },
        {
          link: "./blog/mimetic-desire",
          title: "Mimetic Desire",
        },
        {
          link: "./blog/motivation",
          title: "Notes: Generating motivation in software engineering",
        },
        {
          link: "./blog/angular-now",
          title: "It's Angular Now",
        },
        {
          link: "./blog/forcing-react",
          title: "Forcing React to be What It Isn't",
        },
      ],
    },
    filePath: "./src/pages/home/home.html",
  });

  const withLayout = mainLayoutTemplate({
    baseUrl: "./",
    content: homeContent,
    styles,
    title: "Home",
  });

  writeFileSync("./dist/index.html", withLayout, { encoding: "utf8" });
};
