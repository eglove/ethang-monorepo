// Two kids playing with a ball on the beach, positioned left of center.
// Feet align with the sand surface (just above the waterline).
const beachSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 52" width="120" height="52" style="overflow:visible">

  <!-- Kid 1: left side, facing right, arm reaching toward ball -->
  <!-- Hat -->
  <ellipse cx="18" cy="9.5" rx="7.5" ry="2" fill="#e8b84b"/>
  <rect x="13" y="2" width="11" height="8" rx="2" fill="#e8b84b"/>
  <!-- Face -->
  <circle cx="18" cy="17" r="6" fill="#f5c5a3"/>
  <!-- Body (green shirt) -->
  <rect x="13" y="23" width="11" height="9" rx="1" fill="#4a9e4a"/>
  <!-- Shorts -->
  <rect x="14" y="32" width="9" height="6" rx="1" fill="#1a5fa0"/>
  <!-- Left leg (back, planted) -->
  <line x1="15" y1="38" x2="13" y2="51" stroke="#f5c5a3" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Right leg (forward, running pose) -->
  <line x1="21" y1="38" x2="26" y2="51" stroke="#f5c5a3" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Left arm (back) -->
  <line x1="13" y1="26" x2="6" y2="31" stroke="#f5c5a3" stroke-width="2" stroke-linecap="round"/>
  <!-- Right arm (reaching toward ball) -->
  <line x1="24" y1="25" x2="38" y2="30" stroke="#f5c5a3" stroke-width="2" stroke-linecap="round"/>

  <!-- Beach ball: 6 pie slices alternating red/white, clipped to circle -->
  <clipPath id="ball-clip">
    <circle cx="60" cy="33" r="10"/>
  </clipPath>
  <g clip-path="url(#ball-clip)">
    <!-- Red slices: 0→60°, 120→180°, 240→300° -->
    <path d="M60,33 L70,33    A10,10 0 0,1 65,41.66  Z" fill="#e63946"/>
    <path d="M60,33 L55,41.66 A10,10 0 0,1 50,33     Z" fill="#e63946"/>
    <path d="M60,33 L55,24.34 A10,10 0 0,1 65,24.34  Z" fill="#e63946"/>
    <!-- White slices: 60→120°, 180→240°, 300→360° -->
    <path d="M60,33 L65,41.66 A10,10 0 0,1 55,41.66  Z" fill="#f5f5f5"/>
    <path d="M60,33 L50,33    A10,10 0 0,1 55,24.34  Z" fill="#f5f5f5"/>
    <path d="M60,33 L65,24.34 A10,10 0 0,1 70,33     Z" fill="#f5f5f5"/>
  </g>
  <!-- Outline -->
  <circle cx="60" cy="33" r="10" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
  <!-- Shine -->
  <circle cx="56" cy="28" r="2.2" fill="rgba(255,255,255,0.5)"/>

  <!-- Kid 2: right side, facing left, arm reaching toward ball -->
  <!-- Hat -->
  <ellipse cx="102" cy="9.5" rx="7.5" ry="2" fill="#e05a2b"/>
  <rect x="97" y="2" width="11" height="8" rx="2" fill="#e05a2b"/>
  <!-- Face -->
  <circle cx="102" cy="17" r="6" fill="#f5c5a3"/>
  <!-- Body (purple shirt) -->
  <rect x="97" y="23" width="11" height="9" rx="1" fill="#7b4fa0"/>
  <!-- Shorts -->
  <rect x="98" y="32" width="9" height="6" rx="1" fill="#e06020"/>
  <!-- Left leg (forward, running pose) -->
  <line x1="99" y1="38" x2="94" y2="51" stroke="#f5c5a3" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Right leg (back, planted) -->
  <line x1="105" y1="38" x2="107" y2="51" stroke="#f5c5a3" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Right arm (back) -->
  <line x1="108" y1="26" x2="115" y2="31" stroke="#f5c5a3" stroke-width="2" stroke-linecap="round"/>
  <!-- Left arm (reaching toward ball) -->
  <line x1="97" y1="25" x2="82" y2="30" stroke="#f5c5a3" stroke-width="2" stroke-linecap="round"/>

</svg>`;

export const BeachScene = async () => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: beachSvg }}
      style="position:fixed;left:5%;bottom:calc(37vh + 10px);z-index:2;pointer-events:none;width:120px;height:52px;overflow:visible"
    />
  );
};
