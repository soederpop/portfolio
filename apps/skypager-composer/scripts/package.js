const runtime = require('@skypager/node')
const { fileManager } = runtime
const { create } = require('tar')

const patterns =  [
  "blocks/**",
  "public/i",
  "public/css",
  "public/js",
  "public/video",
  "public/templates"
]

async function main() {
  await runtime.fsx.mkdirpAsync(runtime.resolve('dist','bundles'))
  const outputPath = runtime.argv.outputPath || runtime.resolve('dist', 'bundles', `bundle-${runtime.currentPackage.version}.tar.gz`)
  await fileManager.startAsync()  

  const files = patterns.reduce((memo,p) => ({
    ...memo,
    ...fileManager.chains.patterns(p).value()
  }), {})
  
  const paths = Object.values(files).map(f => f.relative) 

  await create(
    {
      gzip: true,
      portable: true,
      mtime: new Date('1985-10-26T08:15:00.000Z'),
      prefix: '',
      file: outputPath,
      cwd: runtime.cwd,
    },
    paths 
  )
  
  console.log(`Generated bundle ${outputPath}`)
}

main()