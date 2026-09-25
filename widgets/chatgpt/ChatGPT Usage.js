// Scriptable：ChatGPT / Codex 订阅额度，2×2 小组件。
// 可选：填写反向代理上对应的完整地址（含路径）后，接口请求经代理转发；留空则直连官方接口。
const PROXY_AUTH_URL = '';     // 代替 https://auth.openai.com
const PROXY_CHATGPT_URL = '';  // 代替 https://chatgpt.com/backend-api
// Logo 尺寸与右、下偏移均以组件边长为基准；负偏移会超出边缘。
const LOGO_OPACITY = 0.03;
const LOGO_RATIO = 0.85;
const LOGO_OFFSET = -0.11;
const BACKGROUND_LIGHT = '#FFFFFF';
const BACKGROUND_DARK = '#14211B';
const PADDING_VERTICAL = 12;
const PADDING_HORIZONTAL = 14;

const AUTH_ORIGIN = 'https://auth.openai.com';
const DEVICE_PAGE = `${AUTH_ORIGIN}/codex/device`;
// 授权网页和 redirect_uri 始终使用官方地址，只有接口请求改走代理。
const AUTH_API = (PROXY_AUTH_URL || AUTH_ORIGIN).replace(/\/+$/, '');
const USAGE_URL = `${(PROXY_CHATGPT_URL || 'https://chatgpt.com/backend-api').replace(/\/+$/, '')}/wham/usage`;
const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const KEYS = {
  auth: 'chatgpt.usage.v1.auth',
  device: 'chatgpt.usage.v1.device',
  cache: 'chatgpt.usage.v1.cache',
  status: 'chatgpt.usage.v1.status',
  expired: 'chatgpt.usage.v1.expired',
};
const MINUTE = 60_000;
const REFRESH_INTERVAL = 15 * MINUTE;
const PROGRESS_SEGMENTS = 20;
const PROGRESS_GAP = 2;
const PROGRESS_RADIUS = 1.5;
const COLOR = {
  text: { light: '#16251F', dark: '#F1F5F2' },
  muted: { light: '#637269', dark: '#A2B3A9' },
  faint: { light: '#7F8C84', dark: '#91A198' },
  blue: { light: '#3A83F7', dark: '#75A7FF' },
  green: { light: '#168563', dark: '#57CDA6' },
  amber: { light: '#A1660C', dark: '#EDBB67' },
  orange: { light: '#DC6F0C', dark: '#FFA94D' },
  red: { light: '#B3443C', dark: '#FF9C90' },
};
// OpenAI Blossom 官方 SVG 路径（https://openai.com/brand/），原画布 716×716，图形边界为 180.5 至 535.17。
const LOGO_PATH = 'M508.749 317.399C516.777 287.314 508.991 253.884 485.389 230.282C461.788 206.681 428.36 198.895 398.273 206.923C376.231 184.928 343.39 174.956 311.148 183.596C278.906 192.234 255.45 217.292 247.36 247.361C217.291 255.451 192.233 278.91 183.595 311.149C174.957 343.391 184.927 376.232 206.924 398.274C198.896 428.359 206.683 461.789 230.284 485.391C253.885 508.992 287.313 516.779 317.401 508.75C339.442 530.745 372.286 540.717 404.525 532.079C436.767 523.441 460.223 498.384 468.313 468.315C498.383 460.224 523.44 436.766 532.078 404.526C540.716 372.285 530.747 339.443 508.749 317.402V317.399ZM470.899 244.776C486.892 260.77 493.488 282.601 490.687 303.412L415.577 260.046C412.411 258.218 408.509 258.218 405.345 260.046L317.401 310.82V277.526C317.401 275.191 318.652 273.005 320.676 271.837L387.644 233.174C414.178 218.353 448.346 222.223 470.901 244.776H470.899ZM357.837 311.144L398.275 334.491V381.185L357.837 404.532L317.398 381.185V334.491L357.837 311.144ZM264.776 269.693C265.207 239.305 285.644 211.649 316.453 203.393C338.3 197.54 360.505 202.744 377.127 215.573L302.014 258.937C298.848 260.764 296.898 264.144 296.898 267.798V369.346L268.065 352.699C266.043 351.531 264.776 349.353 264.776 347.017V269.691V269.693ZM203.391 316.454C209.244 294.608 224.854 277.978 244.276 269.999V356.73C244.276 360.384 246.226 363.763 249.392 365.591L337.337 416.365L308.503 433.013C306.481 434.181 303.961 434.188 301.939 433.02L234.971 394.357C208.868 378.789 195.138 347.261 203.391 316.454ZM244.775 470.9C228.781 454.906 222.186 433.075 224.986 412.264L300.096 455.63C303.263 457.457 307.164 457.457 310.328 455.63L398.273 404.856V438.149C398.273 440.485 397.022 442.671 394.997 443.839L328.029 482.502C301.495 497.322 267.327 493.452 244.772 470.9H244.775ZM450.897 445.982C450.466 476.371 430.029 504.027 399.22 512.283C377.373 518.136 355.168 512.932 338.547 500.102L413.659 456.738C416.826 454.911 418.775 451.532 418.775 447.877V346.329L447.609 362.977C449.631 364.145 450.897 366.323 450.897 368.659V445.985V445.982ZM512.282 399.221C506.429 421.068 490.819 437.697 471.397 445.676V358.946C471.397 355.292 469.448 351.912 466.281 350.085L378.336 299.311L407.17 282.663C409.192 281.495 411.712 281.487 413.734 282.655L480.702 321.318C506.805 336.887 520.536 368.415 512.282 399.221Z';
const LOGO_BOUNDS = { origin: 180.5, size: 354.67 };

