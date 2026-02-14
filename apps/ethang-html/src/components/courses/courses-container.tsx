import { getContext } from "hono/context-storage";
import { html } from "hono/html";
import get from "lodash/get";
import isNil from "lodash/isNil";
import map from "lodash/map";
import split from "lodash/split";

import type { HonoContext } from "../../index.ts";

import { link } from "../link.tsx";
import { chevronLeft } from "../svg/chevron-left.tsx";
import { externalLinkSvg } from "../svg/external-link.tsx";
import { courseList } from "./course-list.tsx";
import {
  arrowStyles,
  contentGrid,
  summaryStyles,
} from "./courses-container.styles.tsx";

const swebokFocusMap = new Map([
  ["architecture", "Software Architecture"],
  ["certification", "Certification"],
  ["computing", "Computing Foundations"],
  ["construction", "Software Construction"],
  ["design", "Software Design"],
  ["economics", "Software Engineering Economics"],
  ["engineering-operations", "Software Engineering Operations"],
  ["engineering", "Engineering Foundations"],
  ["maintenance", "Software Maintenance"],
  ["management", "Software Engineering Management"],
  ["mathematical", "Mathematical Foundations"],
  ["models-methods", "Software Engineering Models and Methods"],
  ["process", "Software Engineering Process"],
  ["professional-practice", "Software Engineering Professional Practice"],
  ["quality", "Software Quality"],
  ["requirements", "Software Requirements"],
  ["scm", "Software Configuration Management"],
  ["security", "Software Security"],
  ["testing", "Software Testing"],
]);

export const coursesContainer = async () => {
  const context = getContext<HonoContext>();
  const pageData = context.get("coursesPageData");

  return html`${map(pageData.paths, async (path) => {
    const names = split(path.name, ":");
    const focus = swebokFocusMap.get(path.swebokFocus);

    return (
      <details>
        <summary class={summaryStyles}>
          <div class={contentGrid}>
            <div class="link">
              {link({
                className: "contrast",
                href: "",
                isExternal: true,
                label: path.name,
                title: externalLinkSvg(),
              })}
            </div>
            <div class="title">
              {names[0]}
              {isNil(names[1]) ? "" : ":"}
              <span class="pico-color-amber-250">{names[1]}</span>
            </div>
            <small class="pico-color-slate-400 courseCount">
              {get(path, ["courseCount"], 0)} courses
            </small>
            <small class="pico-color-azure-400 focus focus">{focus}</small>
            <div class={arrowStyles}>{chevronLeft()}</div>
          </div>
        </summary>
        {courseList({ pathId: path._id })}
      </details>
    );
  })}`;
};
