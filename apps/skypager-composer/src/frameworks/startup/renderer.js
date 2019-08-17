export async function renderPath(path, options = {}) {
  const { App } = options
  const renderer = await this.pageRenderer(options) 
  const { virtualConsole } = renderer
    
  virtualConsole.sendTo(console)
  
  const { html } = await renderer.renderPage({ 
    App, 
    url: path,
    domOptions: {
      virtualConsole
    }
  })

  return html 
}

export async function loadTemplateHtml(options = {}) {
  const { runtime } = this
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

  return html
}