/* =========================
   Insignia drawing
   Stylised SVG rank slides. Each rank describes its insignia as a list of
   items stacked from the bottom of the slide upwards; renderInsignia() turns
   that into an SVG string. A rank can instead give an `image` path to use a
   real picture.
   ========================= */

const PALETTES = {
  navy: {
    slide: "#15151b",
    metal: "#e9b824",
    metalDark: "#a07a0c",
    board: "#efbd2b",
    boardLine: "#c9960f",
    boardOutline: "#3d2c00",
    silver: "#f2f2f2",
    silverDark: "#8a8a8a",
    text: "#e9b824"
  },
  army: {
    slide: "#7f6a43",
    metal: "#f6c61a",
    metalDark: "#9a7a12",
    text: "#f6c61a"
  },
  raaf: {
    slide: "#1f2142",
    metal: "#ffffff",
    metalDark: "#9aa0c0",
    stripe: "#0b0b0f",
    stripeLight: "#a4cdf0",
    text: "#ffffff"
  }
};

const CROWN_RED = "#c8102e";
const W = 100;
const CX = W / 2;

/* ---------- small helpers ---------- */

function starPoints(cx, cy, points, outer, inner, rotation = -90) {
  const coords = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rotation + (i * 180) / points) * Math.PI) / 180;
    coords.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return coords.join(" ");
}

// Laurel wreath: a stem up each side, open at the top, with paired leaves.
function wreath(cx, cy, r, color, leaves = 9) {
  const pt = (deg, radius) => {
    const a = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };
  let out = "";
  for (let side = -1; side <= 1; side += 2) {
    const start = 90 + side * 8;
    const end = 90 + side * 140;
    const [x0, y0] = pt(start, r);
    const [x1, y1] = pt(end, r);
    out += `<path d="M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 ${side > 0 ? 1 : 0} ${x1.toFixed(2)},${y1.toFixed(2)}" fill="none" stroke="${color}" stroke-width="1.3"/>`;

    for (let i = 0; i < leaves; i++) {
      const deg = start + ((end - start) * (i + 0.6)) / leaves;
      const tangent = deg + 90;
      [[r + 2.6, -28], [r - 2.6, 28]].forEach(([radius, tilt]) => {
        const [x, y] = pt(deg, radius);
        out += `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="3.6" ry="1.35" fill="${color}" transform="rotate(${(tangent + side * tilt).toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})"/>`;
      });
    }
    // leaf at the tip of each spray
    const [tx, ty] = pt(end + side * 4, r);
    out += `<ellipse cx="${tx.toFixed(2)}" cy="${ty.toFixed(2)}" rx="3.6" ry="1.35" fill="${color}" transform="rotate(${(end + 90).toFixed(1)} ${tx.toFixed(2)} ${ty.toFixed(2)})"/>`;
  }
  // bow where the sprays meet
  const [bx, by] = pt(90, r);
  out += `<path d="M${bx - 4},${by - 2} L${bx + 4},${by + 2} M${bx + 4},${by - 2} L${bx - 4},${by + 2}" stroke="${color}" stroke-width="1.6"/>
    <circle cx="${bx}" cy="${by}" r="1.8" fill="${color}"/>`;
  return out;
}

/* ---------- items: each returns { h, draw(top) } ---------- */

/* ---------- crown ---------- */

// Tudor (King's) crown in local units: 40 wide, 42 tall, top-centre at 0,0
const CROWN_LOCAL_H = 42;

