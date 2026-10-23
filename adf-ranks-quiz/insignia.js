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

function wreath(cx, cy, r, color, leaves = 9) {
  let out = "";
  // two sprays from the bottom up each side, open at the top
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < leaves; i++) {
      const deg = 90 + side * (14 + i * (125 / leaves));
      const a = (deg * Math.PI) / 180;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      out += `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="5.5" ry="2.4" fill="${color}" transform="rotate(${(deg + 90 + side * 25).toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})"/>`;
    }
  }
  // tie at the bottom
  out += `<circle cx="${cx}" cy="${cy + r}" r="2.6" fill="${color}"/>`;
  return out;
}

/* ---------- items: each returns { h, draw(top) } ---------- */

function crownItem(p, mono = false, scale = 1) {
  const s = scale;
  const h = 26 * s;
  return {
    h,
    w: 28 * s,
    draw(y) {
      const cap = mono ? p.metal : CROWN_RED;
      const capOpacity = mono ? 0.55 : 1;
      return `<g transform="translate(${CX} ${y}) scale(${s})">
        <path d="M-12,17 C-14,6 -6,1 0,4 C6,1 14,6 12,17 Z" fill="${cap}" fill-opacity="${capOpacity}"/>
        <path d="M-12,17 C-14,6 -6,1 0,4 C6,1 14,6 12,17" fill="none" stroke="${p.metal}" stroke-width="2"/>
        <path d="M0,4 L0,17" stroke="${p.metal}" stroke-width="2"/>
        <rect x="-3" y="-3" width="6" height="2" fill="${p.metal}"/>
        <rect x="-1" y="-5" width="2" height="7" fill="${p.metal}"/>
        <rect x="-13" y="17" width="26" height="6" rx="1" fill="${p.metal}"/>
        <circle cx="-7" cy="20" r="1.3" fill="${mono ? p.slide : CROWN_RED}"/>
        <circle cx="0" cy="20" r="1.3" fill="${mono ? p.slide : "#1d5fbf"}"/>
        <circle cx="7" cy="20" r="1.3" fill="${mono ? p.slide : CROWN_RED}"/>
      </g>`;
    }
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

function anchorShape(color, h) {
  // drawn centred on x=0 from y=0 to y=h
  return `<circle cx="0" cy="4" r="3.6" fill="none" stroke="${color}" stroke-width="2.4"/>
    <rect x="-1.6" y="7" width="3.2" height="${h - 11}" fill="${color}"/>
    <rect x="-11" y="12" width="22" height="3.2" rx="1.5" fill="${color}"/>
    <path d="M-16,${h - 15} Q-12,${h + 1} 0,${h - 2} Q12,${h + 1} 16,${h - 15}" fill="none" stroke="${color}" stroke-width="3.2"/>
    <polygon points="-16,${h - 20} -20,${h - 12} -13,${h - 13}" fill="${color}"/>
    <polygon points="16,${h - 20} 20,${h - 12} 13,${h - 13}" fill="${color}"/>
    <path d="M-1,9 C8,14 -8,22 4,30 C10,34 6,40 1,44" fill="none" stroke="${color}" stroke-width="1.2"/>`;
}

function anchorItem(p, color = p.metal) {
  return { h: 48, w: 40, draw: y => `<g transform="translate(${CX} ${y})">${anchorShape(color, 46)}</g>` };
}

function crossedAnchorsItem(p) {
  return {
    h: 48,
    draw(y) {
      const cy = y + 24;
      return `<g transform="translate(${CX} ${cy})">
        <g transform="rotate(-32) translate(0 -23)">${anchorShape(p.metal, 46)}</g>
        <g transform="rotate(32) translate(0 -23)">${anchorShape(p.metal, 46)}</g>
      </g>`;
    }
  };
}

function wreathAnchorItem(p) {
  return {
    h: 56,
    w: 62,
    draw(y) {
      const cy = y + 26;
      return `${wreath(CX, cy, 25, p.metal, 9)}
        <g transform="translate(${CX} ${cy - 17}) scale(0.75)">${anchorShape(p.metal, 46)}</g>`;
    }
  };
}

// Able Seaman: vertical rope knot
function knotItem(p) {
  return {
    h: 50,
    draw(y) {
      const c = p.metal;
      const top = y + 3;
      const bottom = y + 47;
      return `<path d="M${CX - 2},${top} C${CX + 12},${top + 8} ${CX + 12},${top + 18} ${CX},${top + 22} C${CX - 12},${top + 26} ${CX - 12},${top + 36} ${CX + 2},${bottom}" fill="none" stroke="${c}" stroke-width="4.5"/>
        <path d="M${CX + 2},${top} C${CX - 12},${top + 8} ${CX - 12},${top + 18} ${CX},${top + 22} C${CX + 12},${top + 26} ${CX + 12},${top + 36} ${CX - 2},${bottom}" fill="none" stroke="${c}" stroke-width="4.5"/>
        <path d="M${CX - 6},${top + 2} Q${CX},${top - 4} ${CX + 6},${top + 2}" fill="none" stroke="${c}" stroke-width="4"/>
        <path d="M${CX - 6},${bottom - 2} Q${CX},${bottom + 4} ${CX + 6},${bottom - 2}" fill="none" stroke="${c}" stroke-width="4"/>`;
    }
  };
}

// simplified Commonwealth Coat of Arms
function coatOfArmsShape(p) {
  const c = p.metal;
  return `<polygon points="${starPoints(0, -22, 7, 5, 2.2)}" fill="${c}"/>
    <path d="M-10,-14 H10 V2 Q10,12 0,15 Q-10,12 -10,2 Z" fill="${c}"/>
    <path d="M-10,-6 H10 M-10,3 H10 M-3.3,-14 V13 M3.3,-14 V13" stroke="${p.slide}" stroke-width="1"/>
    <g fill="${c}">
      <ellipse cx="-19" cy="0" rx="5" ry="10" transform="rotate(-18 -19 0)"/>
      <ellipse cx="-15" cy="-13" rx="2.6" ry="4" transform="rotate(20 -15 -13)"/>
      <path d="M-22,8 Q-30,14 -34,20" stroke="${c}" stroke-width="2.4" fill="none"/>
      <path d="M-20,9 L-16,17 M-17,8 L-13,16" stroke="${c}" stroke-width="2"/>
      <ellipse cx="18" cy="2" rx="7" ry="6"/>
      <path d="M15,-2 Q13,-12 16,-18" stroke="${c}" stroke-width="2.4" fill="none"/>
      <circle cx="17" cy="-19" r="2.4"/>
      <path d="M17,7 L15,17 M20,7 L22,17" stroke="${c}" stroke-width="1.8"/>
    </g>
    <rect x="-20" y="17" width="40" height="5" rx="2.5" fill="${c}"/>
    <g fill="${c}">
      <circle cx="-26" cy="20" r="2"/><circle cx="-29" cy="16" r="1.6"/>
      <circle cx="26" cy="20" r="2"/><circle cx="29" cy="16" r="1.6"/>
    </g>`;
}

function coatOfArmsItem(p) {
  return { h: 52, w: 72, draw: y => `<g transform="translate(${CX} ${y + 28})">${coatOfArmsShape(p)}</g>` };
}

function wreathArmsItem(p) {
  return {
    h: 66,
    w: 78,
    draw(y) {
      const cy = y + 32;
      return `${wreath(CX, cy, 33, p.metal, 11)}
        <g transform="translate(${CX} ${cy + 2}) scale(0.78)">${coatOfArmsShape(p)}</g>`;
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
  const k = Math.min(1.45, available / total, 84 / widest);
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