function readJSON(key) {
  if (!Keychain.contains(key)) return null;
  const value = Keychain.get(key);
  try {
    return JSON.parse(value);
  } catch {
    // JSON 解析异常可能包含原文；凭据只报告键名，不输出存储内容。
    throw new Error(`钥匙串数据格式无效：${key.split('.').pop()}`);
  }
}

function writeJSON(key, value) {
  Keychain.set(key, JSON.stringify(value));
}

function remove(key) {
  if (Keychain.contains(key)) Keychain.remove(key);
}

function usageError(kind, stage, status = 0) {
  return Object.assign(new Error(kind), { name: 'UsageError', kind, stage, status });
}

function runtimeError(caught, stage) {
  const message = String(caught?.message || caught)
    .replace(/Bearer\s+\S+/gi, 'Bearer [已隐藏]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g, '[令牌已隐藏]')
    .replace(/((?:access_token|refresh_token|id_token|accessToken|refreshToken)["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi, '$1[已隐藏]');
  const line = caught?.line || caught?.lineNumber;
  return Object.assign(usageError('script', stage), {
    detail: `${caught?.name || 'Error'}: ${message.slice(0, 400)}${line ? `\n引擎行号：${line}` : ''}`,
  });
}

async function request(method, url, stage, body, headers = {}) {
  let req;
  try {
    req = new Request(url);
    req.method = method.toUpperCase();
    req.headers = { Accept: 'application/json', 'User-Agent': 'Scriptable-ChatGPT-Usage/1.0',
      'Cache-Control': 'no-cache', ...headers };
    if (body !== undefined) req.body = typeof body === 'string' ? body : JSON.stringify(body);
    req.timeoutInterval = 10;
    req.onRedirect = () => null;
  } catch (caught) {
    throw runtimeError(caught, `${stage}.request_setup`);
  }
  let raw;
  try {
    raw = await req.loadString();
  } catch {
    if (req.response?.statusCode >= 400) return { status: req.response.statusCode, data: null };
    throw usageError('network', stage);
  }
  if (!req.response || !Number.isFinite(req.response.statusCode)) {
    throw usageError('format', `${stage}.response`);
  }
  const status = req.response.statusCode;
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    if (status >= 200 && status < 300) throw usageError('format', stage, status);
  }
  return { status, data };
}

function requireSuccess(response, stage) {
  if (response.status >= 200 && response.status < 300) return;
  const kind = response.status === 403 ? 'forbidden'
    : response.status === 429 ? 'throttled'
      : response.status >= 500 ? 'server' : 'http';
  throw usageError(kind, stage, response.status);
}

function jwtClaims(token) {
  if (!token) return {};
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bits = 0;
    let value = 0;
    let escaped = '';
    for (const char of part.replace(/=+$/, '')) {
      const index = alphabet.indexOf(char);
      if (index < 0) return {};
      value = (value << 6) | index;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        escaped += `%${((value >> bits) & 255).toString(16).padStart(2, '0')}`;
      }
    }
    return JSON.parse(decodeURIComponent(escaped));
  } catch {
    return {};
  }
}

function parseCredentials(data, previous, now) {
  if (!data?.access_token || typeof data.access_token !== 'string') {
    throw usageError('format', 'token');
  }
  const access = jwtClaims(data.access_token);
  const id = jwtClaims(data.id_token);
  const account = id['https://api.openai.com/auth'] || access['https://api.openai.com/auth'] || {};
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || previous.refreshToken || null,
    expiresAt: Number.isFinite(access.exp) ? access.exp * 1000
      : Number.isFinite(data.expires_in) ? now + data.expires_in * 1000 : null,
    accountId: account.chatgpt_account_id || previous.accountId || null,
    planType: account.chatgpt_plan_type || previous.planType || null,
  };
}