function crownShape(p, mono) {
  const gold = p.metal;
  const edge = p.metalDark;
  const f = `fill="${gold}" stroke="${edge}" stroke-width="0.7" stroke-linejoin="round"`;
  const red = mono ? gold : CROWN_RED;
  const redOpacity = mono ? 0.4 : 1;
  const pearl = mono ? gold : "#ffffff";
  const ermine = mono ? gold : "#e6e6e6";
  const jewel = colour => (mono ? p.slide : colour);

  const archPearls = side => [[-15.5, 22], [-14.5, 16.5], [-11.5, 12.5], [-7.5, 10.2], [-3.5, 9.6]]
    .map(([x, y]) => `<circle cx="${x * side}" cy="${y}" r="1.15" fill="${pearl}" stroke="${edge}" stroke-width="0.3"/>`)
    .join("");

  // cross pattée centred on x
  const cross = x => `<path d="M${x - 1.6},20 H${x + 1.6} L${x + 1},23 L${x + 4},22.4 V25.6 L${x + 1},25 L${x + 1.6},29 H${x - 1.6} L${x - 1},25 L${x - 4},25.6 V22.4 L${x - 1},23 Z" ${f}/>`;
  // simple fleur-de-lis centred on x
  const fleur = x => `<path d="M${x},20 C${x + 2},22 ${x + 2},25 ${x},27 C${x - 2},25 ${x - 2},22 ${x},20 Z M${x - 1},26 C${x - 4},24 ${x - 5},26 ${x - 4},29 H${x + 4} C${x + 5},26 ${x + 4},24 ${x + 1},26 Z" ${f}/>`;

  return `
    <path d="M-17,30 C-19,15 -9,9 0,12 C9,9 19,15 17,30 Z" fill="${red}" fill-opacity="${redOpacity}"/>
    <path d="M-17,30 C-19,13 -8,7 -0.5,11" fill="none" stroke="${edge}" stroke-width="3.6"/>
    <path d="M17,30 C19,13 8,7 0.5,11" fill="none" stroke="${edge}" stroke-width="3.6"/>
    <path d="M-17,30 C-19,13 -8,7 -0.5,11" fill="none" stroke="${gold}" stroke-width="2.4"/>
    <path d="M17,30 C19,13 8,7 0.5,11" fill="none" stroke="${gold}" stroke-width="2.4"/>
    ${archPearls(1)}${archPearls(-1)}
    <circle cx="0" cy="8.5" r="3.4" ${f}/>
    <path d="M-1.3,-1.5 H1.3 V1.3 H4 V3.9 H1.3 V6 H-1.3 V3.9 H-4 V1.3 H-1.3 Z" ${f}/>
    ${fleur(-11)}${cross(0)}${fleur(11)}
    <rect x="-19" y="28.5" width="38" height="7.5" rx="1.2" ${f}/>
    <ellipse cx="-12.5" cy="32.2" rx="2.2" ry="1.9" fill="${jewel(CROWN_RED)}"/>
    <rect x="-2.2" y="30.2" width="4.4" height="4" rx="0.6" fill="${jewel("#1f8a4c")}"/>
    <ellipse cx="12.5" cy="32.2" rx="2.2" ry="1.9" fill="${jewel("#1d5fbf")}"/>
    <circle cx="-6.5" cy="32.2" r="1" fill="${pearl}"/><circle cx="6.5" cy="32.2" r="1" fill="${pearl}"/>
    <rect x="-18" y="35.5" width="36" height="5.5" rx="2.7" fill="${ermine}" stroke="${edge}" stroke-width="0.6"/>
    ${mono ? "" : [-12, -6, 0, 6, 12].map(x => `<path d="M${x},37 v2.2" stroke="#222" stroke-width="0.9"/>`).join("")}`;
}

function crownItem(p, mono = false, scale = 1) {
  const h = 26 * scale;
  const k = h / CROWN_LOCAL_H;
  return {
    h,
    w: 40 * k,
    draw: y => `<g transform="translate(${CX} ${y}) scale(${k.toFixed(4)})">${crownShape(p, mono)}</g>`
  };
}

// Order of the Bath star ("pip")
function pipItem(p) {
  return {
    h: 24,
    draw(y) {
      const cy = y + 12;
      return `<polygon points="${starPoints(CX, cy, 8, 12, 6.5)}" fill="${p.metal}" stroke="${p.metalDark}" stroke-width="0.6"/>
        <circle cx="${CX}" cy="${cy}" r="4.6" fill="${p.metal}" stroke="${p.metalDark}" stroke-width="0.8"/>
        <circle cx="${CX}" cy="${cy}" r="3" fill="${CROWN_RED}"/>`;
    }
  };
}

// three pips in a triangle (Brigadier)
function pipTriangleItem(p) {
  return {
    h: 46,
    w: 54,
    draw(y) {
      return [[CX, y], [CX - 14, y + 22], [CX + 14, y + 22]]
        .map(([x, top]) => `<g transform="translate(${x - CX} ${top - y})">${pipItem(p).draw(y)}</g>`)
        .join("");
    }
  };
}

