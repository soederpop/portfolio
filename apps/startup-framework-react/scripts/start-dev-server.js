process.env.NODE_ENV = 'development'
process.env.BABEL_ENV = 'development'

require('@babel/register')()

const CopyWebpackPlugin = require('copy-webpack-plugin')
const bodyParser = require('body-parser')

const React = require('react')
const runtime = require('../runtime')
const { renderToStaticMarkup } = require('react-dom/server')
const rootHtml = String(runtime.fsx.readFileSync(runtime.resolve('lib', 'index.html')))
let sawIndex = false
const pageHtml = rootHtml.split('\n').reduce((memo, line) => {
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

async function main() {
  await runtime.start()
  const requestedPort = runtime.argv.port || process.env.PORT || 3001
  const port = await runtime.networking.findOpenPort(requestedPort)

  runtime.servers.register('dev-server', () => ({
    port,
    history: false,
    cors: true,
    serveStatic: runtime.resolve('lib'),
    async appDidMount(app) {
      app.use(bodyParser.json())
      
      const webpack = require('webpack')
      const devMiddleware = require('webpack-dev-middleware')
      const hotMiddleware = require('webpack-hot-middleware')
      const config = require('@skypager/webpack/config/webpack.config')('development')

      const babelConfig = config.module.rules[1].oneOf[1]

      babelConfig.options.babelrc = false
      babelConfig.options.presets = babelConfig.options.presets || []

      babelConfig.options.presets = [
        ["@babel/preset-env", { modules: false }],
        "@babel/preset-react",
        ...babelConfig.options.presets
      ]

      config.target = 'web'
      config.externals = config.externals || []

      config.externals.push({
        'semantic-ui-react': 'global semanticUIReact',
        'skypager': 'global skypager',
        '@skypager/web': 'global skypager',
        '@skypager/runtime': 'global skypager',
        '@skypager/helpers-document/lib/skypager-document-editor': 'global SkypagerEditor',
        '@skypager/helpers-document': 'global SkypagerHelpersDocument',
        react: 'global React',
        'react-dom': 'global ReactDOM'
      }) 

      config.entry.app = [
        runtime.resolve('src','docs', 'launch.js')  
      ]

      const HtmlWebpackPlugin = require('html-webpack-plugin')

      config.plugins[0] = new HtmlWebpackPlugin({
        filename: 'index.html',
        inject: true,
        template: runtime.resolve('public', 'templates', 'docs.html'),
      }) 

      config.plugins.push(new CopyWebpackPlugin([{
        from: runtime.resolve('public', 'i'),
        to: 'i',
      }, {
        from: runtime.resolve('public', 'js'),
        to: 'js',       
      }, {
        from: runtime.resolve('public', 'css'),
        to: 'css',       
      }, {
        from: runtime.resolve('public', 'video'),
        to: 'video',       
      }, {
        from: runtime.resolve('lib', 'themes'),
        to: 'themes',       
      }]))

      if (runtime.argv.webpack !== false) {
        this.setupDevelopmentMiddlewares({ webpack, devMiddleware, hotMiddleware, config })
      }
    },
    appWillMount(app) {
      app.get('/blocks', (req, res) => {
        const allBlocks = runtime.blocks.allInstances()
        const data = allBlocks.map((block) => ({
          id: block.name,
          screenshotUrl: `/preview/${block.name}.png`,
          previewUrl: `/preview/${block.name}`
        }))

        res.json(data)
      })
      app.get('/blocks/:group/:id', (req, res) => {
        const blockId = `${req.params.group}/${req.params.id}`
        const block = runtime.block(blockId)
        res.json({
          id: block.name,
          screenshotUrl: `/preview/${block.name}.png`,
          previewUrl: `/preview/${block.name}`,
        })
      })      
      app.get('/preview', (req, res) => {
        const structure = req.query.structure

        if (structure && structure.length) {
          const blockIds = structure.split(',').map(v => v.trim())
          
          const blocks = blockIds.map((blockId) => {
            const { default: Component } = runtime.blocks.lookup(blockId)
            const html = renderToStaticMarkup(<Component />)
            return html
          })

          res.status(200).end(pageHtml.replace('<div id="root"></div>', blocks.join("\n\n")))
        }
      })

      app.get('/preview/:group/:id.png', async (req,res) => {
        const blockId = `${req.params.group}/${req.params.id}`
        const { screenshot } = runtime.block(blockId)
        res.sendFile(screenshot)
      })

      app.get('/preview/:group/:id', (req,res) => {
        const blockId = `${req.params.group}/${req.params.id}`
        const { default: Component } = runtime.blocks.lookup(blockId)
        const html = renderToStaticMarkup(<Component />)
        res.status(200).end(pageHtml.replace('<div id="root"></div>', html))
      })

      app.get('/api/sites/:siteId', (req, res) => {
        const siteId = req.params.siteId        
        const site = runtime.site(siteId)
        const pagesConfig = site.pagesConfig

        res.json({
          pagesConfig,
          availablePages: site.availablePages,
          manifest: site.provider,
          rootPath: runtime.relative(site.rootPath)
        })
      })
      app.get('/preview-pages/:siteId/:pageId', async (req, res) => {
        const siteId = req.params.siteId
        const pageId = req.params.pageId
        const site = runtime.site(siteId)

        await site.discover()

        const page = await site.page(pageId)

        console.log(page)
        const path = page.path
        const html = await site.renderPath(path)
        res.write(html)
      })      

      app.put('/api/pages/:siteId/:pageId', async (req, res) => {
        const siteId = req.params.siteId
        const pageId = req.params.pageId
        const site = runtime.site(siteId)
        await site.discover()

        const page = await site.page(pageId)

        try {
          const result = await page.update(req.body)

          if (result === true) {
            res.status(200).json({ ...page, siteId, pageId })
          } else {
            res.status(400).json(result)
          }
        } catch(error) {
          runtime.error(`Error updating block`, error)
          res.status(500).json({ error: error.message })
        }

      })            

      app.get('/api/pages/:siteId/:pageId', async (req, res) => {
        const siteId = req.params.siteId
        const pageId = req.params.pageId
        const site = runtime.site(siteId)
        await site.discover()

        const page = await site.page(pageId)

        res.json({ ...page, siteId, pageId })
      })      
    }  
  }))

  const server = runtime.server('dev-server')

  await server.start()

  if (runtime.argv.interactive) {
    await runtime.repl('interactive').launch({ runtime, server })
  }

  if (runtime.argv.open !== false) {
    await runtime.opener.openInBrowser(`http://localhost:${server.port}`)
  }
}

main()

async function generateHtml() {

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
}