async function refreshCredentials(auth) {
  if (!auth.refreshToken) throw usageError('expired', 'refresh');
  const response = await request('post', `${AUTH_API}/oauth/token`, 'refresh', {
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: auth.refreshToken,
  }, { 'Content-Type': 'application/json' });
  const raw = response.data?.error;
  const code = typeof raw === 'string' ? raw : raw?.code || response.data?.code;
  const permanent = ['invalid_grant', 'refresh_token_expired', 'refresh_token_reused', 'refresh_token_invalidated'];
  if (response.status === 401 || (response.status >= 400 && permanent.includes(code))) {
    throw usageError('expired', 'refresh', response.status);
  }
  requireSuccess(response, 'refresh');
  const next = parseCredentials(response.data, auth, Date.now());
  // 更新后的 refresh token 可能替代旧值，取得后立即保存。
  writeJSON(KEYS.auth, next);
  return next;
}

async function deviceLogin() {
  const now = Date.now();
  const pending = readJSON(KEYS.device);
  if (!pending || pending.expiresAt <= now) {
    return startDeviceLogin(now);
  }
  if (now - pending.lastPollAt < pending.interval) return { pending, stage: 'device_poll', status: null };
  return pollDeviceLogin({ ...pending, lastPollAt: now });
}

async function startDeviceLogin(now) {
  const response = await request('post', `${AUTH_API}/api/accounts/deviceauth/usercode`, 'device_start', {
    client_id: CLIENT_ID,
  }, { 'Content-Type': 'application/json' });
  requireSuccess(response, 'device_start');
  const data = response.data;
  const code = data?.user_code || data?.usercode;
  if (!data?.device_auth_id || !code) throw usageError('format', 'device_start');
  const pending = {
    deviceId: data.device_auth_id,
    userCode: code,
    expiresAt: now + 15 * MINUTE,
    interval: Math.max(5, Number(data.interval) || 5) * 1000,
    lastPollAt: now,
  };
  writeJSON(KEYS.device, pending);
  return { pending, stage: 'device_start', status: response.status };
}