function swordBatonItem(p, color = p.metal) {
  return {
    h: 30,
    w: 66,
    draw(y) {
      const cy = y + 15;
      return `<g transform="translate(${CX} ${cy})">
        <g transform="rotate(-32)">
          <rect x="-30" y="-3" width="60" height="6" rx="3" fill="${color}"/>
          <rect x="22" y="-3.5" width="5" height="7" fill="${p.metalDark}"/>
        </g>
        <g transform="rotate(32)">
          <path d="M-30,0 Q0,-5 24,-1 L24,1 Q0,-1 -30,2 Z" fill="${color}"/>
          <rect x="22" y="-5" width="2.5" height="10" fill="${color}"/>
          <rect x="24" y="-1.6" width="8" height="3.2" rx="1.4" fill="${color}"/>
        </g>
      </g>`;
    }
  };
}

// crossed batons in a laurel wreath (five-star ranks)
function batonsWreathItem(p, color = p.metal) {
  return {
    h: 46,
    w: 54,
    draw(y) {
      const cy = y + 22;
      return `${wreath(CX, cy, 21, color, 8)}
        <g transform="translate(${CX} ${cy})">
          <rect x="-20" y="-2.5" width="40" height="5" rx="2.5" fill="${color}" transform="rotate(-35)"/>
          <rect x="-20" y="-2.5" width="40" height="5" rx="2.5" fill="${color}" transform="rotate(35)"/>
        </g>`;
    }
  };
}

// cluster of silver stars for navy flag-officer shoulder boards
function boardStarsItem(p, count) {
  const layouts = {
    1: [[0, 0]],
    2: [[0, -12], [0, 12]],
    3: [[0, -12], [-13, 10], [13, 10]],
    4: [[0, -20], [-13, 0], [13, 0], [0, 20]]
  };
  const pts = layouts[count];
  const span = Math.max(...pts.map(([, dy]) => dy)) - Math.min(...pts.map(([, dy]) => dy));
  return {
    h: span + 22,
    draw(y) {
      const cy = y + 11 + span / 2;
      return pts
        .map(([dx, dy]) => `<polygon points="${starPoints(CX + dx, cy + dy, 8, 10, 5)}" fill="${p.silver}" stroke="${p.silverDark}" stroke-width="0.7"/>`)
        .join("");
    }
  };
}

function chevronsItem(p, count) {
  const depth = 16;
  const step = 11;
  return {
    h: depth + 7 + (count - 1) * step,
    w: 76,
    draw(y) {
      let out = "";
      for (let i = 0; i < count; i++) {
        const top = y + 3.5 + i * step;
        out += `<polyline points="16,${top} ${CX},${top + depth} 84,${top}" fill="none" stroke="${p.metal}" stroke-width="7" stroke-linejoin="miter"/>`;
      }
      return out;
    }
  };
}

/* ---------- rope, anchors and knot ---------- */

// A twisted rope along a path: dark edge, gold core, dark twist marks.
function rope(d, p, width = 3.2) {
  const twist = `0.6 ${(width * 0.65).toFixed(2)}`;
  return `<path d="${d}" fill="none" stroke="${p.metalDark}" stroke-width="${width + 1.4}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${p.metal}" stroke-width="${width}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${p.metalDark}" stroke-width="${width * 0.9}" stroke-dasharray="${twist}" stroke-opacity="0.55"/>`;
}

// Fouled anchor in local units: about 88 wide, 0..104 tall, centred on x=0
const ANCHOR_LOCAL_H = 104;

