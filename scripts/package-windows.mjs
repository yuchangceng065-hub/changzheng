import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateRawSync } from 'node:zlib'

const root = fileURLToPath(new URL('..', import.meta.url))
const go = process.env.GO_BIN || 'go'
const name = '长征征途-Windows免安装版'
const releaseDirectory = path.resolve(root, process.env.RELEASE_DIR || 'release')
const archive = path.join(releaseDirectory, `${name}.zip`)
let stage
let output

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
    child.once('exit', code => code === 0 ? resolve(output.trim()) : reject(new Error(`无法读取 Go 信息：${code}`)))
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

const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0)
  return value >>> 0
})
function crc32(data) {
  let crc = 0xffffffff
  for (const value of data) crc = (crc >>> 8) ^ crcTable[(crc ^ value) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}
async function zipDirectory(directory, prefix) {
  const localParts = [], directoryParts = []
  let offset = 0
  const now = new Date()
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)
  for (const relative of await filesIn(directory)) {
    const filename = Buffer.from(`${prefix}/${relative}`, 'utf8')
    const data = await readFile(path.join(directory, relative))
    const compressed = deflateRawSync(data, { level: 9 })
    const checksum = crc32(data)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(0x800, 6)
    header.writeUInt16LE(8, 8)
    header.writeUInt16LE(dosTime, 10)
    header.writeUInt16LE(dosDate, 12)
    header.writeUInt32LE(checksum, 14)
    header.writeUInt32LE(compressed.length, 18)
    header.writeUInt32LE(data.length, 22)
    header.writeUInt16LE(filename.length, 26)
    localParts.push(header, filename, compressed)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    header.copy(central, 8, 6, 26)
    central.writeUInt16LE(filename.length, 28)
    central.writeUInt32LE(0x20, 38)
    central.writeUInt32LE(offset, 42)
    directoryParts.push(central, filename)
    offset += header.length + filename.length + compressed.length
  }
  const centralDirectory = Buffer.concat(directoryParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50)
  end.writeUInt16LE(directoryParts.length / 2, 8)
  end.writeUInt16LE(directoryParts.length / 2, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...localParts, centralDirectory, end])
}

