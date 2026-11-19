// Vice Coast Cover Studio — editor.
// Owns the state, the live preview, panel editing (click, drag to pan,
// wheel to zoom), undo/redo, PNG export and the ?shot= scenes used for
// screenshots. The cover itself is drawn by cover.js.

import { PHOTOS, LAYOUTS, GRADES, SIZES, defaultState, sizeOf, gradeOf, layoutOf, renderCover, loadImages } from './cover.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let state = defaultState();
let images = {};
let uploads = {}; // data-URL photos the user added this session
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];
let dragging = null;

const preview = $('#preview');
const pctx = preview.getContext('2d');

function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  refreshUndoButtons();
}

function applySnapshot(snap) {
  state = JSON.parse(JSON.stringify(snap));
  syncControls();
  draw();
}

function refreshUndoButtons() {
  $('#undoBtn').disabled = undoStack.length === 0;
  $('#redoBtn').disabled = redoStack.length === 0;
}

function photoMeta(id) {
  return PHOTOS.find((p) => p.id === id) || { id, label: 'Uploaded photo', caption: 'YOUR SHOT', sub: '' };
}

function currentPanel() {
  return state.panels[selectedPanel];
}

// ---- drawing -------------------------------------------------------------

function draw() {
  const { w, h } = sizeOf(state);
  // Preview at a fixed internal width for speed; the canvas element scales.
  const pw = 960;
  const ph = Math.round((960 * h) / w);
  if (preview.width !== pw || preview.height !== ph) {
    preview.width = pw;
    preview.height = ph;
  }
  // renderCover sizes the canvas to the export size; draw onto a scratch
  // canvas at export size, then scale into the preview.
  const scratch = draw.scratch || (draw.scratch = document.createElement('canvas'));
  renderCover(scratch, state, { ...images, ...uploads });
  pctx.clearRect(0, 0, pw, ph);
  pctx.drawImage(scratch, 0, 0, pw, ph);
  // Selection outline on the chosen panel, in preview coordinates.
  const rects = panelRectsPreview();
  const r = rects[selectedPanel];
  if (r) {
    pctx.save();
    pctx.strokeStyle = '#22e6ff';
    pctx.lineWidth = 3;
    pctx.setLineDash([8, 6]);
    pctx.strokeRect(r.x, r.y, r.w, r.h);
    pctx.restore();
  }
  $('#sizeLabel').textContent = `${w} × ${h}`;
}

// Panel rects in preview pixels, mirroring cover.js layout math.
function panelRectsPreview() {
  const { w: W, h: H } = sizeOf(state);
  const sx = preview.width / W;
  const sy = preview.height / H;
  const stripH = Math.max(26, H * 0.045);
  const bandH = Math.min(H * 0.22, W * 0.22);
  const floating = state.layout === 'full-bleed' || state.layout === 'tilted';
  const panelH = floating ? H : H - bandH - stripH;
  const gap = 10;
  const out = [];
  const push = (x, y, w, h) => out.push({ x: x * sx, y: y * sy, w: w * sx, h: h * sy });
  switch (state.layout) {
    case 'hero-grid': {
      const heroW = W * 0.56;
      const rightX = heroW + gap;
      const rightW = W - rightX;
      const topH = (panelH - gap * 2) * 0.52;
      push(0, 0, heroW, panelH);
      push(rightX, 0, rightW, topH);
      push(rightX, topH + gap, rightW * 0.5 - gap / 2, panelH - topH - gap);
      push(rightX + rightW * 0.5 + gap / 2, topH + gap, rightW * 0.5 - gap / 2, panelH - topH - gap);
      push(0, 0, 0, 0);
      break;
    }
    case 'nine-panel': {
      const g = 8;
      const col = (W - g * 2) / 3;
      const r1 = panelH * 0.38;
      const r2 = panelH * 0.24;
      const r3 = panelH - r1 - r2 - g * 2;
      push(0, 0, col, r1 + r2 + g);
      push(col + g, 0, col, r1);
      push(col * 2 + g * 2, 0, col, r1);
      push(col + g, r1 + g, col, r2 + g + r3);
      push(col * 2 + g * 2, r1 + g, col, r2 + g + r3);
      push(0, r1 + r2 + g * 2, col, r3);
      break;
    }
    case 'slash': {
      const g = 12;
      const w3 = (W - g * 2) / 3;
      push(0, 0, w3 + 40, panelH);
      push(w3 + g, 0, w3 + 40, panelH);
      push(w3 * 2 + g * 2, 0, w3 - 28, panelH * 0.55);
      push(w3 * 2 + g * 2, panelH * 0.55 + g, w3 - 28, panelH * 0.45 - g);
      break;
    }
    case 'full-bleed':
      push(0, 0, W, H);
      push(W * 0.68, H * 0.08, W * 0.26, H * 0.3);
      break;
    case 'tilted': {
      const pw = W * 0.3;
      const ph = H * 0.52;
      push(W * 0.06, H * 0.06, pw, ph);
      push(W * 0.35, H * 0.02, pw, ph);
      push(W * 0.64, H * 0.08, pw, ph);
      break;
    }
    case 'split-duo':
      push(0, 0, W * 0.5 - gap / 2, panelH);
      push(W * 0.5 + gap / 2, 0, W * 0.5 - gap / 2, panelH);
      break;
    default:
      break;
  }
  return out;
}

