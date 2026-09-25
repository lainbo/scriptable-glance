// Scriptable：Claude 订阅额度，2×2 小组件。
// 可选：填写反向代理上对应的完整地址（含路径）后，接口请求经代理转发；留空则直连官方接口。
const PROXY_ANTHROPIC_URL = '';  // 代替 https://api.anthropic.com
// Logo 尺寸与右、下偏移均以组件边长为基准；负偏移会超出边缘。
const LOGO_OPACITY_LIGHT = 0.04;
const LOGO_OPACITY_DARK = 0.075;
const LOGO_COLOR = '#D97757';
const LOGO_RATIO = 0.85;
const LOGO_OFFSET = -0.11;
const BACKGROUND_LIGHT = '#FFFFFF';
const BACKGROUND_DARK = '#14211B';
const PADDING_VERTICAL = 12;
const PADDING_HORIZONTAL = 14;

// Claude Code 的公开 OAuth 客户端，仅申请读取账号资料与用量的 user:profile 权限。
const AUTHORIZE_URL = 'https://claude.com/cai/oauth/authorize';
const REDIRECT_URI = 'https://platform.claude.com/oauth/code/callback';
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const SCOPE = 'user:profile';
const OAUTH_BETA = 'oauth-2025-04-20';
// 授权网页和 redirect_uri 始终使用官方地址，只有接口请求改走代理。
const API_BASE = (PROXY_ANTHROPIC_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
// 直连时令牌请求与 Claude Code 一致；设置代理后改用 api.anthropic.com 的同一路径（返回一致），只需代理这一个地址。
const TOKEN_URL = PROXY_ANTHROPIC_URL ? `${API_BASE}/v1/oauth/token` : 'https://platform.claude.com/v1/oauth/token';
const USAGE_URL = `${API_BASE}/api/oauth/usage`;
const PROFILE_URL = `${API_BASE}/api/oauth/profile`;
const KEYS = {
  auth: 'claude.usage.v1.auth',
  login: 'claude.usage.v1.login',
  cache: 'claude.usage.v1.cache',
  status: 'claude.usage.v1.status',
  expired: 'claude.usage.v1.expired',
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
  amber: { light: '#A1660C', dark: '#EDBB67' },
  orange: { light: '#DC6F0C', dark: '#FFA94D' },
  red: { light: '#B3443C', dark: '#FF9C90' },
};
// Claude Spark 官方 SVG 路径（Anthropic 媒体资源包 https://www.anthropic.com/press-kit），原画布 94×94，图形边界自 (0.3999, 0.2002) 起，边长 93.6。
const LOGO_PATH = 'M18.7657 62.4437L37.1822 52.1167L37.4857 51.2122L37.1822 50.7085H36.2715L33.1852 50.5208L22.6615 50.2391L13.5545 49.8636L4.70044 49.3942L2.47428 48.9248L0.399902 46.1553L0.602281 44.794L2.47428 43.5266L5.15579 43.7613L11.0754 44.1837L19.98 44.794L26.4055 45.1695L35.9679 46.1553H37.4857L37.6881 45.545L37.1822 45.1695L36.7774 44.794L27.5692 38.5508L17.6021 31.9791L12.3908 28.1769L9.60812 26.2524L8.19147 24.4686L7.58433 20.5256L10.1141 17.7091L13.5545 17.9438L14.4146 18.1785L17.9056 20.8542L25.343 26.6279L35.0572 33.7629L36.4739 34.9364L37.0443 34.5514L37.1316 34.2792L36.4739 33.1996L31.212 23.6706L25.596 13.9539L23.0663 9.91695L22.4086 7.52296C22.1538 6.51831 22.0038 5.68714 22.0038 4.65957L24.8877 0.716544L26.5067 0.200195L30.4025 0.716544L32.0215 2.12477L34.4501 7.66379L38.3458 16.3478L44.4172 28.1769L46.188 31.6975L47.1493 34.9364L47.5035 35.9222H48.1106V35.3589L48.6166 28.6933L49.5273 20.5256L50.438 10.0108L50.7415 7.05356L52.2088 3.48605L55.1433 1.56148L57.42 2.64112L59.292 5.31674L59.039 7.05356L57.926 14.2824L55.7504 25.5952L54.3337 33.1996H55.1433L56.1046 32.2138L59.9497 27.1442L66.3752 19.0704L69.2085 15.8784L72.5478 12.3579L74.6728 10.668H78.7203L81.6548 15.0804L80.3394 19.6337L76.1906 24.8911L72.7502 29.3504L67.8172 35.9595L64.7562 41.2734L65.0307 41.7118L65.7681 41.6489L76.8989 39.255L82.9197 38.1753L90.1041 36.9549L93.3422 38.457L93.6963 40.006L92.4315 43.151L84.7411 45.0287L75.7353 46.8594L62.3244 50.0164L62.1759 50.1358L62.3512 50.3958L68.399 50.9432L70.9794 51.084H77.3037L89.0922 51.9759L92.1785 53.9944L93.9999 56.4822L93.6963 58.4068L88.9404 60.8008L82.5655 59.2987L67.6401 55.7312L62.5301 54.4638H61.8217V54.8862L66.0717 59.064L73.9139 66.1051L83.6786 75.2116L84.1845 77.4648L82.9197 79.2485L81.6042 79.0608L73.0032 72.5829L69.6639 69.6726L62.1759 63.3356H61.67V63.9928L63.3902 66.5276L72.5478 80.2812L73.0032 84.5059L72.3454 85.8672L69.9675 86.7121L67.3871 86.2427L61.9735 78.6852L56.4587 70.2359L52.0064 62.6315L51.4687 62.971L48.8189 91.2654L47.6047 92.7206L44.7714 93.8002L42.3934 92.0164L41.1286 89.1061L42.3934 83.3324L43.9113 75.8219L45.1255 69.8604L46.2386 62.4437L46.9184 59.9661L46.8583 59.8003L46.3153 59.8916L40.7238 67.5603L32.2239 79.0608L25.4948 86.2427L23.8758 86.8999L21.0931 85.4447L21.3461 82.863L22.9145 80.5629L32.2239 68.7338L37.8399 61.3641L41.4594 57.1337L41.4242 56.5218L41.2244 56.5048L16.489 72.6299L12.0873 73.1932L10.1647 71.4094L10.4176 68.4991L11.3283 67.5603L18.7657 62.4437Z';
const LOGO_BOUNDS = { x: 0.3999, y: 0.2002, size: 93.6 };
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
const SHA256_H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

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
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, '[令牌已隐藏]')
    .replace(/((?:access_token|refresh_token|code_verifier|accessToken|refreshToken|verifier)["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi, '$1[已隐藏]');
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
    req.headers = { Accept: 'application/json', 'User-Agent': 'Scriptable-Claude-Usage/1.0',
      'Cache-Control': 'no-cache', ...headers };
    if (body !== undefined) req.body = JSON.stringify(body);
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

function sha256(bytes) {
  const rotate = (value, bits) => (value >>> bits | value << (32 - bits)) >>> 0;
  const bitLength = bytes.length * 8;
  const padded = [...bytes, 0x80];
  while (padded.length % 64 !== 56) padded.push(0);
  padded.push(0, 0, 0, 0, bitLength >>> 24, bitLength >>> 16 & 255, bitLength >>> 8 & 255, bitLength & 255);
  let hash = [...SHA256_H];
  const w = [];
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const j = offset + i * 4;
      w[i] = (padded[j] << 24 | padded[j + 1] << 16 | padded[j + 2] << 8 | padded[j + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotate(w[i - 15], 7) ^ rotate(w[i - 15], 18) ^ w[i - 15] >>> 3;
      const s1 = rotate(w[i - 2], 17) ^ rotate(w[i - 2], 19) ^ w[i - 2] >>> 10;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + (e & f ^ ~e & g) + SHA256_K[i] + w[i]) >>> 0;
      const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + (a & b ^ a & c ^ b & c)) >>> 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) >>> 0, c, b, a, (t1 + t2) >>> 0];
    }
    hash = hash.map((value, i) => (value + [a, b, c, d, e, f, g, h][i]) >>> 0);
  }
  return hash.flatMap(value => [value >>> 24, value >>> 16 & 255, value >>> 8 & 255, value & 255]);
}

