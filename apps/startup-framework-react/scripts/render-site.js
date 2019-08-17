require('babel-plugin-require-context-hook/register')()

const runtime = require('@skypager/node')
const framework = runtime.argv.dev ? require('../src') : require('../lib')
const blocksBundle = runtime.argv.dev ? require('../src/blocks').requireContexts : require('../lib/blocks').requireContexts

main()

async function main() {
  const site = runtime.argv._[0]

  runtime.use(framework)
    .use((next) => {
      console.log('Importing Blocks')
      runtime.blocks.import(blocksBundle)
      next()
    })

  console.log('Starting Runtime')
  await runtime.start()

  const publicRoot = runtime.resolve('dist', site)

  await runtime.fsx.mkdirpAsync(publicRoot)
  
  await Promise.all([
    'css',
    'i',
    'js',
    'video',
    'static',
    'themes'
  ].map(folder => 
    runtime.fsx.copyAsync(
    runtime.resolve('lib', folder),
    runtime.resolve('dist', site, folder)
  )))

  const engine = require(runtime.resolve('lib', 'sites', site)) 
  const { App, pages } = engine
  const paths = pages().map((p) => p.path)
  
  const rootHtml = await runtime.fsx.readFileAsync(runtime.resolve('lib', 'index.html')).then(b => String(b))

  let sawIndex = false
  const html = rootHtml.split("\n").reduce((memo, line) => {
    if (sawIndex) {
      return memo
    }
    if (line.match('<script>!function')) {
      sawIndex = true
      return `${memo}\n</body></html>`
    } else {
      return `${memo}\n${line}`
    }
  }, ``)

  const renderer = runtime.feature('renderer', {
    html
  })

  for(let path of paths) {
    const { virtualConsole } = renderer
    
    virtualConsole.sendTo(console)
    
    const { context, url, html: output } = await renderer.renderPage({ 
      App, 
      url: path,
      domOptions: {
        virtualConsole
      }
    })

    const outputPath = runtime.resolve(publicRoot, path === '/' ? 'index.html' : `${path.replace(/^\//,'')}/index.html`)
    const outputDir = runtime.pathUtils.dirname(outputPath)

    console.log(`Rendering ${path} (${output.length} bytes)`)

    await runtime.fsx.mkdirpAsync(outputDir)
    await runtime.fsx.writeFileAsync(outputPath, output, 'utf8')
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});