// ---- controls ------------------------------------------------------------

function buildPickers() {
  const layoutRow = $('#layoutRow');
  layoutRow.innerHTML = '';
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = l.name;
    b.title = l.hint;
    b.dataset.id = l.id;
    b.addEventListener('click', () => {
      if (state.layout === l.id) return;
      pushUndo();
      state.layout = l.id;
      selectedPanel = 0;
      syncControls();
      draw();
    });
    layoutRow.appendChild(b);
  }

  const gradeRow = $('#gradeRow');
  gradeRow.innerHTML = '';
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.className = 'chip swatch';
    b.dataset.id = g.id;
    b.innerHTML = `<span class="dot" style="background:linear-gradient(135deg,${g.sky},${g.tint},${g.deep})"></span>${g.name}`;
    b.addEventListener('click', () => {
      if (state.grade === g.id) return;
      pushUndo();
      state.grade = g.id;
      syncControls();
      draw();
    });
    gradeRow.appendChild(b);
  }

  const sizeRow = $('#sizeRow');
  sizeRow.innerHTML = '';
  for (const s of SIZES) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = s.name;
    b.dataset.id = s.id;
    b.addEventListener('click', () => {
      if (state.size === s.id) return;
      pushUndo();
      state.size = s.id;
      syncControls();
      draw();
    });
    sizeRow.appendChild(b);
  }

  const lib = $('#photoLib');
  lib.innerHTML = '';
  for (const p of PHOTOS) {
    const d = document.createElement('button');
    d.className = 'thumb';
    d.dataset.id = p.id;
    d.innerHTML = `<img src="${p.src}" alt="${p.label}"><span>${p.label}</span>`;
    d.addEventListener('click', () => assignPhoto(p.id));
    lib.appendChild(d);
  }
}

function assignPhoto(id) {
  const panel = currentPanel();
  if (!panel || panel.photo === id) return;
  pushUndo();
  const meta = photoMeta(id);
  panel.photo = id;
  panel.caption = meta.caption;
  panel.sub = meta.sub;
  panel.zoom = 1.1;
  panel.x = 0.5;
  panel.y = 0.42;
  syncControls();
  draw();
}

function syncControls() {
  $$('#layoutRow .chip').forEach((b) => b.classList.toggle('on', b.dataset.id === state.layout));
  $$('#gradeRow .chip').forEach((b) => b.classList.toggle('on', b.dataset.id === state.grade));
  $$('#sizeRow .chip').forEach((b) => b.classList.toggle('on', b.dataset.id === state.size));
  $('#titleInput').value = state.title;
  $('#subtitleInput').value = state.subtitle;
  $('#taglineInput').value = state.tagline;
  $('#quoteInput').value = state.quote;
  $('#starsInput').value = String(state.stars);
  const panel = currentPanel();
  $('#panelLabel').textContent = `Panel ${selectedPanel + 1} — ${photoMeta(panel.photo).label}`;
  $('#captionInput').value = panel.caption || '';
  $('#captionSubInput').value = panel.sub || '';
  $('#zoomInput').value = String(Math.round((panel.zoom || 1) * 100));
  $('#zoomVal').textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  $$('#photoLib .thumb').forEach((t) => t.classList.toggle('on', t.dataset.id === panel.photo));
  refreshUndoButtons();
}

function bindTextInputs() {
  const bind = (id, key, undoOnChange = true) => {
    const el = $(id);
    el.addEventListener('focus', () => { el._before = el.value; });
    el.addEventListener('change', () => {
      if (el.value === el._before) return;
      if (undoOnChange) pushUndo();
      state[key] = el.value;
      draw();
    });
    el.addEventListener('input', () => { state[key] = el.value; draw(); });
  };
  bind('#titleInput', 'title');
  bind('#subtitleInput', 'subtitle');
  bind('#taglineInput', 'tagline');
  bind('#quoteInput', 'quote');
  $('#starsInput').addEventListener('change', (e) => {
    pushUndo();
    state.stars = Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 5));
    syncControls();
    draw();
  });
  $('#captionInput').addEventListener('input', (e) => { currentPanel().caption = e.target.value; draw(); });
  $('#captionInput').addEventListener('change', () => pushUndo());
  $('#captionSubInput').addEventListener('input', (e) => { currentPanel().sub = e.target.value; draw(); });
  $('#captionSubInput').addEventListener('change', () => pushUndo());
  $('#zoomInput').addEventListener('input', (e) => {
    currentPanel().zoom = Math.max(1, Math.min(3, parseInt(e.target.value, 10) / 100 || 1));
    $('#zoomVal').textContent = `${e.target.value}%`;
    draw();
  });
  $('#zoomInput').addEventListener('change', () => pushUndo());
}

