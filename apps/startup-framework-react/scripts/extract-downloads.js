const runtime = require('@skypager/node')
const zips = runtime.fsx.readdirSync(
  runtime.resolve('downloads')
).filter(file => file.endsWith('.zip'))

zips.forEach((zipFile) => {
  console.log(`Extracing ${zipFile}`)
  runtime.proc.spawnSync('unzip', ['-o', `downloads/${zipFile}`, '-d', `downloads/${zipFile.replace('.zip', '')}`], {
    cwd: runtime.cwd,
    stdio: 'ignore'
  })
})
