import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import { minify } from "html-minifier-terser";
import map from "lodash/map.js";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { blogs, blogTemplate } from "./pages/blogs/blog-template.js";
import { coursesTemplate } from "./pages/courses/courses.js";
import { homeTemplate } from "./pages/home/home.js";

const minifyDistribution = async (directory = "./dist") => {
  const distributionFiles = readdirSync(directory);

  for (const distributionFile of distributionFiles) {
    const filePath = path.join(directory, distributionFile);
    const stats = statSync(filePath);

    // eslint-disable-next-line unicorn/prefer-ternary
    if (stats.isDirectory()) {
      // eslint-disable-next-line no-await-in-loop
      await minifyDistribution(filePath);
    } else {
      // eslint-disable-next-line no-await-in-loop
      await attemptAsync(async () => {
        if ((/\.(?<files>js|css|html)$/u).test(distributionFile)) {
          const original = readFileSync(filePath, "utf8");
          const minified = await minify(original, {
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            decodeEntities: true,
            html5: true,
            minifyCSS: true,
            minifyJS: true,
            minifyURLs: true,
            removeComments: true,
            sortAttributes: true,
            sortClassName: true,
          });
          writeFileSync(filePath, minified, "utf8");
        }
      });
    }
  }
};

const copyDirectory = (source: string, destination: string) => {
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  const entries = readdirSync(source, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else {
      copyFileSync(sourcePath, destinationPath);
    }
  }
};

export const build = async () => {
  rmSync("./dist", {
    force: true,
    recursive: true,
  });

  mkdirSync("./dist");

  await homeTemplate();
  await coursesTemplate();

  await Promise.all(map(blogs, blogTemplate));

  await minifyDistribution();
  copyDirectory("./src/public", "./dist");
};

await build();
