import React, { Component } from 'react'
import { Grid, Icon, Segment, Header, Container } from 'semantic-ui-react'
import types from 'prop-types'

export const path = "/data-sources"

export default class DataSourcesPage extends Component {
  static contextTypes = {
    runtime: types.object
  }

  static propTypes = {
    
  }

  state = {
    dataSources: {}
  }

  async componentDidMount() {
    const { runtime } = this.context
    const dataSources = await runtime.select('dataSources')
    this.setState({ dataSources })
  }

  titleize = (str) => {
    const { runtime } = this.context
    const { titleize, humanize } = runtime.stringUtils
    return titleize(humanize(str)).replace(/-/g, ' ')
  }

  render() {
    return <Container />
  }
}