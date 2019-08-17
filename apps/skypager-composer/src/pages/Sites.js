import React, { Component } from 'react'
import { Grid, Icon, Segment, Header, Container } from 'semantic-ui-react'
import types from 'prop-types'
import { Link } from 'react-router-dom'

export const path = "/sites"

export default class SitesPage extends Component {
  static contextTypes = {
    runtime: types.object
  }

  static propTypes = {
    
  }

  state = {
    sites: []
  }

  async componentDidMount() {
    const { runtime } = this.context
    const sites = await runtime.selectChain('sites').then(c => c.values().value())
    this.setState({ sites })
  }

  titleize = (str) => {
    const { runtime } = this.context
    const { titleize, humanize } = runtime.stringUtils
    return titleize(humanize(str)).replace(/-/g, ' ')
  }

  render() {
    const { sites = [] } = this.state

    return (
      <Container style={{ paddingTop: '24px' }}>
        <Grid>
          <Grid.Column width={14}>
            <Header fluid as="h1" content={`My Sites`} />
          </Grid.Column>
          <Grid.Column width={2}>
            <Link to="/"><Icon large circular name="home" /></Link>
          </Grid.Column>
        </Grid>        
        {sites.map((site) => <Segment key={site}><Link to={`/sites/${site.siteId}`}>{site.name}</Link></Segment>)}        
      </Container>
    )
  }
}