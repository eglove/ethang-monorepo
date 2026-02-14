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

  &::after {
    display: none !important;

    content: "";
  }

  &::-webkit-details-marker {
    display: none;
  }
`;
