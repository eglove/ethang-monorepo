// Forest spans full viewport width, base aligned with the waterline (63vh).
// viewBox is 1440×220; preserveAspectRatio="none" stretches it to any viewport width.
// Layers from bottom up: beach → grass → tree silhouettes.

const tree = (cx: number, base: number, h: number): string => {
  const w1 = h * 0.33;
  const w2 = h * 0.2;
  const peak = h * 0.55;
  const mid = h * 0.38;
  return (
    `M${cx - w1},${base} L${cx},${base - peak} L${cx + w1},${base} Z ` +
    `M${cx - w2},${base - mid} L${cx},${base - h} L${cx + w2},${base - mid} Z`
  );
};

const BACK_HEIGHTS = [90, 115, 98, 126, 84, 110, 102, 120, 92, 114];
const FRONT_HEIGHTS = [105, 132, 110, 140, 96, 126, 114, 136, 105, 128];
const SPACING = 68;
const COUNT = 22; // covers 1440px

const backPaths = Array.from({ length: COUNT }, (_, index) =>
  // @ts-expect-error it's ok
  tree(34 + index * SPACING, 173, BACK_HEIGHTS[index % BACK_HEIGHTS.length]),
).join(" ");

const frontPaths = Array.from({ length: COUNT }, (_, index) =>
  // @ts-expect-error it's ok
  tree(index * SPACING, 178, FRONT_HEIGHTS[index % FRONT_HEIGHTS.length]),
).join(" ");

const forestSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 220" width="100%" height="220" preserveAspectRatio="none">
  <!-- Beach strip -->
  <rect x="0" y="194" width="1440" height="26" fill="#b8975a"/>
  <rect x="0" y="192" width="1440" height="5"  fill="#cda96e"/>

  <!-- Grass -->
  <rect x="0" y="164" width="1440" height="32" fill="#2e5528"/>
  <!-- Grass highlight at top edge -->
  <rect x="0" y="162" width="1440" height="5"  fill="#4a8040"/>

  <!-- Back row of trees (darker, for depth) -->
  <path d="${backPaths}" fill="#1e4020"/>

  <!-- Front row of trees (slightly brighter) -->
  <path d="${frontPaths}" fill="#2d5a27"/>
</svg>`;

export const ForestScene = async () => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: forestSvg }}
      style="position:fixed;left:0;right:0;bottom:37vh;z-index:1;pointer-events:none;height:220px;"
    />
  );
};
