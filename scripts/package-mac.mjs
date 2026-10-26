import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const go = process.env.GO_BIN || 'go'
const name = '长征征途-Mac免安装版'
const output = path.join(root, 'release', name)
const archive = `${output}.zip`
let stage

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} 退出码 ${code}`)))
  })
}

function capture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root })
    let output = ''
    child.stdout.on('data', data => { output += data })
    child.stderr.pipe(process.stderr)
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve(output.trim()) : reject(new Error(`无法读取程序信息：${command}`)))
  })
}

async function filesIn(directory, prefix = '') {
  const files = []
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const name = prefix + entry.name
    if (entry.isDirectory()) files.push(...await filesIn(path.join(directory, entry.name), `${name}/`))
    else if (entry.isFile() && !entry.name.startsWith('.')) files.push(name)
  }
  return files
}

function markUtf8Names(zip) {
  // ditto 保留执行权限，但部分版本未标记中文文件名的 UTF-8 编码。
  const end = zip.length - 22
  if (zip.readUInt32LE(end) !== 0x06054b50) throw new Error('无法读取压缩包目录。')
  let cursor = zip.readUInt32LE(end + 16)
  const entries = zip.readUInt16LE(end + 10)
  const utf8 = new TextDecoder('utf-8', { fatal: true })
  for (let index = 0; index < entries; index++) {
    if (zip.readUInt32LE(cursor) !== 0x02014b50) throw new Error('压缩包目录格式异常。')
    const nameLength = zip.readUInt16LE(cursor + 28)
    utf8.decode(zip.subarray(cursor + 46, cursor + 46 + nameLength))
    const local = zip.readUInt32LE(cursor + 42)
    if (zip.readUInt32LE(local) !== 0x04034b50) throw new Error('压缩包文件头格式异常。')
    zip.writeUInt16LE(zip.readUInt16LE(cursor + 8) | 0x800, cursor + 8)
    zip.writeUInt16LE(zip.readUInt16LE(local + 6) | 0x800, local + 6)
    cursor += 46 + nameLength + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32)
  }
}

try {
  if (process.platform !== 'darwin') throw new Error('Mac 运行包需要在 macOS 上制作。')
  const goRoot = await capture(go, ['env', 'GOROOT'])
  const lipo = await capture('/usr/bin/xcrun', ['--find', 'lipo'])
  await run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build'])
  stage = await mkdtemp(path.join(os.tmpdir(), 'changzheng-mac-'))
  await cp(path.join(root, 'dist'), path.join(stage, 'web'), { recursive: true })
  for (const filename of (await readdir(path.join(root, 'scripts/portable'))).filter(name => name.endsWith('.go'))) {
    await cp(path.join(root, 'scripts/portable', filename), path.join(stage, filename))
  }
  await writeFile(path.join(stage, 'go.mod'), 'module changzheng-portable\n\ngo 1.24\n')
  const siteHash = createHash('sha256')
  for (const filename of await filesIn(path.join(stage, 'web'))) {
    siteHash.update(filename + '\0').update(await readFile(path.join(stage, 'web', filename)))
  }
  const siteID = siteHash.digest('hex')
  const binaries = []
  for (const arch of ['arm64', 'amd64']) {
    console.log(`正在编译 Mac ${arch === 'arm64' ? 'Apple Silicon' : 'Intel'} 程序…`)
    const binary = path.join(stage, `changzheng-${arch}`)
    await run(go, ['build', '-trimpath', '-ldflags', `-s -w -buildid= -X main.siteID=${siteID}`, '-o', binary, '.'], {
      cwd: stage,
      env: { ...process.env, GOOS: 'darwin', GOARCH: arch, GOAMD64: 'v1', CGO_ENABLED: '0', GOWORK: 'off', GOTOOLCHAIN: 'local', GOPROXY: 'off' }
    })
    binaries.push(binary)
  }
  await rm(output, { recursive: true, force: true })
  await mkdir(path.join(output, '程序'), { recursive: true })
  const executable = path.join(output, '程序/长征征途')
  await run(lipo, ['-create', ...binaries, '-output', executable])
  await chmod(executable, 0o755)
  await run('/usr/bin/codesign', ['--force', '--sign', '-', executable])

  const launcher = path.join(output, '启动长征征途.command')
  await writeFile(launcher, `#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if [ ! -x "./程序/长征征途" ]; then
  echo "请完整解压运行包，并保留程序文件夹。"
  read -r -p "按回车键关闭…" reply
  exit 1
