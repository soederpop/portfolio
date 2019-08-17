import App from './App'
import Renderer from './renderer'
import { default as Block, attach as BlockHelper } from './helpers/Block'
import { default as Framework, attach as FrameworkHelper } from './helpers/Framework'
import { default as Site, attach as SiteHelper } from './helpers/Site'
import * as DocHelper from '@skypager/helpers-document'

export { App }

export function attach(runtime, options = {}) {
  runtime.features.register('renderer', () => Renderer)

  runtime
    .use({ attach: BlockHelper })
    .use({ attach: SiteHelper })
    .use({ attach: FrameworkHelper })
    .use(DocHelper)

  /** 
   * @returns {Block}
  */
  function loadBlock(blockId, options) {
    return runtime.block(blockId, options)
  }

  runtime.blockComponent = loadBlock

  const blocks = runtime.blocks

  const importCollection = (requireContexts = {}) =>
    Object.keys(requireContexts).map(groupName => {
      const ctx = requireContexts[groupName]
      const keys = ctx.keys()

      keys.forEach(key => {
        const id = key
          .replace('./', '')
          .replace('.js', '')
          .replace(/\/index$/, '')
        const [group, number] = id.split('/')
        const blockId = `${group}/${number.replace(/[a-z]/gi, '')}`

        blocks.register(blockId, () => ({
          ...ctx(key),
          blockId,
          groupName,
          folder: runtime.relative(
            runtime.pathUtils.dirname(runtime.resolve('src', 'blocks', key))
          ),
        }))
      })
    })

  blocks.import = (...args) => importCollection(...args)

  runtime.sites.import = (req) =>
    req.keys().forEach(key => runtime.sites.register(key, () => req(key)))

  runtime.sites.discover = () =>
    runtime.fsx.readdirAsync(runtime.resolve('src', 'sites')).then((results) => 
      results.map(siteName => runtime.sites.register(siteName, () => require(runtime.resolve('src', 'sites', siteName, 'site.json'))))
    )

  runtime.frameworks.import = (req) =>
    req.keys().forEach(key => runtime.frameworks.register(key, () => req(key)))
  
  runtime.frameworks.discover = () =>
    runtime.fsx.readdirAsync(runtime.resolve('src', 'frameworks')).then((results) => 
      results.map(frameworkName => runtime.frameworks.register(frameworkName, () => require(runtime.resolve('src', 'frameworks', frameworkName, 'index.js'))))
    )
}