// rope: "full" winds down the shank (Leading Seaman), "loop" just hangs from the ring
function anchorShape(p, color = p.metal, ropeStyle = "full") {
  const edge = p.metalDark;
  const f = `fill="${color}" stroke="${edge}" stroke-width="0.9" stroke-linejoin="round"`;
  const ropeColours = { metal: color, metalDark: edge };
  return `
    <path d="M-34,60 C-36,82 -18,96 0,99 C18,96 36,82 34,60 L26,63 C26,79 14,88 0,89.5 C-14,88 -26,79 -26,63 Z" ${f}/>
    <path d="M-34.5,45 L-44,71 L-34.5,67 L-23,75 Z" ${f}/>
    <path d="M34.5,45 L44,71 L34.5,67 L23,75 Z" ${f}/>
    <path d="M-6.5,93 L0,104 L6.5,93 Z" ${f}/>
    <path d="M-3.8,14 L3.8,14 L5.2,93 L-5.2,93 Z" ${f}/>
    <rect x="-31" y="20" width="62" height="6.6" rx="1.5" ${f}/>
    <rect x="-36" y="18.4" width="5.5" height="9.8" rx="1.6" ${f}/>
    <rect x="30.5" y="18.4" width="5.5" height="9.8" rx="1.6" ${f}/>
    <rect x="-11.5" y="17.8" width="3.4" height="11" rx="1" ${f}/>
    <rect x="8.1" y="17.8" width="3.4" height="11" rx="1" ${f}/>
    <circle cx="0" cy="23.3" r="3.4" ${f}/>
    <circle cx="0" cy="23.3" r="1.4" fill="${edge}"/>
    <circle cx="0" cy="8.5" r="6.4" fill="none" stroke="${edge}" stroke-width="5.6"/>
    <circle cx="0" cy="8.5" r="6.4" fill="none" stroke="${color}" stroke-width="3.9"/>
    ${ropeStyle === "full"
      ? rope("M6,12 C22,13 23,30 6,33.5 C-13,37 -15,52 0,55.5 C15,59 15,71 2,74.5 C-12,78 -21,85 -27,99", ropeColours, 3)
      : rope("M5.5,13 C17,15 17,30 5,32 C-7,34 -9,42 -3,47", ropeColours, 2.8)}`;
}

function anchorItem(p, color = p.metal) {
  const k = 48 / ANCHOR_LOCAL_H;
  return {
    h: 48,
    w: 92 * k,
    maxScale: 1.75,
    draw: y => `<g transform="translate(${CX} ${y}) scale(${k.toFixed(4)})">${anchorShape(p, color)}</g>`
  };
}

function crossedAnchorsItem(p) {
  const k = 0.56;
  const pivot = 66; // local y the anchors cross at
  return {
    h: 62,
    w: 60,
    maxScale: 1.6,
    draw(y) {
      // slightly narrowed so the two stocks don't clash
      const one = angle => `<g transform="rotate(${angle}) scale(${(k * 0.82).toFixed(3)} ${k}) translate(0 ${-pivot})">${anchorShape(p, p.metal, "loop")}</g>`;
      return `<g transform="translate(${CX} ${y + 37})">${one(-28)}${one(28)}</g>`;
    }
  };
}

function wreathAnchorItem(p) {
  const k = 0.4;
  return {
    h: 56,
    w: 62,
    draw(y) {
      const cy = y + 26;
      return `${wreath(CX, cy, 25, p.metal, 9)}
        <g transform="translate(${CX} ${cy - 21}) scale(${k})">${anchorShape(p, p.metal, "loop")}</g>`;
    }
  };
}

// Able Seaman: doubled rope tied in a long figure-of-eight, local 0..100 tall
function knotShape(p) {
  const a = "M-3.5,0 C-3.5,9 17,12 17,29 C17,44 -17,46 -17,64 C-17,79 3.5,86 3.5,100";
  const b = "M3.5,0 C3.5,9 -17,12 -17,29 C-17,44 17,46 17,64 C17,79 -3.5,86 -3.5,100";
  const doubled = d => `<g transform="translate(-2.6 0)">${rope(d, p, 3)}</g><g transform="translate(2.6 0)">${rope(d, p, 3)}</g>`;
  return doubled(a) + doubled(b);
}

function knotItem(p) {
  const k = 0.52;
  return {
    h: 100 * k,
    w: 46 * k,
    maxScale: 1.9,
    draw: y => `<g transform="translate(${CX} ${y}) scale(${k})">${knotShape(p)}</g>`
  };
}

/* ---------- Commonwealth Coat of Arms ---------- */