async function pollDeviceLogin(pending) {
  writeJSON(KEYS.device, pending);
  const response = await request('post', `${AUTH_API}/api/accounts/deviceauth/token`, 'device_poll', {
    device_auth_id: pending.deviceId,
    user_code: pending.userCode,
  }, { 'Content-Type': 'application/json' });
  // 此端点的 403 / 404 表示尚未完成授权，和用量端点的 403 含义不同。
  if (response.status === 403 || response.status === 404) return { pending, stage: 'device_poll', status: response.status };
  requireSuccess(response, 'device_poll');
  const grant = response.data;
  if (!grant?.authorization_code || !grant?.code_verifier) {
    throw usageError('format', 'device_poll');
  }
  const form = {
    grant_type: 'authorization_code',
    code: grant.authorization_code,
    redirect_uri: `${AUTH_ORIGIN}/deviceauth/callback`,
    client_id: CLIENT_ID,
    code_verifier: grant.code_verifier,
  };
  const exchange = await request('post', `${AUTH_API}/oauth/token`, 'device_exchange',
    Object.entries(form).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&'),
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  if (exchange.status === 400 || exchange.status === 401) {
    remove(KEYS.device);
    throw usageError('login_retry', 'device_exchange', exchange.status);
  }
  requireSuccess(exchange, 'device_exchange');
  const auth = parseCredentials(exchange.data, {}, Date.now());
  writeJSON(KEYS.auth, auth);
  remove(KEYS.device);
  remove(KEYS.expired);
  const cached = readJSON(KEYS.cache);
  if (cached && cached.accountId !== auth.accountId) remove(KEYS.cache);
  return { auth };
}

function requestUsage(auth) {
  return request('get', USAGE_URL, 'usage', undefined, {
    Authorization: `Bearer ${auth.accessToken}`,
    ...(auth.accountId ? { 'ChatGPT-Account-Id': auth.accountId } : {}),
  });
}

async function fetchUsage(storedAuth) {
  const refreshed = Boolean(storedAuth.expiresAt && storedAuth.expiresAt <= Date.now() + MINUTE);
  const auth = refreshed ? await refreshCredentials(storedAuth) : storedAuth;
  const response = await requestUsage(auth);
  if (response.status === 401 && !refreshed) {
    const next = await refreshCredentials(auth);
    return parseUsage(await requestUsage(next), next, Date.now());
  }
  return parseUsage(response, auth, Date.now());
}

function parseUsage(response, auth, now) {
  if (response.status === 401) throw usageError('expired', 'usage', 401);
  requireSuccess(response, 'usage');
  const data = response.data;
  if (!data || typeof data !== 'object' || !Object.hasOwn(data, 'rate_limit')) {
    throw usageError('format', 'usage', response.status);
  }
  const windows = [data.rate_limit?.primary_window, data.rate_limit?.secondary_window]
    .filter(window => window != null)
    .map(window => {
      if (!Number.isFinite(window.used_percent) || !Number.isFinite(window.limit_window_seconds)
        || window.limit_window_seconds <= 0 || !Number.isFinite(window.reset_at)) {
        throw usageError('format', 'usage', response.status);
      }
      return {
        usedPercent: Math.max(0, Math.min(100, window.used_percent)),
        duration: window.limit_window_seconds,
        resetsAt: window.reset_at * 1000,
      };
    }).sort((a, b) => a.duration - b.duration);
  return {
    accountId: auth.accountId,
    planType: data.plan_type || auth.planType,
    windows,
    fetchedAt: now,
  };
}

function taipeiParts(ms) {
  const date = new Date(ms + 8 * 60 * MINUTE);
  const pad = value => String(value).padStart(2, '0');
  return { day: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    date: `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}`,
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}` };
}

function resetText(ms, now) {
  const delta = ms - now;
  if (delta <= 0) return '重置待确认';
  if (delta < 24 * 60 * MINUTE) {
    const minutes = Math.ceil(delta / MINUTE);
    return `重置 ${Math.floor(minutes / 60)}小时${String(minutes % 60).padStart(2, '0')}分`;
  }
  const parts = taipeiParts(ms);
  return `重置 ${parts.date} ${parts.time}`;
}

function updateText(cache, now) {
  if (!cache?.fetchedAt) return '尚无成功更新';
  const parts = taipeiParts(cache.fetchedAt);
  return `更新 ${parts.day === taipeiParts(now).day ? '' : `${parts.date} `}${parts.time}`;
}

function periodName(seconds) {
  if (seconds === 604800) return 'Weekly';
  if (seconds === 86400) return '24h';
  if (seconds % 86400 === 0) return `${seconds / 86400} 天`;
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  return `${Math.round(seconds / 60)} 分钟`;
}

function planName(plan) {
  return { prolite: 'Pro 5x', pro: 'Pro', plus: 'Plus', free: 'Free',
    business: 'Business', team: 'Business', enterprise: 'Enterprise', edu: 'Edu' }[plan] || '';
}

function adaptive(color, alpha = 1) {
  return Color.dynamic(new Color(color.light, alpha), new Color(color.dark, alpha));
}

function addText(parent, value, size, color = COLOR.text, weight = 'regular') {
  const item = parent.addText(value);
  item.font = Font[`${weight}SystemFont`](size);
  item.textColor = adaptive(color);
  item.lineLimit = 1;
  item.minimumScaleFactor = 0.85;
  item.leftAlignText();
  return item;
}

function row(parent) {
  const stack = parent.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  stack.spacing = 0;
  stack.setPadding(0, 0, 0, 0);
  return stack;
}

function errorLabel(error) {
  const labels = { expired: '登录已过期', network: '网络异常', forbidden: '访问受限',
    throttled: '请求过于频繁', server: '服务暂不可用', format: '响应格式异常',
    http: '请求失败', login_retry: '请重新发起登录', script: '脚本运行异常' };
  return `${labels[error.kind] || '更新失败'}${error.status && error.kind !== 'expired' ? ` · ${error.status}` : ''}`;
}

function statusLabel(state) {
  if (state.pending) return { text: '等待授权', color: COLOR.muted };
  if (state.needsLogin) {
    return state.expired ? { text: '登录已过期', color: COLOR.red } : { text: '未登录', color: COLOR.muted };
  }
  if (state.error) {
    return { text: errorLabel(state.error), color: state.error.kind === 'expired' ? COLOR.red : COLOR.amber };
  }
  return null;
}

function addHeader(widget, state) {
  const title = row(widget);
  addText(title, 'ChatGPT', 18, COLOR.text, 'bold');
  title.addSpacer();
  const plan = planName(state.cache?.planType);
  if (plan) addText(title, plan, 10, COLOR.muted, 'medium');
}

function addFooter(widget, state, now) {
  const footer = row(widget);
  addText(footer, updateText(state.cache, now), 9, COLOR.faint);
  footer.addSpacer();
  const status = statusLabel(state);
  if (status) addText(footer, status.text, 9, status.color, 'medium');
}

function darkTheme() {
  // 动态颜色可在组件中解析当前主题；背景位图在本次运行时生成。
  return Color.dynamic(new Color('#FFFFFF'), new Color('#000000')).red < 0.5;
}

function contentWidth() {
  // 组件宽度：iPhone 17 Pro 实测 158 点；Pro Max 按苹果尺寸表中 430 点宽屏幕的 170 点估算。
  const screen = Device.screenSize();
  return (Math.min(screen.width, screen.height) >= 430 ? 170 : 158) - PADDING_HORIZONTAL * 2;
}

function addProgress(widget, percent, stale, color, height) {
  // 各格用固定尺寸的原生圆角容器绘制，按屏幕分辨率矢量渲染；格间距用容器间距，不用弹性留白（iOS 上最小约 8 点，会撑破组件）。
  const filled = Math.ceil(Math.min(Math.max(percent, 0), 100) / 100 * PROGRESS_SEGMENTS);
  const segment = (contentWidth() - (PROGRESS_SEGMENTS - 1) * PROGRESS_GAP) / PROGRESS_SEGMENTS;
  const bar = row(widget);
  bar.spacing = PROGRESS_GAP;
  for (let index = 0; index < PROGRESS_SEGMENTS; index++) {
    const cell = bar.addStack();
    cell.size = new Size(segment, height);
    cell.cornerRadius = PROGRESS_RADIUS;
    cell.backgroundColor = adaptive(color, index < filled ? (stale ? 0.55 : 1) : (stale ? 0.06 : 0.12));
  }
}

function addWindow(widget, window, compact, now, stale) {
  const color = window.usedPercent >= 95 ? COLOR.orange : COLOR.blue;
  const line = row(widget);
  line.bottomAlignContent();
  // 名称下方留出大号数字的下沉距离，让两者底边看起来对齐。
  const label = row(line);
  label.setPadding(0, 0, compact ? 1 : 4, 0);
  addText(label, periodName(window.duration), compact ? 10 : 11, COLOR.muted, 'medium');
  line.addSpacer();
  addText(line, `${Number(window.usedPercent.toFixed(1))}%`, compact ? 15 : 28, color, 'semibold');
  widget.addSpacer(compact ? 1 : 4);
  addProgress(widget, window.usedPercent, stale, color, compact ? 6 : 20);
  widget.addSpacer(compact ? 1 : 5);
  addText(widget, resetText(window.resetsAt, now), compact ? 9 : 10, COLOR.muted);
}

function nextRefreshAt(state, now) {
  const boundaries = (state.cache?.windows || [])
    .flatMap(window => [window.resetsAt - 24 * 60 * MINUTE, window.resetsAt])
    .filter(boundary => boundary > now)
    .map(boundary => boundary + 1000);
  return Math.min(now + (state.pending ? MINUTE : REFRESH_INTERVAL), ...boundaries);
}

function logoPath(origin, side) {
  const scale = side / LOGO_BOUNDS.size;
  const point = (x, y) => new Point(origin + (x - LOGO_BOUNDS.origin) * scale, origin + (y - LOGO_BOUNDS.origin) * scale);
  const path = new Path();
  let x = 0;
  let y = 0;
  for (const [, command, args] of LOGO_PATH.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g)) {
    const n = args.trim().split(/\s+/).map(Number);
    if (command === 'M') path.move(point(x = n[0], y = n[1]));
    if (command === 'L') path.addLine(point(x = n[0], y = n[1]));
    if (command === 'H') path.addLine(point(x = n[0], y));
    if (command === 'V') path.addLine(point(x, y = n[0]));
    if (command === 'C') path.addCurve(point(x = n[4], y = n[5]), point(n[0], n[1]), point(n[2], n[3]));
    if (command === 'Z') path.closeSubpath();
  }
  return path;
}

function widgetBackground() {
  const dark = darkTheme();
  const canvas = new DrawContext();
  const edge = 512;
  canvas.size = new Size(edge, edge);
  canvas.respectScreenScale = false;
  canvas.opaque = true;
  canvas.setFillColor(new Color(dark ? BACKGROUND_DARK : BACKGROUND_LIGHT));
  canvas.fillRect(new Rect(0, 0, edge, edge));
  const side = edge * LOGO_RATIO;
  canvas.addPath(logoPath(edge - side - edge * LOGO_OFFSET, side));
  canvas.setFillColor(new Color(dark ? '#FFFFFF' : '#000000', LOGO_OPACITY));
  canvas.fillPath();
  return canvas.getImage();
}

function renderWidget(state, now = Date.now()) {
  const widget = new ListWidget();
  widget.setPadding(PADDING_VERTICAL, PADDING_HORIZONTAL, PADDING_VERTICAL, PADDING_HORIZONTAL);
  widget.spacing = 0;
  widget.backgroundImage = widgetBackground();
  widget.url = URLScheme.forRunningScript();
  addHeader(widget, state);
  widget.addSpacer();
  const windows = state.cache?.windows || [];
  if (state.pending) {
    const code = addText(widget, state.pending.userCode, 18, COLOR.text, 'semibold');
    code.font = Font.semiboldMonospacedSystemFont(18);
    widget.addSpacer(3);
    addText(widget, `有效至 ${taipeiParts(state.pending.expiresAt).time}`, 9, COLOR.muted);
    addText(widget, '点按继续登录', 9, COLOR.muted);
  } else if (windows.length) {
    windows.forEach((window, index) => {
      if (index) widget.addSpacer(3);
      addWindow(widget, window, windows.length > 1, now, Boolean(state.error || state.needsLogin));
    });
  } else {
    addText(widget, state.needsLogin ? '点按登录 ChatGPT'
      : state.error ? '暂时无法获取额度' : '未返回限额窗口', 12, COLOR.muted);
  }
  widget.addSpacer();
  addFooter(widget, state, now);
  // 前台运行后申请尽早刷新；实际桌面更新仍由 iOS 调度。
  widget.refreshAfterDate = new Date(config.runsInApp ? now : nextRefreshAt(state, now));
  return widget;
}

async function loadState() {
  let cache = null;
  let stage = 'storage.read_cache';
  try {
    cache = readJSON(KEYS.cache);
    stage = 'storage.read_auth';
    let auth = readJSON(KEYS.auth);
    if (!auth) {
      stage = 'storage.read_login';
      const expired = Boolean(readJSON(KEYS.expired));
      const pending = readJSON(KEYS.device);
      // 设备码只由前台登录发起，后台仅查询尚在有效期内的授权。
      if (!config.runsInApp && (!pending || pending.expiresAt <= Date.now())) {
        return { cache, needsLogin: true, expired };
      }
      stage = 'device_login';
      const login = await deviceLogin();
      if (login.pending) {
        stage = 'storage.save_login_status';
        writeJSON(KEYS.status, { checkedAt: Date.now(), stage: login.stage,
          kind: 'awaiting_login', httpStatus: login.status });
        return { cache, pending: login.pending, expired };
      }
      auth = login.auth;
      cache = readJSON(KEYS.cache);
    }
    stage = 'usage';
    const fresh = await fetchUsage(auth);
    // 只有成功获取并保存用量才推进底部的更新时间。
    stage = 'storage.save_cache';
    writeJSON(KEYS.cache, fresh);
    cache = fresh;
    stage = 'storage.save_usage_status';
    writeJSON(KEYS.status, { checkedAt: Date.now(), stage: 'usage', kind: 'ok', httpStatus: 200 });
    return { cache };
  } catch (caught) {
    const error = caught?.name === 'UsageError' ? caught : runtimeError(caught, stage);
    try {
      if (error.kind === 'expired') {
        remove(KEYS.auth);
        writeJSON(KEYS.expired, true);
      }
      writeJSON(KEYS.status, { checkedAt: Date.now(), stage: error.stage,
        kind: error.kind, httpStatus: error.status || null,
        ...(error.detail ? { detail: error.detail } : {}) });
    } catch {
      // 钥匙串不可用时仍显示错误卡片。
    }
    return { cache, error };
  }
}

async function presentLogin(state) {
  const dialog = new Alert();
  dialog.title = state.expired ? '重新登录 ChatGPT' : '登录 ChatGPT';
  dialog.message = `设备码：${state.pending.userCode}\n有效至 ${taipeiParts(state.pending.expiresAt).time}\n\n下一步会复制设备码并打开官方授权页。完成授权后，点击浏览器的“完成”回到脚本。`;
  dialog.addAction('复制设备码并打开授权页');
  dialog.addCancelAction('稍后登录');
  if (await dialog.presentAlert() < 0) return state;
  Pasteboard.copyString(state.pending.userCode);
  await Safari.openInApp(DEVICE_PAGE, true);
  const wait = state.pending.interval - (Date.now() - state.pending.lastPollAt);
  if (wait > 0 && wait <= 10_000) {
    await new Promise(resolve => Timer.schedule(wait, false, resolve));
  }
  return await loadState();
}

async function main() {
  let state = await loadState();
  if (config.runsInApp) {
    if (state.error?.kind === 'expired') state = await loadState();
    if (state.pending) state = await presentLogin(state);
    const error = state.error;
    const status = error ? `${errorLabel(error)}（${error.stage}）`
      : state.pending ? '等待登录授权' : state.needsLogin ? '需要登录' : '用量已更新';
    console.log(`${status}；${updateText(state.cache, Date.now())}（GMT+8）`);
    if (error?.detail) {
      console.log(`阶段：${error.stage}\n${error.detail}`);
      const dialog = new Alert();
      dialog.title = '脚本运行异常';
      dialog.message = `阶段：${error.stage}\n\n${error.detail}`;
      dialog.addAction('复制错误信息');
      dialog.addCancelAction('关闭');
      if (await dialog.presentAlert() === 0) Pasteboard.copyString(dialog.message);
    }
  }
  const widget = renderWidget(state);
  Script.setWidget(widget);
  if (config.runsInApp) await widget.presentSmall();
  Script.complete();
}

await main();
