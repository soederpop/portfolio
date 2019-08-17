import React, { Component } from 'react'
import types from 'prop-types'
import { StaticRouter, BrowserRouter } from 'react-router-dom'

function withStatus(status, Component) {
  return ({ staticContext, ...props }) => {
    if (staticContext) {
      staticContext.status = status
    }

    return <Component {...props} />
  }
}

export default class App extends Component {
  static propTypes = {
    runtime: types.object,
    staticRouter: types.bool,
  }

  static childContextTypes = {
    runtime: types.object,
  }

  static defaultProps = {
    staticRouter: false,
  }

  getChildContext() {
    return {
      runtime: this.props.runtime,
    }
  }

  render() {
    const { staticRouter, routerProps } = this.props
    const Router = staticRouter ? StaticRouter : BrowserRouter

    const ctx = staticRouter ? routerProps : {}

    return <Router {...ctx}>{this.props.children}</Router>
  }
}