function base64url(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = bytes[i] << 16 | (bytes[i + 1] ?? 0) << 8 | (bytes[i + 2] ?? 0);
    const length = Math.min(3, bytes.length - i) + 1;
    for (let j = 0; j < length; j++) out += alphabet[chunk >>> (18 - j * 6) & 63];
  }
  return out;
}

function randomToken() {
  // 两个系统 UUID 拼成 32 字节，与 Claude Code 的 verifier、state 长度一致；state 过短会被授权页拒绝。
  const hex = (UUID.string() + UUID.string()).replace(/-/g, '');
  return base64url(hex.match(/../g).map(pair => parseInt(pair, 16)));
}

function authorizeURL(login) {
  const challenge = base64url(sha256([...login.verifier].map(char => char.charCodeAt(0))));
  const params = { code: 'true', client_id: CLIENT_ID, response_type: 'code', redirect_uri: REDIRECT_URI,
    scope: SCOPE, code_challenge: challenge, code_challenge_method: 'S256', state: login.state };
  return `${AUTHORIZE_URL}?${Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
}

function parseCredentials(data, previous, now) {
  if (typeof data?.access_token !== 'string' || !data.access_token) {
    throw usageError('format', 'token');
  }
  return {
    accessToken: data.access_token,
    // 续期响应未返回新 refresh token 时沿用旧值。
    refreshToken: data.refresh_token || previous.refreshToken || null,
    expiresAt: Number.isFinite(data.expires_in) ? now + data.expires_in * 1000 : null,
    accountId: data.account?.uuid || previous.accountId || null,
  };
}

async function completeLogin({ code, state, login }) {
  const response = await request('post', TOKEN_URL, 'login_exchange', {
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: login.verifier,
    state,
  }, { 'Content-Type': 'application/json' });
  if (response.status === 400 || response.status === 401) {
    remove(KEYS.login);
    throw usageError('login_retry', 'login_exchange', response.status);
  }
  requireSuccess(response, 'login_exchange');
  const auth = parseCredentials(response.data, {}, Date.now());
  writeJSON(KEYS.auth, auth);
  remove(KEYS.login);
  remove(KEYS.expired);
  const cached = readJSON(KEYS.cache);
  if (cached && cached.accountId !== auth.accountId) remove(KEYS.cache);
  return auth;
}

async function refreshCredentials(auth) {
  if (!auth.refreshToken) throw usageError('expired', 'refresh');
  const response = await request('post', TOKEN_URL, 'refresh', {
    grant_type: 'refresh_token',
    refresh_token: auth.refreshToken,
    client_id: CLIENT_ID,
    scope: SCOPE,
  }, { 'Content-Type': 'application/json' });
  // 登录满约 30 天后 refresh token 失效，接口返回 invalid_grant。
  if (response.status === 401 || (response.status === 400 && response.data?.error === 'invalid_grant')) {
    throw usageError('expired', 'refresh', response.status);
  }
  requireSuccess(response, 'refresh');
  const next = parseCredentials(response.data, auth, Date.now());
  // 续期会轮换 refresh token，取得后立即保存。
  writeJSON(KEYS.auth, next);
  return next;
}

function requestUsage(auth) {
  const headers = { Authorization: `Bearer ${auth.accessToken}`, 'anthropic-beta': OAUTH_BETA };
  return Promise.all([
    request('get', USAGE_URL, 'usage', undefined, headers),
    request('get', PROFILE_URL, 'profile', undefined, headers),
  ]);
}

async function fetchUsage(storedAuth) {
  const refreshed = Boolean(storedAuth.expiresAt && storedAuth.expiresAt <= Date.now() + MINUTE);
  const auth = refreshed ? await refreshCredentials(storedAuth) : storedAuth;
  const responses = await requestUsage(auth);
  if (!refreshed && responses.some(response => response.status === 401)) {
    const next = await refreshCredentials(auth);
    return parseUsage(await requestUsage(next), next, Date.now());
  }
  return parseUsage(responses, auth, Date.now());
}

function parseUsage([usage, profile], auth, now) {
  for (const [response, stage] of [[usage, 'usage'], [profile, 'profile']]) {
    if (response.status === 401) throw usageError('expired', stage, 401);
    requireSuccess(response, stage);
  }
  const organization = profile.data?.organization;
  if (typeof organization?.organization_type !== 'string') {
    throw usageError('format', 'profile', profile.status);
  }
  const data = usage.data;
  if (!data || typeof data !== 'object' || !('five_hour' in data || 'seven_day' in data)) {
    throw usageError('format', 'usage', usage.status);
  }
  const windows = [[data.five_hour, 18000], [data.seven_day, 604800]]
    .filter(([window]) => window != null)
    .map(([window, duration]) => {
      const resetsAt = window.resets_at == null ? null : Date.parse(window.resets_at);
      if (!Number.isFinite(window.utilization) || Number.isNaN(resetsAt)) {
        throw usageError('format', 'usage', usage.status);
      }
      return { usedPercent: Math.max(0, Math.min(100, window.utilization)), duration, resetsAt };
    });
  return {
    accountId: profile.data.account?.uuid || auth.accountId,
    planType: organization.organization_type,
    rateLimitTier: organization.rate_limit_tier || null,
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
  // 窗口内尚无用量时接口不返回重置时间，计时从下一次使用开始。
  if (ms == null) return '尚未开始计时';
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

function planName(cache) {
  if (cache?.planType === 'claude_max') {
    return { default_claude_max_5x: 'Max 5x', default_claude_max_20x: 'Max 20x' }[cache.rateLimitTier] || 'Max';
  }
  return { claude_pro: 'Pro', claude_team: 'Team', claude_enterprise: 'Enterprise' }[cache?.planType] || '';
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
  addText(title, 'Claude', 18, COLOR.text, 'bold');
  title.addSpacer();
  const plan = planName(state.cache);
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
    .flatMap(window => window.resetsAt ? [window.resetsAt - 24 * 60 * MINUTE, window.resetsAt] : [])
    .filter(boundary => boundary > now)
    .map(boundary => boundary + 1000);
  return Math.min(now + REFRESH_INTERVAL, ...boundaries);
}

function logoPath(originX, originY, side) {
  const scale = side / LOGO_BOUNDS.size;
  const point = (x, y) => new Point(originX + (x - LOGO_BOUNDS.x) * scale, originY + (y - LOGO_BOUNDS.y) * scale);
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
  const origin = edge - side - edge * LOGO_OFFSET;
  canvas.addPath(logoPath(origin, origin, side));
  canvas.setFillColor(new Color(LOGO_COLOR, dark ? LOGO_OPACITY_DARK : LOGO_OPACITY_LIGHT));
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
  if (windows.length) {
    windows.forEach((window, index) => {
      if (index) widget.addSpacer(3);
      addWindow(widget, window, windows.length > 1, now, Boolean(state.error || state.needsLogin));
    });
  } else {
    addText(widget, state.needsLogin ? '点按登录 Claude'
      : state.error ? '暂时无法获取额度' : '未返回限额窗口', 12, COLOR.muted);
  }
  widget.addSpacer();
  addFooter(widget, state, now);
  // 前台运行后申请尽早刷新；实际桌面更新仍由 iOS 调度。
  widget.refreshAfterDate = new Date(config.runsInApp ? now : nextRefreshAt(state, now));
  return widget;
}

async function loadState(authorization) {
  let cache = null;
  let stage = 'storage.read_cache';
  try {
    cache = readJSON(KEYS.cache);
    stage = 'storage.read_auth';
    let auth = readJSON(KEYS.auth);
    if (authorization) {
      stage = 'login_exchange';
      auth = await completeLogin(authorization);
      cache = readJSON(KEYS.cache);
    }
    if (!auth) {
      stage = 'storage.read_login';
      return { cache, needsLogin: true, expired: Boolean(readJSON(KEYS.expired)) };
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

async function openAuthorization() {
  const login = { verifier: randomToken(), state: randomToken() };
  // 先保存本次登录；授权期间脚本若被系统结束，重新运行后仍可粘贴同一个授权码。
  writeJSON(KEYS.login, login);
  await Safari.openInApp(authorizeURL(login), true);
  return login;
}

async function presentLogin(state) {
  const title = state.expired ? '重新登录 Claude' : '登录 Claude';
  let login = readJSON(KEYS.login);
  if (!login) {
    const intro = new Alert();
    intro.title = title;
    intro.message = '下一步打开 Claude 官方授权页。登录并点击“授权”后，页面会显示授权码；点击复制，再点浏览器的“完成”回到这里粘贴。';
    intro.addAction('打开授权页');
    intro.addCancelAction('稍后登录');
    if (await intro.presentAlert() < 0) return state;
    login = await openAuthorization();
  }
  let hint = '粘贴授权页上复制的授权码。';
  while (true) {
    const dialog = new Alert();
    dialog.title = title;
    dialog.message = hint;
    dialog.addTextField('授权码');
    dialog.addAction('完成登录');
    dialog.addAction('重新打开授权页');
    dialog.addCancelAction('稍后登录');
    const choice = await dialog.presentAlert();
    if (choice < 0) {
      remove(KEYS.login);
      return state;
    }
    if (choice === 1) {
      login = await openAuthorization();
      hint = '粘贴授权页上复制的授权码。';
      continue;
    }
    // 授权页复制的内容为“授权码#state”。
    const [code, returned] = dialog.textFieldValue(0).trim().split('#');
    if (code && returned === login.state) return await loadState({ code, state: returned, login });
    hint = code && returned ? '授权码不属于本次登录，请点击“重新打开授权页”获取新的授权码。'
      : '授权码不完整，请在授权页点击复制按钮后完整粘贴。';
  }
}

async function main() {
  let state = await loadState();
  if (config.runsInApp) {
    if (state.error?.kind === 'expired') state = await loadState();
    if (state.needsLogin) state = await presentLogin(state);
    const error = state.error;
    const status = error ? `${errorLabel(error)}（${error.stage}）` : state.needsLogin ? '需要登录' : '用量已更新';
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