// Local units: about 96 wide, -38..36 tall, centred on 0,0
function wattleSpray(p, side) {
  const c = p.metal;
  const s = side;
  const leaf = (x, y, angle) => `<ellipse cx="${x * s}" cy="${y}" rx="5" ry="1.6" fill="${c}" transform="rotate(${angle * s} ${x * s} ${y})"/>`;
  const balls = [
    [-44, -6], [-47, -2], [-42, -1], [-48, 4], [-44, 9], [-40, 5], [-47, 12], [-38, 14], [-42, 18],
    [-34, 22], [-38, 25], [-30, 27], [-26, 31], [-46, 19]
  ].map(([x, y]) => `<circle cx="${x * s}" cy="${y}" r="1.8" fill="${c}"/>`).join("");
  return `<path d="M${-6 * s},31 C${-22 * s},31 ${-38 * s},22 ${-44 * s},-4" fill="none" stroke="${c}" stroke-width="1.3"/>
    <path d="M${-26 * s},28 C${-33 * s},24 ${-36 * s},16 ${-40 * s},10" fill="none" stroke="${c}" stroke-width="1"/>
    <path d="M${-36 * s},20 C${-42 * s},18 ${-45 * s},14 ${-48 * s},10" fill="none" stroke="${c}" stroke-width="1"/>
    ${leaf(-14, 29.5, -8)}${leaf(-20, 26.5, 30)}${leaf(-28, 29, -25)}${leaf(-33, 18, 50)}
    ${leaf(-40, 22, -35)}${leaf(-46, 8, 70)}${leaf(-38, 2, 75)}${leaf(-49, -6, 80)}${leaf(-36, 9, 40)}
    ${balls}`;
}

function coatOfArmsShape(p) {
  const c = p.metal;
  const bg = p.slide;
  const kangaroo = "M-24,-35 L-21.5,-28 C-18,-28.5 -15,-27 -13,-24.5 L-12,-22.5 C-14,-21.5 -17,-21.5 -18.5,-20.5 C-18.5,-17 -17,-14.5 -15,-13 L-12.5,-12 L-12.5,-9.5 L-16.5,-10.5 C-19.5,-9 -20.5,-4.5 -19.5,0.5 C-18.5,6 -16,11.5 -12,16.5 L-7,19.5 L-7.5,21.5 L-18,21.5 C-22,19.5 -24.5,16.5 -26.5,13.5 C-31,17 -37,21 -45,24 C-38,17 -32,11 -30,4.5 C-29.5,-5.5 -27.5,-15 -23.5,-22 L-26,-29 Z";
  const emu = "M14.5,-31 L18,-33.5 C21.5,-35 24,-32.5 22.5,-29 C21,-25 20.5,-20 21.5,-14 C27,-14 34,-9 36,-2 C38,4.5 34.5,9.5 28.5,10.5 L31,22 L28.5,22 L24.5,11.5 L22.5,11.5 L22.5,22 L20,22 L19.5,10.5 C15.5,8.5 13.5,3.5 14.5,-3 C15.5,-9 17.5,-14 17.5,-20 C17.5,-25 17,-28 15.5,-29.5 Z";
  const shield = "M-12,-17 H12 V2 C12,11 6.5,15 0,17.5 C-6.5,15 -12,11 -12,2 Z";
  return `
    ${wattleSpray(p, 1)}${wattleSpray(p, -1)}
    <path d="${kangaroo}" fill="${c}"/>
    <path d="${emu}" fill="${c}"/>
    <circle cx="19.5" cy="-31" r="0.8" fill="${bg}"/>
    <circle cx="-16.5" cy="-25" r="0.8" fill="${bg}"/>
    <path d="${shield}" fill="${c}"/>
    <path d="M-9.5,-14.5 H9.5 V2 C9.5,9.5 5,13 0,15 C-5,13 -9.5,9.5 -9.5,2 Z" fill="none" stroke="${bg}" stroke-width="0.9"/>
    <path d="M-9.5,-5.5 H9.5 M-9.5,4 H9.5 M-3.2,-14.5 V14 M3.2,-14.5 V14" stroke="${bg}" stroke-width="0.8"/>
    <path d="M-7.5,-12 l1.4,2.4 l1.4,-2.4 M-1.4,-12 h2.8 M5,-11 a1.4,1.4 0 1 0 2.8,0 M-7,-1.5 h2.6 M0,-3 v3 M6.4,-2.5 l0,2 M-6.2,8 l0,2 M-1.2,7.5 h2.4 M5,7.5 l1.6,1.6" stroke="${bg}" stroke-width="0.6" fill="none"/>
    <polygon points="${starPoints(0, -26.5, 7, 6, 2.6)}" fill="${c}"/>
    <path d="M-23,28.5 H23 L27,32 L23,35 H-23 L-27,32 Z" fill="${c}"/>
    <path d="M-21,31.8 H21" stroke="${bg}" stroke-width="0.8" stroke-dasharray="1.6 1"/>`;
}

function coatOfArmsItem(p) {
  const k = 0.82;
  return {
    h: 74 * k,
    w: 102 * k,
    draw: y => `<g transform="translate(${CX} ${y + 38 * k}) scale(${k})">${coatOfArmsShape(p)}</g>`
  };
}

