import { Helper } from '@skypager/runtime'

export default class Site extends Helper {
  static isCacheable = true

  async discover() {
    const { runtime } = this
    const { fileManager } = runtime  
    const pages = runtime.fileManager.chains
      .patterns(`src/sites/${this.name}/pages/*`)
      .entries()
      .value()

    await Promise.all(pages.map(([id, file]) => {
      if(!runtime.scripts.checkKey(id)) {
        const content = this.runtime.fsx.readFileSync(file.path)
        file.content = String(content)
        runtime.scripts.register(id, () => ({ file }))
      }

      const script = runtime.script(id)
      
      return script.parse().then(() => script)
    }))
  }

  async pageScript(pageId) {
    const script = this.runtime.script(`src/sites/${this.name}/pages/${pageId}.js`)
    return script
  }
  
  async page(pageId) {
    const script = this.runtime.script(`src/sites/${this.name}/pages/${pageId}.js`)
    const blocks = script.importsModules.filter((id) => id.match(/blocks/))

    const { path, default: exp } = await script.sliceModule('path')

    const update = async (params = {}) => {
      this.runtime.info(`Updating Page ${this.name}:${pageId}`, params)
      return true
    }

    return {
      path,
      ...(exp && exp.propTypes) && { propTypes: exp.default.propTypes },
      blocks: blocks.map(imp => imp.replace(/.*blocks\//, '')),
      pageId,
      update
    }
  }

  async buildSource() {
    await this.runtime.proc.async.spawn('babel', ['-d', 'lib/sites', `src/sites/${this.name}`], {
      env: {
        ...process.env,
        BUILD_ENV: 'babel'
      }
    })
  }

  async renderPath(path, options = {}) {
    const html = await this.framework.renderPath(path, {
      App: this.App,
      ...options
    })
    return html
  }

  get sourceBase() {
    return this.runtime.argv.dev
      ? 'src'
      : 'lib'
  }

  get rootPath() {
    return this.runtime.resolve(this.sourceBase, 'sites', this.name)
  }

  get index() {
    return require(this.runtime.resolve(this.rootPath, 'index.js'))   
  }

  get App() {
    return this.get('index.App')
  }

  get pagesConfig() {
    return this.result('index.pages')
      .map((route) => ({
        ...route,
        name: route.default && route.default.name,
        isDynamic: !!(route.path && route.path.match(':'))
      }))
  }

  get availablePages() {
    return this.runtime.fsx.readdirSync(
      this.runtime.resolve(this.rootPath, 'pages')
    ).map(v => v.replace('.js', ''))
  }

  get framework() {
    return this.runtime.framework(this.tryGet('skypager.framework'))
  }
}

export function attach(runtime) {
  Helper.registerHelper('sites', () => Site)

  Site.attach(runtime, Site, {
    lookupProp: 'site',
    registryProp: 'sites',
    registry: Helper.createContextRegistry('site', {
      context: Helper.createMockContext({}),
      formatId: (id) => id.replace(/^\.\//,'').replace(/\.js$/,'').replace('/index', '')
    })
  })
}