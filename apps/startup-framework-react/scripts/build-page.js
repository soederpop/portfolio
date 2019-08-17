require('babel-plugin-require-context-hook/register')()

const runtime = require('@skypager/node')
const framework = require('../lib')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const { App } = framework

runtime
  .use(framework)

runtime.blocks.import(
  require('../lib/blocks').default
)

async function main() {
  const elements = runtime.argv._ || []

  const renderedBlocks = elements.map((el) => {
    const { default: Component } = runtime.blocks.lookup(el)
    return React.createElement(Component, { key: el })
  })

  const html = renderToStaticMarkup(
    <App>
      {renderedBlocks}  
    </App>
  )
  
  const rootHtml = await runtime.fsx.readFileAsync(runtime.resolve('lib', 'index.html')).then(b => String(b))

  const rawPageHtml = rootHtml
    .replace('<div id="root"></div>', `\n${html}\n`) 
  
  let sawIndex = false
  const pageHtml = rawPageHtml.split("\n").reduce((memo, line) => {
    if (sawIndex) {
      return memo
    }
    if (line.match(/BEGIN_INJECT/)) {
      sawIndex = true
      return `${memo}\n</body></html>`
    } else {
      return `${memo}\n${line}`
    }
  }, ``)

  const nameParts = (runtime.argv.name || runtime.hashObject({ elements }).slice(0, 12)).split('/')

  if (runtime.argv.index !== false) {
    nameParts.push('index.html')
  } else {
    nameParts[ nameParts.length - 1 ] = `${nameParts[nameParts.length - 1]}.html`
  }

  const outputPath = runtime.resolve('lib', ...nameParts)
  await runtime.fsx.mkdirpAsync(
    runtime.pathUtils.dirname(outputPath)
  )

  await runtime.fsx.writeFileAsync(outputPath, `${pageHtml}\n`, 'utf8')

  if (runtime.argv.stdout) {
    console.log(`${pageHtml}\n`)
  }
}

main()

