import skypager from '@skypager/web'
import * as DocumentHelper from '@skypager/helpers-document'
import * as AppClient from './client'
import * as moduleFactory from './module-factory'
import * as keybindings from './features/keybindings'
import * as mdxDocs from './mdx-docs'
import docs from './features/docs'
import workspace from './features/workspace'
import sites from './features/sites'
import { createBrowserHistory } from 'history'
import { Component } from 'react'

skypager.history = createBrowserHistory()

skypager.history.listen((location, action) => {
  const { hash: locationHash, pathname: locationPathname } = location
  skypager.setState({ location, locationPathname, locationHash })
})

skypager.selectors.add(require.context('./selectors', false, /\.js$/))

skypager.features.register('keybindings', () => keybindings)
skypager.features.register('sites', () => sites)

skypager
  .use(DocumentHelper)
  .use('editor')
  .use('sites')
  .use('keybindings')
  .use(moduleFactory)
  .use(workspace)
  .use(docs)
  .use(next => {
    skypager.mdxDocs.register('frameworks/startup', () => require('../frameworks/startup/README.md'))
    next()
  })
  .use(next =>
    setupDocs()
      .then(() => next())
      .catch(error => {
        console.error('Error setting up docs', error)
      })
  )
  .start()

skypager.clients.register('app', () => AppClient)

skypager.appClient = skypager.client('app')
skypager.appClient.client.defaults.headers.common = {
  'Content-Type': 'application/json'
}

global.runtime = skypager

export default skypager

async function setupDocs() {
  try {
    skypager.use(mdxDocs)
    skypager.mdxDocs.register('README', () => require('./README.md'))
    skypager.setState({ docsLoaded: true })
  } catch(error) {
    console.error('Error in docs setup')
  }
}
