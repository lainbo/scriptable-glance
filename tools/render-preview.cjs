const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');

class Element {
  constructor(type = 'stack') { this.type = type; this.children = []; this.direction = 'row'; }
  addStack() { const n = new Element(); this.children.push(n); return n; }
  addText(text) { const n = new Element('text'); n.text = text; this.children.push(n); return n; }
  addImage(image) { const n = new Element('image'); n.image = image; this.children.push(n); return n; }
  addSpacer(length) { const n = new Element('spacer'); if (length != null) n.length = length; this.children.push(n); return n; }
  setPadding(...padding) { this.padding = padding; }
  layoutHorizontally() { this.direction = 'row'; }
  layoutVertically() { this.direction = 'column'; }
  centerAlignContent() { this.alignItems = 'center'; }
  bottomAlignContent() { this.alignItems = 'end'; }
  leftAlignText() { this.textAlign = 'left'; }
  async presentSmall() { this.previewPresented = true; }
}
class ListWidget extends Element { constructor() { super('widget'); this.direction = 'column'; } }
class Color {
  constructor(hex, alpha = 1) { this.hex = hex; this.alpha = alpha; }
  get red() { return parseInt(this.hex.replace('#', '').slice(0, 2), 16) / 255; }
  static dynamic(light, dark) { return { light, dark }; }
}
class DrawContext {
  constructor() { this.operations = []; }
  setFillColor(color) { this.fillColor = color; }
  fillRect(rect) { this.operations.push({ type: 'fill', rect, color: this.fillColor }); }
  addPath(path) { this.path = path; }
  fillPath() { this.operations.push({ type: 'path', path: this.path, color: this.fillColor }); }
  getImage() { return { size: this.size, operations: this.operations }; }
}
class Path {
  constructor() { this.d = ''; }
  move(p) { this.d += `M${p.x} ${p.y}`; }
  addLine(p) { this.d += `L${p.x} ${p.y}`; }
  addCurve(p, c1, c2) { this.d += `C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p.x} ${p.y}`; }
  closeSubpath() { this.d += 'Z'; }
  addRoundedRect(rect, cornerWidth) { this.rect = rect; this.radius = cornerWidth; }
}
const fonts = {};
for (const weight of ['regular', 'medium', 'semibold', 'bold']) {
  fonts[`${weight}SystemFont`] = size => ({ size, weight });
}
fonts.semiboldMonospacedSystemFont = size => ({ size, weight: 'semibold', family: 'Menlo' });

