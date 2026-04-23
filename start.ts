// 简单的启动脚本 - 避免路径编码问题
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 启动 Vite 开发服务器
const vite = spawn('npx', ['vite'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// 启动 Express 服务器
const server = spawn('npx', ['tsx', 'server.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  vite.kill();
  server.kill();
  process.exit();
});
