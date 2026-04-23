// start.mjs - 纯 JavaScript 启动脚本
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('正在启动航班延误分析系统...');
console.log('工作目录:', __dirname);

// 运行编译后的服务器
const server = spawn('node', [resolve(__dirname, 'dist/server.cjs')], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (err) => {
  console.error('服务器启动失败:', err);
});

server.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.kill();
  process.exit(0);
});