const fs = require('fs');
const http = require('http');
const path = require('path');
const { execFile } = require('child_process');

const root = path.resolve(__dirname, '..');
const previews = path.join(root, 'previews');
const PORT = 8768;
const RELOAD_SCRIPT = "<script>new EventSource('/__reload').onmessage = () => location.reload();</script>";
const clients = new Set();
let running = false;
let queued = false;
let timer = null;

function render() {
  if (running) { queued = true; return; }
  running = true;
  // 子进程每次重新加载生成工具，修改 render-preview.cjs 本身也能生效。
  execFile(process.execPath, [path.join(__dirname, 'render-preview.cjs')], (error, stdout, stderr) => {
    running = false;
    process.stdout.write(stdout);
    if (error) console.error(stderr || error.message);
    else for (const res of clients) res.write('data: reload\n\n');
    if (queued) { queued = false; render(); }
  });
}

function schedule() {
  // 一次保存会触发多个文件事件，合并后只生成一次。
  clearTimeout(timer);
  timer = setTimeout(render, 100);
}

fs.watch(path.join(root, 'widgets'), { recursive: true }, (event, file) => {
  if (file?.endsWith('.js')) schedule();
});
fs.watch(__dirname, (event, file) => {
  if (file === 'render-preview.cjs' || file === 'preview-template.html') schedule();
});

const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1);
  if (name === '__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  const file = path.join(previews, name);
  if (!/^[\w-]+\.html$/.test(name) || !fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(file, 'utf8').replace('</body>', RELOAD_SCRIPT + '</body>'));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('预览服务已启动，保存组件脚本、预览模板或生成工具后自动重新生成并刷新页面：');
  for (const file of fs.readdirSync(previews).filter(file => file.endsWith('.html'))) {
    console.log(`  http://127.0.0.1:${PORT}/${file}`);
  }
  render();
});