fi
exec "./程序/长征征途"
`)
  await chmod(launcher, 0o755)
  const instructions = `长征征途 · Mac 免安装版

适用：macOS 13 Ventura 或更新版本，Apple Silicon（M 系列）和 Intel 芯片的 Mac。

1. 完整解压压缩包，保留整个文件夹。
2. 双击“启动长征征途.command”，网站会自动在默认浏览器打开。
3. 使用期间保留终端窗口；回到终端按 Ctrl+C 或关闭该窗口即可停止网站。

不需要安装 Node.js、Python、Go 或其他依赖。
网页、地图和图片可以离线浏览；打开外部参考资料链接时需要联网。
重复启动会打开已经运行的网站。若浏览器没有自动打开，复制终端显示的网址即可。

首次打开
此运行包没有 Apple 开发者签名或公证。若 macOS 提示无法验证开发者，请先尝试打开，再进入“系统设置 → 隐私与安全性 → 仍要打开”，按提示确认。
苹果官方说明：https://support.apple.com/zh-cn/102445

此包用于浏览网站。修改网页后，请重新制作运行包。
`
  await writeFile(path.join(output, '使用说明.txt'), instructions)
  const licenses = [
    ['Vue', path.join(root, 'node_modules/vue/LICENSE')],
    ['Apache ECharts', path.join(root, 'node_modules/echarts/LICENSE')],
    ['Apache ECharts NOTICE', path.join(root, 'node_modules/echarts/NOTICE')],
    ['D3 components used by ECharts', path.join(root, 'node_modules/echarts/licenses/LICENSE-d3')],
    ['zrender', path.join(root, 'node_modules/zrender/LICENSE')],
    ['tslib', path.join(root, 'node_modules/tslib/LICENSE.txt')],
    ['tslib copyright', path.join(root, 'node_modules/tslib/CopyrightNotice.txt')],
    ['Tailwind CSS', path.join(root, 'node_modules/tailwindcss/LICENSE')],
    ['Go', path.join(goRoot, 'LICENSE')],
    ['Go patent grant', path.join(goRoot, 'PATENTS')]
  ]
  let notices = '长征征途 · 第三方许可与来源\n\n图片和史料的已有出处保留在网页图注与参考资料中。\nNatural Earth：Public Domain · https://www.naturalearthdata.com/\nGeoNames：CC BY 4.0 · https://www.geonames.org/ · https://creativecommons.org/licenses/by/4.0/\n中国行政区划及境界线：天地图行政区划可视化服务，页面标注数据更新至2026年10月；仅供地图可视化使用。https://cloudcenter.tianditu.gov.cn/administrativeDivision/\n背景音乐：崇高理想 · 红红肖。爱给网 · 团队提供音频，默认音量10%。曲名和署名按团队指定记录。\n长征精神视频：“党史启迪未来”系列短视频｜长征精神；讲师四川省委党校（行政学院）邱潇。团队提供MP4，来源：共产党员网 https://www.12371.cn/2023/08/02/VIDE1690934042842762.shtml 。\n\n'
  for (const [label, file] of licenses) notices += `========== ${label} ==========\n\n${await readFile(file, 'utf8')}\n\n`
  await writeFile(path.join(output, '第三方许可.txt'), notices)
  console.log('正在生成 Mac 通用压缩包…')
  await run('/usr/bin/ditto', ['-c', '-k', '--keepParent', '--norsrc', output, archive])
  const zip = await readFile(archive)
  markUtf8Names(zip)
  await writeFile(archive, zip)
  const checksum = createHash('sha256').update(zip).digest('hex')
  await writeFile(`${archive}.sha256`, `${checksum}  ${name}.zip\n`)
  await rm(output, { recursive: true, force: true })
  console.log(`已生成：${archive}\n大小：${(zip.length / 1024 / 1024).toFixed(1)} MB\nSHA-256：${checksum}`)
} catch (error) {
  console.error(`打包失败：${error.message}`)
  if (error.code === 'ENOENT') console.error('制作运行包需要 Go 和 Apple Command Line Tools。接收运行包的同学无需安装。')
  process.exitCode = 1
} finally {
  if (stage) await rm(stage, { recursive: true, force: true })
}