function wreathArmsItem(p) {
  return {
    h: 70,
    w: 80,
    draw(y) {
      const cy = y + 34;
      return `${wreath(CX, cy, 35, p.metal, 11)}
        <g transform="translate(${CX} ${cy + 1}) scale(0.62)">${coatOfArmsShape(p)}</g>`;
    }
  };
}

const ITEM_BUILDERS = {
  crown: p => crownItem(p),
  crownMono: p => crownItem(p, true),
  crownLarge: p => crownItem(p, false, 1.9),
  pip: pipItem,
  pipTriangle: pipTriangleItem,
  swordBaton: p => swordBatonItem(p),
  swordBatonSilver: p => swordBatonItem(p, p.silver),
  batonsWreath: p => batonsWreathItem(p),
  batonsWreathSilver: p => batonsWreathItem(p, p.silver),
  stars1: p => boardStarsItem(p, 1),
  stars2: p => boardStarsItem(p, 2),
  stars3: p => boardStarsItem(p, 3),
  stars4: p => boardStarsItem(p, 4),
  chevrons1: p => chevronsItem(p, 1),
  chevrons2: p => chevronsItem(p, 2),
  chevrons3: p => chevronsItem(p, 3),
  anchor: p => anchorItem(p),
  anchorSilver: p => anchorItem(p, p.silver),
  crossedAnchors: crossedAnchorsItem,
  wreathAnchor: wreathAnchorItem,
  knot: knotItem,
  coatOfArms: coatOfArmsItem,
  wreathArms: wreathArmsItem
};

/* ---------- stripes (navy and RAAF officers) ---------- */

const STRIPE_WIDTH = { t: 4, m: 9, b: 18 };
const STRIPE_GAP = 4;

function stripesSvg(service, stripes, p) {
  const total =
    stripes.reduce((sum, s) => sum + STRIPE_WIDTH[s], 0) + STRIPE_GAP * (stripes.length - 1);
  let y = 150 - total;
  let out = "";

  stripes.forEach(s => {
    const h = STRIPE_WIDTH[s];
    if (service === "navy") {
      out += `<rect x="5" y="${y}" width="90" height="${h}" fill="${p.metal}"/>
        <rect x="5" y="${y + h - 1}" width="90" height="1" fill="${p.metalDark}"/>`;
    } else {
      const inner = Math.max(1.8, h * 0.4);
      out += `<rect x="5" y="${y}" width="90" height="${h}" fill="${p.stripe}"/>
        <rect x="5" y="${y + (h - inner) / 2}" width="90" height="${inner}" fill="${p.stripeLight}"/>`;
    }
    y += h + STRIPE_GAP;
  });

  if (service === "navy") {
    // executive curl above the top stripe
    const top = 150 - total;
    out += `<circle cx="${CX}" cy="${top - 7}" r="8" fill="none" stroke="${p.metal}" stroke-width="5"/>`;
  }

  return out;
}

/* ---------- item layout ---------- */

// Stacks items bottom-up, scaled to fill the free space and centred in it.
function stackItems(items, hasTopButton) {
  const gap = 6;
  const regionTop = hasTopButton ? 46 : 16;
  const regionBottom = 172;
  const available = regionBottom - regionTop;
  const total = items.reduce((sum, item) => sum + item.h, 0) + gap * (items.length - 1);
  const widest = Math.max(...items.map(item => item.w || 40));
  const maxScale = Math.min(...items.map(item => item.maxScale || 1.45));
  const k = Math.min(maxScale, available / total, 84 / widest);
  const centre = (regionTop + regionBottom) / 2;

  let bottom = centre + (total * k) / 2;
  let out = "";
  items.forEach(item => {
    const top = bottom - item.h * k;
    out += `<g transform="translate(${(CX * (1 - k)).toFixed(2)} ${top.toFixed(2)}) scale(${k.toFixed(3)})">${item.draw(0)}</g>`;
    bottom = top - gap * k;
  });
  return out;
}