try {
  const goRoot = await capture(go, ['env', 'GOROOT'])
  await run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build'])
  stage = await mkdtemp(path.join(os.tmpdir(), 'changzheng-portable-'))
  output = path.join(stage, name)
  await cp(path.join(root, 'dist'), path.join(stage, 'web'), { recursive: true })
  for (const filename of ['main.go', 'console_windows.go', 'console_other.go']) {
    await cp(path.join(root, 'scripts/portable', filename), path.join(stage, filename))
  }
  await writeFile(path.join(stage, 'go.mod'), 'module changzheng-portable\n\ngo 1.24\n')
  const siteHash = createHash('sha256')
  for (const filename of await filesIn(path.join(stage, 'web'))) {
    siteHash.update(filename + '\0').update(await readFile(path.join(stage, 'web', filename)))
  }
  const siteID = siteHash.digest('hex')
  await mkdir(output, { recursive: true })
  console.log('正在编译 Windows x64 免安装程序…')
  await run(go, ['build', '-trimpath', '-ldflags', `-s -w -buildid= -X main.siteID=${siteID}`, '-o', path.join(output, '启动长征征途.exe'), '.'], {
    cwd: stage,
    env: { ...process.env, GOOS: 'windows', GOARCH: 'amd64', GOAMD64: 'v1', CGO_ENABLED: '0', GOWORK: 'off', GOTOOLCHAIN: 'local', GOPROXY: 'off' }
  })
  const instructions = `长征征途 · Windows 免安装版\r\n\r\n适用：Windows 10 / 11，64位 Intel 或 AMD 电脑。\r\n\r\n1. 先把压缩包完整解压到一个文件夹。\r\n2. 双击“启动长征征途.exe”，网站会自动在默认浏览器中打开。\r\n3. 使用期间保留启动窗口；关闭窗口或按 Ctrl+C 即可停止网站。\r\n\r\n不需要安装 Node.js、Python、Go 或其他依赖。\r\n网页、地图和图片可以离线浏览；点击外部参考资料链接时需要联网。\r\n重复双击会打开已经运行的网站。若浏览器没有自动打开，复制启动窗口中的网址即可。\r\n\r\n此包用于浏览网站。修改网页后，请重新生成运行包。\r\n`
  const mediaInstructions = '\r\n音乐与留言墙\r\n音乐球默认位于右侧中部，可拖动圆心移动位置，点击播放或暂停，鼠标悬停显示进度和音量；背景音乐为《崇高理想》—红红肖，默认音量10%，来源为爱给网、团队提供音频。打开网页时尝试自动播放，浏览器阻止时在首次点击页面后播放；主动暂停后不自动重启。\r\n长征精神页新增邱潇讲授的长征精神视频，随包保存，可离线观看。视频播放时背景音乐暂停，离开页面停止视频。\r\n点击顶部留言墙，从右侧打开留言抽屉；留言保存在当前浏览器，不跨设备共享。\r\n\r\n地图说明\r\n本版实际底图采用天地图行政区划服务的2026年10月更新数据，含全部省级区域和境界线。未使用旧DataV底图，已取消ECharts自动补绘的重复南海小框。地图栏注明天地图在线底图审图号GS（2026）4921号，底图来源链接保留。此号仅对应来源在线底图，不转用于本地矢量数据或组合地图。\r\n'
  await writeFile(path.join(output, '使用说明.txt'), '\ufeff' + instructions + mediaInstructions)
  const licenses = [
    ['Vue', path.join(root, 'node_modules/vue/LICENSE')],
    ['Apache ECharts', path.join(root, 'node_modules/echarts/LICENSE')],
    ['Apache ECharts NOTICE', path.join(root, 'node_modules/echarts/NOTICE')],
    ['D3 components used by ECharts', path.join(root, 'node_modules/echarts/licenses/LICENSE-d3')],
    ['zrender', path.join(root, 'node_modules/zrender/LICENSE')],
    ['tslib', path.join(root, 'node_modules/tslib/LICENSE.txt')],
    ['tslib copyright', path.join(root, 'node_modules/tslib/CopyrightNotice.txt')],
    ['Tailwind CSS', path.join(root, 'node_modules/tailwindcss/LICENSE')],
    ['Vite', path.join(root, 'node_modules/vite/LICENSE.md')],
    ['Vite Vue plugin', path.join(root, 'node_modules/@vitejs/plugin-vue/LICENSE')],
    ['Tailwind Vite plugin', path.join(root, 'node_modules/@tailwindcss/vite/LICENSE')],
    ['Go', path.join(goRoot, 'LICENSE')],
    ['Go patent grant', path.join(goRoot, 'PATENTS')]
  ]
  let notices = '长征征途 · 第三方许可与来源\n\n本文件收集主要运行组件及主要构建工具的许可文本，不构成图片、地图或其他内容已取得授权的保证。完整依赖版本见工程package-lock.json，各组件许可以其对应版本LICENSE为准。\n图片和史料的已有出处保留在网页图注与参考资料中，部分图片来源及使用许可仍需核实。\nNatural Earth：Public Domain · https://www.naturalearthdata.com/\nGeoNames：CC BY 4.0 · https://www.geonames.org/ · https://creativecommons.org/licenses/by/4.0/\n中国行政区划及境界线：天地图行政区划可视化服务，页面标注更新至2026年10月；仅供地图可视化使用。\nhttps://cloudcenter.tianditu.gov.cn/administrativeDivision/\n本地GeoJSON与组合地图不借用天地图在线底图的审图号。\n背景音乐：崇高理想 · 红红肖。爱给网 · 团队提供音频；曲名及署名按团队指定记录。随包文件 music/崇高理想-红红肖.mp3，默认音量10%。来源记录不视作已取得完整授权的证明。首页视频及本地文件选择功能已移除。\n长征精神视频：“党史启迪未来”系列短视频｜长征精神；讲师四川省委党校（行政学院）邱潇。团队提供MP4，随包保存为video/党史启迪未来-长征精神-邱潇.mp4。来源：共产党员网 https://www.12371.cn/2023/08/02/VIDE1690934042842762.shtml 。来源记录不等于已获得离线再分发授权。\n\n'
  for (const [name, file] of licenses) notices += `========== ${name} ==========\n\n${await readFile(file, 'utf8')}\n\n`
  await writeFile(path.join(output, '第三方许可.txt'), '\ufeff' + notices.replace(/\r?\n/g, '\r\n'))
  console.log('正在生成压缩包…')
  const zip = await zipDirectory(output, name)
  await mkdir(releaseDirectory, { recursive: true })
  await writeFile(archive, zip)
  const checksum = createHash('sha256').update(zip).digest('hex')
  await writeFile(`${archive}.sha256`, `${checksum}  ${name}.zip\n`)
  if (process.env.KEEP_PORTABLE_FILES === '1') {
    const directory = path.join(releaseDirectory, 'Windows运行版')
    await mkdir(directory, { recursive: true })
    for (const filename of await filesIn(output)) await cp(path.join(output, filename), path.join(directory, filename))
  }
  console.log(`已生成：${archive}\n大小：${(zip.length / 1024 / 1024).toFixed(1)} MB\nSHA-256：${checksum}`)
} catch (error) {
  console.error(`打包失败：${error.message}`)
  if (error.code === 'ENOENT') console.error('重新制作运行包需要安装 Go，或用 GO_BIN 指定 go 可执行文件。接收运行包的同学不需要安装 Go。')
  process.exitCode = 1
} finally {
  if (stage) await rm(stage, { recursive: true, force: true })
}
