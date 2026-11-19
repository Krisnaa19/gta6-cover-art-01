// Vice Coast Cover Studio — cover renderer.
// Draws GTA-style multi-panel poster art on a 2D canvas from a plain state
// object. No network, no model calls: pure canvas math and vendored fonts.
// Exported names are the public surface the editor (main.js) uses.

export const PHOTOS = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard', caption: 'THE DRIVER', sub: '6:42 PM — LOOKING FOR TROUBLE' },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Pier', caption: 'THE ANGLER', sub: '5:30 AM — GONE FISHING' },
  { id: 'rooftop', src: 'samples/rooftop.jpg', label: 'Rooftop', caption: 'THE ROOF', sub: '8:15 PM — CITY LIGHTS' },
  { id: 'neon', src: 'samples/neon.jpg', label: 'Neon Street', caption: 'LAST CALL', sub: '11:58 PM — FULL THROTTLE' },
];

export const LAYOUTS = [
  { id: 'hero-grid', name: 'Hero Grid', panels: 5, hint: 'Big hero left, three stacked right' },
  { id: 'nine-panel', name: 'Nine Panel', panels: 6, hint: 'Poster grid with title band' },
  { id: 'slash', name: 'Slash', panels: 4, hint: 'Slanted diagonal panels' },
  { id: 'full-bleed', name: 'Full Bleed', panels: 2, hint: 'One photo, title over the art' },
  { id: 'tilted', name: 'Tilted Snaps', panels: 3, hint: 'Tilted snapshot frames' },
  { id: 'split-duo', name: 'Split Duo', panels: 2, hint: 'Two tall panels, bold band' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', tint: '#ff7a18', deep: '#c81d5e', sky: '#ffd319', filter: 'saturate(1.25) contrast(1.08) brightness(1.02)' },
  { id: 'neon', name: 'Neon Vice', tint: '#ff2e88', deep: '#7b2ff7', sky: '#22e6ff', filter: 'saturate(1.35) contrast(1.12) brightness(0.98)' },
  { id: 'golden', name: 'Golden Hour', tint: '#ffb347', deep: '#e25822', sky: '#ffe259', filter: 'saturate(1.3) contrast(1.05) brightness(1.04)' },
  { id: 'midnight', name: 'Midnight', tint: '#3a7bd5', deep: '#6a1fb5', sky: '#8e9bff', filter: 'saturate(1.15) contrast(1.1) brightness(0.92)' },
  { id: 'heatwave', name: 'Heatwave', tint: '#ff3b1f', deep: '#8f0f3c', sky: '#ffb03a', filter: 'saturate(1.45) contrast(1.18) brightness(1.0)' },
  { id: 'mono', name: 'Mono Noir', tint: '#cfcfcf', deep: '#222222', sky: '#f5f0e6', filter: 'grayscale(1) contrast(1.22) brightness(1.03)' },
];

export const SIZES = [
  { id: '1920x1080', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1350', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1080x1080', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
];

export function defaultState() {
  return {
    layout: 'hero-grid',
    grade: 'sunset',
    size: '1920x1080',
    title: 'VICE COAST',
    subtitle: 'Neon Tide',
    tagline: 'ONE COAST  •  NO RULES  •  COMING SOON',
    quote: '"A FEVER DREAM IN NEON" — THE COAST HERALD',
    stars: 5,
    seal: 'ORIGINAL',
    vol: 'VOL. 01',
    badge: "COLLECTOR'S EDITION",
    panels: [
      { photo: 'boulevard', zoom: 1.12, x: 0.5, y: 0.42, caption: 'THE DRIVER', sub: '6:42 PM — LOOKING FOR TROUBLE' },
      { photo: 'rooftop', zoom: 1.08, x: 0.5, y: 0.4, caption: 'THE ROOF', sub: '8:15 PM — CITY LIGHTS' },
      { photo: 'neon', zoom: 1.1, x: 0.5, y: 0.45, caption: 'LAST CALL', sub: '11:58 PM — FULL THROTTLE' },
      { photo: 'pier', zoom: 1.05, x: 0.5, y: 0.42, caption: 'THE ANGLER', sub: '5:30 AM — GONE FISHING' },
      { photo: 'boulevard', zoom: 1.35, x: 0.3, y: 0.3, caption: 'OCEAN DRIVE', sub: 'SUNSET RUN' },
      { photo: 'rooftop', zoom: 1.25, x: 0.62, y: 0.35, caption: 'SKYLINE', sub: 'GOLDEN HOUR' },
    ],
  };
}

export function sizeOf(state) {
  return SIZES.find((s) => s.id === state.size) || SIZES[0];
}

export function gradeOf(state) {
  return GRADES.find((g) => g.id === state.grade) || GRADES[0];
}

export function layoutOf(state) {
  return LAYOUTS.find((l) => l.id === state.layout) || LAYOUTS[0];
}

// ---- helpers -------------------------------------------------------------

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// Draw one photo into a rect, cover-fit, with the panel's pan/zoom and grade.
function drawPhoto(ctx, img, rect, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(w / iw, h / ih) * (panel.zoom || 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + w / 2 - dw * (panel.x ?? 0.5);
    const dy = y + h / 2 - dh * (panel.y ?? 0.5);
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    // Sunset wash: warm gradient from the top, deep colour from the bottom.
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, rgba(grade.sky, 0.10));
    wash.addColorStop(0.55, rgba(grade.tint, 0.06));
    wash.addColorStop(1, rgba(grade.deep, 0.20));
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, grade.tint);
    g.addColorStop(1, grade.deep);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  // Inner shade so captions stay readable.
  const shade = ctx.createLinearGradient(x, y + h * 0.55, x, y + h);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Caption chip pinned to a panel's bottom-left corner; caption and
// sub-caption share one box so nothing spills past the panel edge.
function drawCaption(ctx, rect, panel, scale) {
  if (!panel.caption) return;
  const pad = 12 * scale;
  ctx.save();
  ctx.font = `700 ${17 * scale}px Anton, "Arial Narrow", sans-serif`;
  const tw = ctx.measureText(panel.caption).width;
  let subW = 0;
  if (panel.sub) {
    ctx.font = `600 ${11.5 * scale}px "Arial Narrow", Arial, sans-serif`;
    subW = ctx.measureText(panel.sub).width;
  }
  const bw = Math.max(tw, subW) + pad * 2;
  const bh = 17 * scale + (panel.sub ? 16 * scale : 0) + pad * 1.5;
  const bx = rect.x + 10 * scale;
  const by = rect.y + rect.h - bh - 10 * scale;
  ctx.fillStyle = 'rgba(8,8,14,0.92)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${17 * scale}px Anton, "Arial Narrow", sans-serif`;
  ctx.fillText(panel.caption, bx + pad, by + pad + 14 * scale);
  if (panel.sub) {
    ctx.font = `600 ${11.5 * scale}px "Arial Narrow", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(panel.sub, bx + pad, by + pad + 14 * scale + 15 * scale);
  }
  ctx.restore();
}

// One palm silhouette: curved trunk + drooping fronds.
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -34, 16, -62);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13);
    const len = 34 - Math.abs(i - 3) * 4;
    const tx = 16 + Math.cos(a) * len;
    const ty = -62 + Math.sin(a) * len * 0.7 + 14;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(16, -62);
    ctx.quadraticCurveTo(16 + Math.cos(a) * len * 0.55, -62 + Math.sin(a) * len * 0.4 - 6, tx, ty);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(16, -62, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Film grain: one shared noise tile, tiled at low alpha.
let grainTile = null;
function grain(ctx, w, h) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 140;
    grainTile.height = 140;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(140, 140);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 118 + Math.floor(Math.random() * 40);
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Halftone dots fading out of one corner.
function halftone(ctx, w, h, cx, cy, color, maxR) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(10, w / 160);
  for (let gy = 0; gy < h; gy += step) {
    for (let gx = 0; gx < w; gx += step) {
      const d = Math.hypot(gx - cx, gy - cy) / maxR;
      if (d > 1) continue;
      const r = (1 - d) * step * 0.3;
      if (r < 0.6) continue;
      ctx.globalAlpha = 0.16 * (1 - d);
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function starRow(ctx, cx, cy, r, n, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 0.9;
  for (let i = 0; i < n; i++) {
    const x = cx + (i - (n - 1) / 2) * r * 2.4;
    drawStar(ctx, x, cy, r);
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// Starburst seal with two lines of text.
function drawSeal(ctx, cx, cy, r, line1, line2, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#1a0b1e';
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i * Math.PI) / spikes;
    const rr = i % 2 === 0 ? r : r * 0.82;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.strokeStyle = '#1a0b1e';
  ctx.lineWidth = Math.max(1.5, r * 0.035);
  ctx.stroke();
  ctx.fillStyle = '#1a0b1e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.34}px Anton, sans-serif`;
  ctx.fillText(line1, 0, -r * 0.16);
  ctx.font = `700 ${r * 0.2}px Arial, sans-serif`;
  ctx.fillText(line2, 0, r * 0.24);
  ctx.restore();
}

function barcode(ctx, x, y, w, h, seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = '#111111';
  let bx = x;
  let s = seed;
  while (bx < x + w) {
    s = (s * 1103515245 + 12345) >>> 0;
    const bw = 2 + (s % 4);
    if ((s >> 3) % 2 === 0) ctx.fillRect(bx, y, bw, h);
    bx += bw + 2;
  }
  ctx.restore();
}

// Big poster title: gradient fill, heavy outline, offset shadow.
// maxH caps the cap-height so the title fits its band.
function drawTitle(ctx, text, cx, y, maxW, grade, scale, maxH) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let size = 200 * scale;
  ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
  const w = ctx.measureText(text).width;
  if (w > maxW) size *= maxW / w;
  if (maxH && size > maxH) size = maxH;
  ctx.font = `${size}px Anton, "Arial Narrow", sans-serif`;
  const grad = ctx.createLinearGradient(0, y - size * 0.85, 0, y + size * 0.12);
  grad.addColorStop(0, '#fff7d6');
  grad.addColorStop(0.45, grade.sky);
  grad.addColorStop(0.75, grade.tint);
  grad.addColorStop(1, grade.deep);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  // Drop shadow pass.
  ctx.strokeStyle = 'rgba(20,4,28,0.9)';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, cx + size * 0.045, y + size * 0.05);
  // Outline pass.
  ctx.strokeStyle = '#160a1c';
  ctx.lineWidth = size * 0.09;
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, y);
  // Thin hot rim on top.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = size * 0.012;
  ctx.strokeText(text, cx, y - size * 0.02);
  ctx.restore();
  return size;
}

