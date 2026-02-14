import { css } from "hono/css";

export const arrowStyles = css`
  grid-area: arrow;
  transition: transform 0.2s ease-in-out;
  display: inline-block;

  details[open] & {
    transform: rotate(-90deg);
  }
`;

export const contentGrid = css`
  display: grid;
  grid-template-areas:
    "link title . arrow"
    "link courseCount focus arrow";
  grid-template-columns: auto 1fr auto auto;
  grid-gap: 8px;
  align-items: center;

  @media screen and (max-width: 640px) {
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      "link title arrow"
      "link courseCount arrow"
      "link focus arrow";
  }

  .link {
    grid-area: link;
  }

  .title {
    grid-area: title;
  }

  .focus {
    grid-area: focus;
  }

  .courseCount {
    grid-area: courseCount;
  }
`;

export const summaryStyles = css`
  list-style: none;
  cursor: pointer;
  padding: var(--pico-spacing);

  &::after {
    display: none !important;

    content: "";
  }

  &::-webkit-details-marker {
    display: none;
  }
`;

export const detailsStyles = css`
  border: 1px solid var(--pico-muted-border-color);
  border-radius: var(--pico-border-radius);
  margin-bottom: var(--pico-spacing);
  overflow: hidden;
  transition:
    box-shadow 0.2s ease-in-out,
    border-color 0.2s ease-in-out;
  interpolate-size: allow-keywords;

  &[open] {
    border-color: var(--pico-primary-background);
    box-shadow: var(--pico-card-sectioning-background-color) 0 0 10px;
  }

  &::details-content {
    transition:
      block-size 0.3s ease-in-out,
      content-visibility 0.3s ease-in-out;
    transition-behavior: allow-discrete;
    block-size: 0;
    overflow: hidden;
  }

  &[open]::details-content {
    block-size: auto;
  }
`;

export const detailsContentStyles = css`
  & > div {
    padding: 0 var(--pico-spacing) var(--pico-spacing) var(--pico-spacing);
  }
`;