// dark edge around shapes drawn on the gold shoulder board
const BOARD_OUTLINE_FILTER = `<filter id="board-outline" x="-10%" y="-10%" width="120%" height="120%">
  <feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="thick"/>
  <feFlood flood-color="${PALETTES.navy.boardOutline}"/>
  <feComposite in2="thick" operator="in" result="edge"/>
  <feMerge><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

/* ---------- slide shapes ---------- */

function slideOutline(shape) {
  if (shape === "army") return "M5,195 L5,45 A45,40 0 0 1 95,45 L95,195 Z";
  if (shape === "board") return "M5,195 L5,32 L50,6 L95,32 L95,195 Z";
  return "M5,195 L5,5 L95,5 L95,195 Z";
}

function renderInsignia(insignia, service) {
  const p = PALETTES[service];
  const shape = insignia.board ? "board" : service === "army" ? "army" : "rect";
  const fill = insignia.board ? p.board : p.slide;
  let body = "";

  if (insignia.board) {
    // gold lace texture and the button at the top
    for (let x = 12; x < 92; x += 6) {
      body += `<line x1="${x}" y1="20" x2="${x}" y2="195" stroke="${p.boardLine}" stroke-width="1"/>`;
    }
    body += `<circle cx="${CX}" cy="30" r="9" fill="${p.metal}" stroke="${p.boardOutline}" stroke-width="2"/>`;
  }

  if (service === "army") {
    body += `<circle cx="${CX}" cy="30" r="9" fill="${p.metal}" stroke="${p.metalDark}" stroke-width="1"/>
      <path d="M${CX - 5},33 L${CX},26 L${CX + 5},33 Z" fill="${p.metalDark}"/>`;
  }

  if (insignia.stripes) {
    body += stripesSvg(service, insignia.stripes, p);
  }

  if (insignia.whiteBand) {
    body += `<rect x="5" y="150" width="90" height="9" fill="#ffffff"/>`;
  }

  if (insignia.patch === "midshipman") {
    body += `<rect x="30" y="18" width="40" height="52" fill="#ffffff"/>
      <line x1="${CX}" y1="40" x2="${CX}" y2="66" stroke="#c9c9c9" stroke-width="3"/>
      <circle cx="${CX}" cy="32" r="8" fill="${p.metal}" stroke="${p.metalDark}" stroke-width="1"/>`;
  } else if (insignia.patch === "raafCadet") {
    body += `<path d="M26,150 L26,48 L50,30 L74,48 L74,150 Z" fill="#d6d8dd"/>
      <line x1="${CX}" y1="56" x2="${CX}" y2="150" stroke="#ffffff" stroke-width="3"/>
      <circle cx="${CX}" cy="46" r="7" fill="#e9b824" stroke="#a07a0c" stroke-width="1"/>`;
  }

  if (insignia.items && insignia.items.length) {
    const items = stackItems(insignia.items.map(name => ITEM_BUILDERS[name](p)), insignia.board || service === "army");
    // on the gold board, outline everything so gold and silver stand out
    body += insignia.board ? `<g filter="url(#board-outline)">${items}</g>` : items;
  }

  const label = insignia.label === undefined ? "AUSTRALIA" : insignia.label;
  if (label) {
    if (insignia.board) {
      body += `<rect x="5" y="176" width="90" height="19" fill="${p.slide}"/>`;
    }
    const labelColor = insignia.board ? p.metal : p.text;
    const labelSize = label.length > 4 ? 12 : 18;
    body += `<text x="${CX}" y="189" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${labelSize}" fill="${labelColor}">${label}</text>`;
  }

  const outline = slideOutline(shape);
  return `<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" class="insignia-svg">
    <defs>
      <clipPath id="clip-${shape}"><path d="${outline}"/></clipPath>
      ${insignia.board ? BOARD_OUTLINE_FILTER : ""}
    </defs>
    <path d="${outline}" fill="${fill}"/>
    <g clip-path="url(#clip-${shape})">${body}</g>
    <path d="${outline}" fill="none" stroke="${insignia.board ? "#111" : "#000"}" stroke-opacity="0.6" stroke-width="2"/>
  </svg>`;
}

// Returns markup for a rank's insignia: a supplied image if it has one, else the drawing.
// With useBoards, navy star ranks use their gold shoulder board instead of the rank slide.
function insigniaMarkup(rank, useBoards = false) {
  const board = useBoards && rank.boardInsignia;
  const image = board ? rank.boardImage : rank.image;
  if (image) {
    return `<img src="${image}" alt="" class="insignia-img">`;
  }
  return renderInsignia(board ? rank.boardInsignia : rank.insignia, rank.service);
}
