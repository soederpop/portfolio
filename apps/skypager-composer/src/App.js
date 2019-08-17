import React, { Component } from 'react'
import types from 'prop-types'
import { Route, Switch, Router } from 'react-router-dom'
import runtime from './runtime'
import DocPage from './components/DocPage'
import HomePage from './pages/Home'
import BrowseFrameworkPage from './pages/BrowseFramework'
import SettingsPage from './pages/Settings'
import DataSourcesPage from './pages/DataSources'
import FrameworksPage from './pages/Frameworks'
import SitesPage from './pages/Sites'
import SitePage from './pages/Site'
import PagePage from './pages/Page'

import './App.css'

export default class DocsApp extends Component {
  static propTypes = {
    runtime: types.object,
  }

  static childContextTypes = {
    runtime: types.object,
  }

  static defaultProps = {
    runtime,
  }

  getChildContext() {
    return { runtime: this.props.runtime }
  }

  render() {
    const { runtime } = this.props
    const { docsLoaded } = runtime.currentState

    if (!docsLoaded) {
      return <div />
    }

    return (
      <Router history={runtime.history}>
        <Switch>
          <Route path="/" exact component={HomePage} />
          <Route path="/sites" exact component={SitesPage} />
          <Route path="/sites/:siteId*" exact component={SitePage} />
          <Route path="/pages/:siteId/:pageId" exact component={PagePage} />
          <Route path="/frameworks" exact component={FrameworksPage} />
          <Route path="/data-sources" exact component={DataSourcesPage} />
          <Route path="/settings" exact component={SettingsPage} />
          <Route path="/frameworks/:frameworkId" exact component={BrowseFrameworkPage} />
          <Route path="/docs/:docId*" component={DocPage} />  />
        </Switch>
      </Router>
    )
  }
}