function bindCanvas() {
  preview.addEventListener('pointerdown', (e) => {
    const r = preview.getBoundingClientRect();
    const px = (e.clientX - r.left) * (preview.width / r.width);
    const py = (e.clientY - r.top) * (preview.height / r.height);
    const rects = panelRectsPreview();
    let hit = -1;
    for (let i = rects.length - 1; i >= 0; i--) {
      const q = rects[i];
      if (q && q.w > 0 && px >= q.x && px <= q.x + q.w && py >= q.y && py <= q.y + q.h) { hit = i; break; }
    }
    if (hit < 0) return;
    selectedPanel = hit;
    syncControls();
    draw();
    dragging = { x: px, y: py, panel: currentPanel(), ox: currentPanel().x, oy: currentPanel().y, moved: false };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = preview.getBoundingClientRect();
    const px = (e.clientX - r.left) * (preview.width / r.width);
    const py = (e.clientY - r.top) * (preview.height / r.height);
    const dx = px - dragging.x;
    const dy = py - dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragging.moved = true;
    const panel = dragging.panel;
    // Pan in photo space: moving the pointer right shows more of the left.
    panel.x = clamp01(dragging.ox - dx / preview.width);
    panel.y = clamp01(dragging.oy - dy / preview.height);
    draw();
  });
  preview.addEventListener('pointerup', () => {
    if (dragging && dragging.moved) pushUndo();
    dragging = null;
  });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = currentPanel();
    const before = panel.zoom;
    panel.zoom = Math.max(1, Math.min(3, (panel.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.92)));
    if (panel.zoom !== before) { draw(); }
    clearTimeout(preview._wheelT);
    preview._wheelT = setTimeout(() => { pushUndo(); syncControls(); }, 400);
  }, { passive: false });
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// ---- export --------------------------------------------------------------

async function exportPng() {
  const { w, h } = sizeOf(state);
  const canvas = document.createElement('canvas');
  renderCover(canvas, state, { ...images, ...uploads });
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-coast-${state.size}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  $('#exportNote').textContent = `Exported ${w} × ${h} PNG — check your downloads.`;
}

// ---- surprise me ---------------------------------------------------------

function surprise() {
  pushUndo();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layout = pick(LAYOUTS).id;
  state.grade = pick(GRADES).id;
  const count = layoutOf(state).panels;
  const shuffled = [...PHOTOS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count; i++) {
    const meta = shuffled[i % shuffled.length];
    state.panels[i] = {
      photo: meta.id,
      zoom: 1.05 + Math.random() * 0.3,
      x: 0.35 + Math.random() * 0.3,
      y: 0.3 + Math.random() * 0.3,
      caption: meta.caption,
      sub: meta.sub,
    };
  }
  selectedPanel = 0;
  syncControls();
  draw();
}

// ---- uploads -------------------------------------------------------------

function bindUpload() {
  $('#uploadInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await new Promise((res) => {
      const rd = new FileReader();
      rd.onload = () => res(rd.result);
      rd.readAsDataURL(file);
    });
    const id = `upload-${Date.now()}`;
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = dataUrl; });
    uploads[id] = img;
    const d = document.createElement('button');
    d.className = 'thumb on';
    d.dataset.id = id;
    d.innerHTML = `<img src="${dataUrl}" alt="Uploaded photo"><span>Your photo</span>`;
    d.addEventListener('click', () => assignPhoto(id));
    $('#photoLib').appendChild(d);
    assignPhoto(id);
    e.target.value = '';
  });
}

// ---- shot mode (headless screenshots) ------------------------------------

async function shotMode() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return false;
  document.body.classList.add('shot');
  if (q.get('layout')) state.layout = q.get('layout');
  if (q.get('grade')) state.grade = q.get('grade');
  if (q.get('size')) state.size = q.get('size');
  if (q.get('title')) state.title = q.get('title');
  if (q.get('subtitle')) state.subtitle = q.get('subtitle');
  await document.fonts.ready;
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('100px Pacifico');
  } catch (err) { /* fonts fall back */ }
  if (shot === 'cover' || shot === 'portrait' || shot === 'square') {
    const { w, h } = sizeOf(state);
    const canvas = document.createElement('canvas');
    renderCover(canvas, state, { ...images, ...uploads });
    canvas.id = 'shotCanvas';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.objectFit = 'contain';
    canvas.style.background = '#000';
    document.body.innerHTML = '';
    document.body.appendChild(canvas);
    document.body.style.margin = '0';
    document.body.style.background = '#000';
  } else {
    // editor scene: normal UI with photos loaded.
    syncControls();
    draw();
  }
  document.title = 'ready';
  return true;
}

// ---- boot ----------------------------------------------------------------

async function boot() {
  buildPickers();
  bindTextInputs();
  bindCanvas();
  bindUpload();
  $('#exportBtn').addEventListener('click', exportPng);
  $('#surpriseBtn').addEventListener('click', surprise);
  $('#undoBtn').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    applySnapshot(undoStack.pop());
  });
  $('#redoBtn').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    applySnapshot(redoStack.pop());
  });
  images = await loadImages(PHOTOS.map((p) => p.id));
  const isShot = await shotMode();
  if (!isShot) {
    syncControls();
    draw();
  }
  refreshUndoButtons();
}

boot();
