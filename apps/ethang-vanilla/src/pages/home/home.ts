import { writeFileSync } from "node:fs";

import { mainLayoutTemplate } from "../../layouts/main-layout.js";
import { compileTemplate } from "../../util/compile-template.js";
import { getStyles } from "../../util/get-styles.js";

export const homeTemplate = async () => {
  const styles = await getStyles();

  const homeContent = compileTemplate({
    compileParameters: {
      blogs: [
        {
          id: "extract",
          link: "./blog/extract/",
          title: "RSS Extraction Tool",
        },
        {
          id: "javascript-standard-library",
          link: "./blog/javascript-standard-library/",
          title: "Why You Should Install That JS Library",
        },
        {
          id: "looking-at-no-misused-spread",
          link: "./blog/looking-at-no-misused-spread/",
          title: "Looking At: no-misused-spread",
        },
        {
          id: "mimetic-desire",
          link: "./blog/mimetic-desire/",
          title: "Mimetic Desire",
        },
        {
          id: "motivation",
          link: "./blog/motivation/",
          title: "Notes: Generating motivation in software engineering",
        },
        {
          id: "forcing-react",
          link: "./blog/forcing-react/",
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
