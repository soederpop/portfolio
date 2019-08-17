import { Helper } from '@skypager/runtime'
import * as BrowserVm from '@skypager/features-browser-vm'

export default class Block extends Helper {
  static isCacheable = true
  
  initialize() {
    this.runtime.use(BrowserVm)
    this.lazy('dom', () => this.createDOM(this.options))
  }

  get doc() {
    const folder = this.tryGet('folder')
    return this.runtime.mdxDoc(`${folder}/README`)
  }

  get screenshot() {
    const folder = this.tryGet('folder')
    return this.runtime.resolve(folder, 'screenshot.png') 
  }

  get script() {
    const folder = this.tryGet('folder')
    return this.runtime.script(`${folder}/index.js`)
  }

  async process(options) {
    const { doc } = this
    await doc.process(options)
    return this
  }

  createDOM(options = {}) {
    const htmlSource = this.doc.codeBlocks[0].value
    return this.runtime.browserVm.createMockDOM({
      domContent: `<html><body>${htmlSource}</body></html>`,
      ...options
    })
  }
}

export function attach(runtime) {
  runtime.use(BrowserVm)
  Helper.registerHelper('blocks', () => Block)

  Block.attach(runtime, Block, {
    lookupProp: 'block',
    registryProp: 'blocks',
    registry: Helper.createContextRegistry('blocks', {
      context: Helper.createMockContext({}),
      formatId: (id) => id.replace(/^\.\//,'').replace(/\.js$/,'').replace('/index', '')
    })
  })
}