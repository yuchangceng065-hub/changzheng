import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync, realpathSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = realpathSync(fileURLToPath(new URL('..', import.meta.url)))
const projectId = createHash('sha256').update(root).digest('hex').slice(0, 16)
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 20 || major === 20 && minor < 19 || major === 22 && minor < 12) {
  console.error('请先安装 Node.js 22.12 或更新的 LTS 版本：https://nodejs.org/zh-cn')
  process.exit(1)
}

let child
function run(command, args) {
  return new Promise((resolve, reject) => {
    child = spawn(command, args, { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => { child = null; resolve(signal ? 1 : code ?? 1) })
  })
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => { child?.kill(signal); process.exit(signal === 'SIGINT' ? 130 : 143) })
}
function openBrowser(url) {
  if (process.env.CHANGZHENG_NO_OPEN === '1') return
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'rundll32.exe' : 'xdg-open'
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url]
  const opener = spawn(command, args, { detached: true, stdio: 'ignore' })
  opener.on('error', () => console.log(`请在浏览器打开：${url}`))
  opener.unref()
}
async function isOurServer(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/__local_project`, { signal: AbortSignal.timeout(600) })
    return response.ok && await response.text() === projectId
  } catch { return false }
}
function isFree(port) {
  return new Promise(resolve => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
  })
}

try {
  let port
  for (let candidate = 5173; candidate <= 5183; candidate++) {
    if (await isOurServer(candidate)) {
      const url = `http://127.0.0.1:${candidate}/`
      console.log(`网站已在运行：${url}`)
      openBrowser(url)
      process.exit(0)
    }
    if (await isFree(candidate)) { port = candidate; break }
  }
  if (!port) throw new Error('5173—5183 端口均被占用，请关闭不再使用的本地服务后重试。')
  const vite = path.join(root, 'node_modules/vite/bin/vite.js')
  if (!existsSync(vite)) {
    console.log('首次启动，正在安装网站依赖，请保持联网…')
    const command = existsSync(path.join(root, 'package-lock.json')) ? 'npm ci' : 'npm install'
    const code = process.platform === 'win32'
      ? await run('cmd.exe', ['/d', '/s', '/c', command])
      : await run('npm', command.split(' ').slice(1))
    if (code !== 0) throw new Error('依赖安装未完成，请检查网络后重新启动。')
  }
  const url = `http://127.0.0.1:${port}/`
  console.log(`正在启动长征征途：${url}\n关闭此窗口或按 Ctrl+C 可停止网站。`)
  const readyTimer = setInterval(async () => {
    if (await isOurServer(port)) {
      clearInterval(readyTimer)
      console.log(`网站已就绪：${url}`)
      openBrowser(url)
    }
  }, 500)
  let code
  try { code = await run(process.execPath, [vite, '--host', '127.0.0.1', '--port', String(port), '--strictPort']) }
  finally { clearInterval(readyTimer) }
  if (code) console.error('启动未完成，请查看上方错误信息。')
  process.exitCode = code
} catch (error) {
  console.error(`启动失败：${error.message}`)
  process.exitCode = 1
}
