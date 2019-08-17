import React, { Component } from 'react'
import { Divider, Button, Grid, Icon, Segment, Header, Container } from 'semantic-ui-react'
import types from 'prop-types'
import { Link } from 'react-router-dom'

export const path = "/frameworks"

export default class FrameworksPage extends Component {
  static contextTypes = {
    runtime: types.object
  }

  static propTypes = {
    
  }

  state = {
    loading: false,
    frameworks: {}
  }

  async componentDidMount() {
    const { runtime } = this.context
    this.setState({ loading: true })
    const frameworks = await runtime.select('frameworks')
    this.setState({ frameworks })
    this.setState({ loading: false })
  }

  titleize = (str) => {
    const { runtime } = this.context
    const { titleize, humanize } = runtime.stringUtils
    return titleize(humanize(str)).replace(/-/g, ' ')
  }

  render() {
    const loading = this.state.loading
    const frameworks = Object.values(this.state.frameworks || {})

    return (
      <Container style={{ paddingTop: '24px' }}>
        {!loading && frameworks.map((framework) => 
          <Segment raised key={framework.name}>
            <Container as={framework.Component} />
            <Divider />
            <Button as={Link} to={`/${framework.name}`} content="Browse Framework" secondary />
          </Segment>)
        }        
      </Container>
    )
  }
}