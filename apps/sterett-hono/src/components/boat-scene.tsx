// Boat is positioned so y=38 in the SVG aligns with the waterline (63vh).
// overflow:visible lets the fishing lines extend below the SVG's own box.
const boatSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 56" width="200" height="56" style="overflow:visible">
  <!-- Hull -->
  <path d="M22,34 L178,34 L162,54 L38,54 Z" fill="#8B5E3C"/>
  <ellipse cx="100" cy="54" rx="62" ry="2" fill="#6b3f20" opacity="0.5"/>
  <!-- Rim -->
  <rect x="22" y="28" width="156" height="7" rx="2" fill="#c4944a"/>

  <!-- Left fisher: woman (facing left) -->
  <!-- Hat brim + crown -->
  <ellipse cx="58" cy="10" rx="10" ry="2.5" fill="#4a7c59"/>
  <rect x="53" y="3" width="11" height="8" rx="2" fill="#4a7c59"/>
  <!-- Face -->
  <circle cx="58" cy="18" r="7" fill="#f5c5a3"/>
  <!-- Body -->
  <rect x="52" y="25" width="12" height="8" rx="1" fill="#c45a8a"/>
  <line x1="52" y1="28" x2="4" y2="3" stroke="#7a5c2a" stroke-width="2" stroke-linecap="round"/>

  <!-- Right fisher: man (facing right) -->
  <!-- Hat brim + crown -->
  <ellipse cx="142" cy="10" rx="10" ry="2.5" fill="#8b4513"/>
  <rect x="136" y="3" width="11" height="8" rx="2" fill="#8b4513"/>
  <!-- Face -->
  <circle cx="142" cy="18" r="7" fill="#f5c5a3"/>
  <!-- Stubble -->
  <ellipse cx="142" cy="23" rx="4" ry="1.5" fill="#b07848" opacity="0.45"/>
  <!-- Body -->
  <rect x="136" y="25" width="12" height="8" rx="1" fill="#8b2020"/>
  <line x1="148" y1="28" x2="196" y2="3" stroke="#7a5c2a" stroke-width="2" stroke-linecap="round"/>

  <!-- Left fishing line (rod tip → bobber) -->
  <line x1="4" y1="3" x2="1" y2="36" stroke="rgba(200,169,110,0.7)" stroke-width="0.8"/>
  <!-- Left bobber (at waterline ~y=38) -->
  <g class="svg-bobber">
    <circle cx="1" cy="34" r="4" fill="#e53e3e" opacity="0.9"/>
    <circle cx="1" cy="39.5" r="3.5" fill="#f0f0f0" opacity="0.9"/>
  </g>
  <!-- Left line (bobber → hook) -->
  <line x1="1" y1="44" x2="1" y2="282" stroke="rgba(200,169,110,0.35)" stroke-width="0.8"/>
  <!-- Left hook (J shape: shank down, tight semicircle, point back up) -->
  <path d="M1,276 L1,284 A5,5 0 0,0 11,284 L11,280" stroke="rgba(190,150,80,0.85)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Right fishing line (rod tip → bobber) -->
  <line x1="196" y1="3" x2="199" y2="36" stroke="rgba(200,169,110,0.7)" stroke-width="0.8"/>
  <!-- Right bobber -->
  <g class="svg-bobber" style="animation-delay:0.7s">
    <circle cx="199" cy="34" r="4" fill="#e53e3e" opacity="0.9"/>
    <circle cx="199" cy="39.5" r="3.5" fill="#f0f0f0" opacity="0.9"/>
  </g>
  <!-- Right line (bobber → hook) -->
  <line x1="199" y1="44" x2="199" y2="282" stroke="rgba(200,169,110,0.35)" stroke-width="0.8"/>
  <!-- Right hook (J shape: shank down, tight semicircle, point back up) -->
  <path d="M199,276 L199,284 A5,5 0 0,1 189,284 L189,280" stroke="rgba(190,150,80,0.85)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const BoatScene = async () => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: boatSvg }}
      style="position:fixed;top:calc(63vh - 38px);right:5%;z-index:2;pointer-events:none;width:200px;height:56px;overflow:visible"
    />
  );
};