function drawScript(ctx, text, cx, y, size, color, glow) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${size}px Pacifico, cursive`;
  ctx.shadowColor = glow;
  ctx.shadowBlur = size * 0.35;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(text, cx, y - size * 0.04);
  ctx.restore();
}

// ---- layouts -------------------------------------------------------------
// Each layout returns panel rects for a panel area of height panelH;
// the title zone is computed separately in renderCover.

function layoutRects(id, W, H, panelH) {
  switch (id) {
    case 'hero-grid': {
      const gap = 10;
      const heroW = W * 0.56;
      const rightX = heroW + gap;
      const rightW = W - rightX;
      const topH = (panelH - gap * 2) * 0.52;
      return {
        panels: [
          { x: 0, y: 0, w: heroW, h: panelH },
          { x: rightX, y: 0, w: rightW, h: topH },
          { x: rightX, y: topH + gap, w: rightW * 0.5 - gap / 2, h: panelH - topH - gap },
          { x: rightX + rightW * 0.5 + gap / 2, y: topH + gap, w: rightW * 0.5 - gap / 2, h: panelH - topH - gap },
          { x: 0, y: 0, w: 0, h: 0 }, // spare slot, unused
        ],
        slant: 0,
      };
    }
    case 'nine-panel': {
      const gap = 8;
      const col = (W - gap * 2) / 3;
      const r1 = panelH * 0.38;
      const r2 = panelH * 0.24;
      const r3 = panelH - r1 - r2 - gap * 2;
      return {
        panels: [
          { x: 0, y: 0, w: col, h: r1 + r2 + gap },
          { x: col + gap, y: 0, w: col, h: r1 },
          { x: col * 2 + gap * 2, y: 0, w: col, h: r1 },
          { x: col + gap, y: r1 + gap, w: col, h: r2 + gap + r3 },
          { x: col * 2 + gap * 2, y: r1 + gap, w: col, h: r2 + gap + r3 },
          { x: 0, y: r1 + r2 + gap * 2, w: col, h: r3 },
        ],
        slant: 0,
      };
    }
    case 'slash': {
      const gap = 12;
      const w3 = (W - gap * 2) / 3;
      return {
        panels: [
          { x: 0, y: 0, w: w3 + 40, h: panelH },
          { x: w3 + gap, y: 0, w: w3 + 40, h: panelH },
          { x: w3 * 2 + gap * 2, y: 0, w: w3 - 28, h: panelH * 0.55 },
          { x: w3 * 2 + gap * 2, y: panelH * 0.55 + gap, w: w3 - 28, h: panelH * 0.45 - gap },
        ],
        slant: 0.06,
      };
    }
    case 'full-bleed':
      return {
        panels: [
          { x: 0, y: 0, w: W, h: H },
          { x: W * 0.68, y: H * 0.08, w: W * 0.26, h: H * 0.3 },
        ],
        slant: 0,
      };
    case 'tilted': {
      const pw = W * 0.3;
      const ph = H * 0.52;
      return {
        panels: [
          { x: W * 0.06, y: H * 0.06, w: pw, h: ph, rot: -0.06 },
          { x: W * 0.35, y: H * 0.02, w: pw, h: ph, rot: 0.03 },
          { x: W * 0.64, y: H * 0.08, w: pw, h: ph, rot: -0.02 },
        ],
        slant: 0,
      };
    }
    case 'split-duo': {
      const gap = 10;
      return {
        panels: [
          { x: 0, y: 0, w: W * 0.5 - gap / 2, h: panelH },
          { x: W * 0.5 + gap / 2, y: 0, w: W * 0.5 - gap / 2, h: panelH },
        ],
        slant: 0,
      };
    }
    default:
      return layoutRects('hero-grid', W, H, panelH);
  }
}

// ---- main render ---------------------------------------------------------

export function renderCover(canvas, state, images) {
  const { w: W, h: H } = sizeOf(state);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeOf(state);
  const scale = W / 1920;
  const stripH = Math.max(26, H * 0.045);
  const bandH = Math.min(H * 0.22, W * 0.22);
  const floating = state.layout === 'full-bleed' || state.layout === 'tilted';
  const panelH = floating ? H : H - bandH - stripH;
  const layout = layoutRects(state.layout, W, H, panelH);
  const count = layoutOf(state).panels;

  // Backdrop.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, grade.deep);
  bg.addColorStop(0.5, '#14081c');
  bg.addColorStop(1, '#0a0610');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Panels.
  ctx.save();
  ctx.strokeStyle = '#f5efe4';
  ctx.lineWidth = Math.max(3, 6 * scale);
  for (let i = 0; i < count; i++) {
    const rect = layout.panels[i];
    if (!rect || rect.w <= 0) continue;
    const panel = state.panels[i] || state.panels[0];
    const img = images[panel.photo];
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      drawPhoto(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, panel, grade);
      ctx.strokeStyle = '#f5efe4';
      ctx.lineWidth = Math.max(3, 6 * scale);
      ctx.strokeRect(0, 0, rect.w, rect.h);
      ctx.restore();
      // Caption outside the rotation, at the frame's bottom.
      drawCaption(ctx, { x: rect.x, y: rect.y, w: rect.w, h: rect.h }, panel, scale);
      continue;
    }
    if (layout.slant) {
      const s = W * layout.slant;
      ctx.beginPath();
      ctx.moveTo(rect.x + s, rect.y);
      ctx.lineTo(rect.x + rect.w + s, rect.y);
      ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
      ctx.lineTo(rect.x - s, rect.y + rect.h);
      ctx.closePath();
      ctx.clip();
      drawPhoto(ctx, img, rect, panel, grade);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rect.x + s, rect.y);
      ctx.lineTo(rect.x + rect.w + s, rect.y);
      ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
      ctx.lineTo(rect.x - s, rect.y + rect.h);
      ctx.closePath();
      ctx.strokeStyle = '#f5efe4';
      ctx.lineWidth = Math.max(3, 6 * scale);
      ctx.stroke();
      ctx.restore();
    } else {
      drawPhoto(ctx, img, rect, panel, grade);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    drawCaption(ctx, rect, panel, scale);
  }
  ctx.restore();

  // Halftone accents over the sky corners.
  halftone(ctx, W, H, W * 0.92, H * 0.06, '#ffffff', W * 0.28);
  halftone(ctx, W, H, W * 0.04, H * 0.9, grade.sky, W * 0.2);

  // Title zone: a solid band above the tagline strip for grid layouts,
  // a scrim floating over the art for full-bleed / tilted.
  const tz = floating
    ? { x: 0, y: H * 0.62, w: W, h: H * 0.38 }
    : { x: 0, y: panelH, w: W, h: bandH };
  if (floating) {
    // Title floats over the art: dark scrim behind it.
    const scrim = ctx.createLinearGradient(0, tz.y - H * 0.08, 0, H);
    scrim.addColorStop(0, 'rgba(10,4,16,0)');
    scrim.addColorStop(1, 'rgba(10,4,16,0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, tz.y - H * 0.08, W, H - tz.y + H * 0.08);
  } else {
    // Solid band with a palm strip along its top edge.
    const bandGrad = ctx.createLinearGradient(0, tz.y, 0, H);
    bandGrad.addColorStop(0, '#1c0a24');
    bandGrad.addColorStop(1, '#0c0512');
    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, tz.y, W, tz.h);
    ctx.fillStyle = grade.tint;
    ctx.fillRect(0, tz.y, W, Math.max(3, 5 * scale));
  }

  const titleSize = drawTitle(ctx, state.title, W / 2, tz.y + tz.h * 0.68, W * 0.94, grade, scale, tz.h * 0.52);

  // Script subtitle overlapping the title's lower edge, kept above the strip.
  if (state.subtitle) {
    const subY = Math.min(tz.y + tz.h * 0.9, H - stripH - 6 * scale);
    drawScript(ctx, state.subtitle, W / 2 + W * 0.08, subY, titleSize * 0.38, '#ff5da2', '#ff2e88');
  }

  // Quote + stars above the title, inside the band or over the scrim.
  if (state.quote) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(15 * scale)}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(state.quote, W / 2, tz.y + tz.h * 0.11);
    ctx.restore();
  }
  starRow(ctx, W / 2 - W * 0.32, tz.y + tz.h * 0.11, 11 * scale, state.stars, '#ffd319');

  // Seal badge at the right of the title zone.
  drawSeal(ctx, W * 0.9, tz.y + tz.h * 0.52, 46 * scale, state.seal, 'COVER ART', '#ffd319');

  // Volume + edition badges.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = `700 ${Math.round(16 * scale)}px Anton, sans-serif`;
  const volW = ctx.measureText(state.vol).width + 24 * scale;
  ctx.fillStyle = '#22e6ff';
  ctx.fillRect(W * 0.03, tz.y + tz.h * 0.14, volW, 30 * scale);
  ctx.fillStyle = '#08131a';
  ctx.fillText(state.vol, W * 0.03 + 12 * scale, tz.y + tz.h * 0.14 + 22 * scale);
  ctx.restore();

  // Bottom tagline strip: palms at the left end, barcode at the right.
  const stripY = H - stripH;
  const stripGrad = ctx.createLinearGradient(0, stripY, W, stripY);
  stripGrad.addColorStop(0, grade.deep);
  stripGrad.addColorStop(0.5, grade.tint);
  stripGrad.addColorStop(1, grade.deep);
  ctx.fillStyle = stripGrad;
  ctx.fillRect(0, stripY, W, stripH);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round(15 * scale)}px Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.tagline, W / 2, stripY + stripH * 0.68);
  ctx.restore();
  drawPalm(ctx, 30 * scale, stripY + stripH - 2 * scale, 0.62 * scale, 'rgba(20,6,26,0.9)');
  drawPalm(ctx, W - 128 * scale, stripY + stripH - 2 * scale, 0.62 * scale, 'rgba(20,6,26,0.9)');
  barcode(ctx, W - 74 * scale, stripY + (stripH - 22 * scale) / 2, 52 * scale, 22 * scale, state.title);

  // Edition ribbon at the top-right of the title zone.
  if (state.badge) {
    ctx.save();
    ctx.font = `700 ${Math.round(13 * scale)}px Arial, sans-serif`;
    const bw = ctx.measureText(state.badge).width + 28 * scale;
    const ry = tz.y + 8 * scale;
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.moveTo(W - bw - 10 * scale, ry);
    ctx.lineTo(W - 10 * scale, ry);
    ctx.lineTo(W - 22 * scale, ry + 24 * scale);
    ctx.lineTo(W - bw + 2 * scale, ry + 24 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(state.badge, W - bw / 2 - 10 * scale, ry + 17 * scale);
    ctx.restore();
  }

  // Vignette + grain finish.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H);

  // Thin poster frame.
  ctx.save();
  ctx.strokeStyle = '#f5efe4';
  ctx.lineWidth = Math.max(3, 5 * scale);
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.restore();
}

// Load the sample photos (and any data-URL uploads) into Image objects.
export function loadImages(photoIds) {
  const out = {};
  const jobs = photoIds.map((id) => new Promise((resolve) => {
    const meta = PHOTOS.find((p) => p.id === id);
    const img = new Image();
    img.onload = () => { out[id] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = meta ? meta.src : id;
  }));
  return Promise.all(jobs).then(() => out);
}