function environment(extra = {}) {
  const appearance = extra.appearance || { dark: false };
  class AppearanceColor extends Color {
    static dynamic(light, dark) { return { light, dark, get red() { return (appearance.dark ? dark : light).red; } }; }
  }
  return { ListWidget, Color: AppearanceColor, DrawContext, Path, Font: fonts,
    Device: { screenSize: () => ({ width: 402, height: 874 }) },
    Size: class { constructor(width, height) { Object.assign(this, { width, height }); } },
    Point: class { constructor(x, y) { Object.assign(this, { x, y }); } },
    Rect: class { constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); } },
    URLScheme: { forRunningScript: () => 'scriptable:///run/ChatGPT%20Usage' },
    config: { runsInApp: false }, console, ...extra };
}
function drawingSVG(image) {
  const shapes = image.operations.map(op => {
    const fill = `fill="${op.color.hex}" fill-opacity="${op.color.alpha}"`;
    const rect = op.type === 'path' ? op.path.rect : op.rect;
    if (!rect) return `<path d="${op.path.d}" ${fill}/>`;
    const radius = op.type === 'path' ? ` rx="${op.path.radius}"` : '';
    return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"${radius} ${fill}/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${image.size.width}" height="${image.size.height}" viewBox="0 0 ${image.size.width} ${image.size.height}">${shapes}</svg>`;
}
function drawingURL(image) {
  return 'data:image/svg+xml;base64,' + Buffer.from(drawingSVG(image)).toString('base64');
}
function cssColor(c) {
  if (c.light) return { light: cssColor(c.light), dark: cssColor(c.dark) };
  return c.alpha === 1 ? c.hex : c.hex + Math.round(c.alpha * 255).toString(16).padStart(2, '0');
}
function tree(n) {
  const out = { type: n.type };
  if (n.type === 'text') Object.assign(out, { text: n.text, font: n.font, textColor: cssColor(n.textColor) });
  if (n.type === 'image') Object.assign(out, { src: drawingURL(n.image), fit: true });
  if (n.type === 'spacer' && n.length != null) out.length = n.length;
  if (n.type === 'widget' || n.type === 'stack') Object.assign(out, {
    direction: n.direction, alignItems: n.alignItems || 'start', gap: n.spacing || 0,
    children: n.children.map(tree), ...(n.padding ? { padding: n.padding } : {}),
  });
  if (n.size?.width) out.width = n.size.width;
  if (n.size?.height) out.height = n.size.height;
  if (n.cornerRadius != null) out.borderRadius = n.cornerRadius;
  if (n.backgroundColor) out.backgroundColor = cssColor(n.backgroundColor);
  if (n.backgroundImage) out.backgroundSVG = drawingSVG(n.backgroundImage);
  return out;
}

function chatgptCases(now) {
  const week = { planType: 'prolite', windows: [{ usedPercent: 95, duration: 604800, resetsAt: now + 74940000 }], fetchedAt: now };
  const dual = { planType: 'plus', windows: [{ usedPercent: 94.9, duration: 18000, resetsAt: now + 7980000 },
    { usedPercent: 95, duration: 604800, resetsAt: now + 262800000 }], fetchedAt: now };
  return [
    ['仅 Weekly · 95%', 'light', { cache: week }],
    ['双周期 · 94.9% / 95%', 'light', { cache: dual }],
    ['深色模式 · 95%', 'dark', { cache: week }],
    ['双周期深色 · 94.9% / 95%', 'dark', { cache: dual }],
    ['登录已过期', 'dark', { cache: { ...dual, fetchedAt: now - 86400000 }, error: { kind: 'expired' } }],
    ['网络异常保留原时间', 'light', { cache: { ...week, fetchedAt: now - 7200000 }, error: { kind: 'network' } }],
    ['首次登录 · 点按打开授权流程', 'light', { cache: null, needsLogin: true }],
    ['授权待完成', 'dark', { cache: null, pending: { userCode: 'ABCD-EFGHJ', expiresAt: now + 900000 } }],
  ];
}

function claudeCases(now) {
  const pro = { planType: 'claude_pro', rateLimitTier: 'default_claude_ai', fetchedAt: now,
    windows: [{ usedPercent: 21, duration: 18000, resetsAt: now + 8940000 },
      { usedPercent: 6, duration: 604800, resetsAt: now + 330000000 }] };
  const max = { planType: 'claude_max', rateLimitTier: 'default_claude_max_20x', fetchedAt: now,
    windows: [{ usedPercent: 94.9, duration: 18000, resetsAt: now + 7980000 },
      { usedPercent: 95, duration: 604800, resetsAt: now + 262800000 }] };
  const idle = { planType: 'claude_max', rateLimitTier: 'default_claude_max_5x', fetchedAt: now,
    windows: [{ usedPercent: 0, duration: 18000, resetsAt: null },
      { usedPercent: 42, duration: 604800, resetsAt: now + 74940000 }] };
  return [
    ['Pro · 21% / 6%', 'light', { cache: pro }],
    ['Max 20x · 94.9% / 95%', 'light', { cache: max }],
    ['深色模式 · Pro', 'dark', { cache: pro }],
    ['深色模式 · 94.9% / 95%', 'dark', { cache: max }],
    ['5h 尚未开始计时 · Max 5x', 'light', { cache: idle }],
    ['登录已过期', 'dark', { cache: { ...max, fetchedAt: now - 86400000 }, error: { kind: 'expired' } }],
    ['网络异常保留原时间', 'light', { cache: { ...pro, fetchedAt: now - 7200000 }, error: { kind: 'network' } }],
    ['首次登录 · 点按打开授权流程', 'light', { cache: null, needsLogin: true }],
  ];
}

function buildPreview(service, title, logoNote, samples) {
  const source = fs.readFileSync(path.join(root, `widgets/${service}/${title} Usage.js`), 'utf8').replace(/await main\(\);\s*$/, '');
  const appearance = { dark: false };
  const context = vm.createContext(environment({
    appearance,
    URLScheme: { forRunningScript: () => `scriptable:///run/${title}%20Usage` },
  }));
  vm.runInContext(source, context);
  const now = Date.parse('2026-09-18T19:20:00+08:00');
  const cases = samples(now).map(([label, theme, state]) => {
    appearance.dark = theme === 'dark';
    context.input = state; context.now = now;
    return { label, theme, widget: tree(vm.runInContext('renderWidget(input, now)', context)) };
  });
  const data = JSON.stringify(cases, null, 2).replace(/</g, '\\u003c');
  const html = fs.readFileSync(path.join(root, 'tools/preview-template.html'), 'utf8')
    .replaceAll('{{SERVICE}}', title).replaceAll('{{LOGO_NOTE}}', logoNote)
    .replace('{{CASES}}', () => data);
  fs.mkdirSync(path.join(root, 'previews'), { recursive: true });
  fs.writeFileSync(path.join(root, `previews/${service}.html`), html);
  console.log(`Rendered ${cases.length} ${title} layout states to browser preview.`);
}

module.exports = { environment, tree };
if (require.main === module) {
  buildPreview('chatgpt', 'ChatGPT', '浅色黑、深色白', chatgptCases);
  buildPreview('claude', 'Claude', '两种主题都使用官方 Clay 色', claudeCases);
}
