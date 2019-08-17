import { Helper } from '@skypager/runtime'

export default class Framework extends Helper {
  static isCacheable = true

  get sourceBase() {
    return this.runtime.argv.dev
      ? 'src'
      : 'lib'
  }
  
  get rootPath() {
    return this.runtime.resolve(this.sourceBase, 'frameworks', this.name)
  }

  /** 
   * Returns the folder which contains the categorized block components
  */
  get blocksRoot() {
    return this.tryGet('blocksRoot', this.runtime.resolve('blocks'))
  }

  get manifest() {
    return this.runtime.fsx.readJsonSync(this.runtime.resolve(this.rootPath, 'framework.json'))
  }

  get renderer() {
    return require(this.runtime.resolve(this.rootPath, 'renderer.js'))
  }

  get index() {
    return require(this.runtime.resolve(this.rootPath, 'index.js'))
  }

  async renderPath(path, options) {
    const renderPath = this.get('renderer.renderPath')
    const html = await renderPath.call(this, path, options)
    return html
  }

  async pageRenderer(options = {}) {
    if (this._renderer) {
      return this._renderer
    }

    const loadHtml = this.get('renderer.loadTemplateHtml')
    const html = await loadHtml.call(this, options)
    const renderer = this.runtime.feature('renderer', { html })

    this.hide('_renderer', renderer)

    return renderer
  }
}

export function attach(runtime) {
  Helper.registerHelper('frameworks', () => Framework)

  Framework.attach(runtime, Framework, {
    lookupProp: 'framework',
    registryProp: 'frameworks',
    registry: Helper.createContextRegistry('framework', {
      context: Helper.createMockContext({}),
      formatId: (id) => id.replace(/^\.\//,'').replace(/\.js$/,'').replace('/index', '')
    })
  })
}