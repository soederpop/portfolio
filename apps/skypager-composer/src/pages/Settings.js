import React, { Component } from 'react'
import { Grid, Icon, Segment, Header, Container } from 'semantic-ui-react'
import types from 'prop-types'

export const path = "/settings"

export default class SettingsPage extends Component {
  static contextTypes = {
    runtime: types.object
  }

  static propTypes = {
    
  }

  state = {
    settings: {}
  }

  async componentDidMount() {
    const { runtime } = this.context
    const settings = await runtime.select('settings')
    this.setState({ settings })
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