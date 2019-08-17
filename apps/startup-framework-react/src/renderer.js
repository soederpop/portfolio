import React from 'react'
import { Runtime, Feature } from '@skypager/runtime'
import '@skypager/features-browser-vm'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { VirtualConsole } from 'jsdom'

export default class Renderer extends Feature {
  static shortcut = 'renderer'
  static isCacheable = true
  static isObservable = true

  renderRequest(req, options) {
    const { html, context } = this.renderPage({ ...options, url: req.url })

    return {
      html,
      context,
      req
    }
  }

  renderPage(options = {}) {
    const { App = this.App } = options
    const context = options.context || {} 
    
    let appRuntime
   
    try {
      appRuntime = options.runtime || new Runtime()
    } catch(error){
      appRuntime = this.runtime
    }
    
    const url = options.url

    const routerProps = {
      context,
      location: url 
    }
    
    const content = renderToStaticMarkup(
      <App 
        staticRouter 
        routerProps={routerProps} 
        runtime={appRuntime} 
      />
    )
    
    const html = this.createDOM({ content, ...options }).serialize()

    return {
      html, context, runtime: appRuntime, url
    }
  }

  get vm() {
    return this.runtime.feature('browser-vm')
  }

  get virtualConsole() {
    if(this._virtualConsole) return this._virtualConsole

    const vc = new VirtualConsole()
    this.hide('_virtualConsole', vc)

    vc
      .on("error", (...args) => this.emit("logError", ...args))
      .on("warn", (...args) => this.emit("logWarn", ...args))
      .on("debug", (...args) => this.emit("logDebug", ...args))
      .on("info", (...args) => this.emit("logInfo", ...args))
      .on("log", (...args) => this.emit("logInfo", ...args))
      .on("dir", (...args) => this.emit("logInfo", ...args))

    return vc
  }

  get dom() {
    const { isEmpty } = this.lodash
    const html = this.tryGet('html')
    const { virtualConsole } = this
    const initialState = this.tryGet('pageState')
    
    return this.runtime.cache.fetch(`dom:${this.uuid}`, () => this.createDOM({
      initialState,
      domOptions: {
        virtualConsole
      },
      ...!isEmpty(html) && { html },
      ...!isEmpty(initialState) && { initialState },
    }))
  }

  createDOM(options = {}) {
    const domContent = this.tryGet('html', options.html || options.domContent || String(
      this.runtime.fsx.readFileSync(
        this.runtime.resolve('lib', 'index.html')
      )
    ))

    const dom = this.vm.createMockDOM({
      domContent,
      ...this.lodash.pick(options, 'domOptions', 'captureConsole', 'virtualConsole')
    })

    const { content, rootEl = 'root', stateEl = 'skypager-initial-state', initialState } = options

    if (content && content.length) {
      const rootTag = dom.window.document.getElementById(rootEl)
      rootTag.innerHTML = String(content)
    }

    if (initialState) {
      const stateScript = dom.window.document.getElementById(stateEl)
      if (stateScript) {
        stateScript.innerHTML = `window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};`
      }
    }

    return dom
  }

}