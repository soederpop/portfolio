import React, { Fragment, Component } from 'react'
import { Grid, Divider, Loader, Button, Tab, Image, Header, Container } from 'semantic-ui-react'
import types from 'prop-types'
import { Link } from 'react-router-dom'

export const path = "/sites/:siteId"

export default class SitePage extends Component {
  static contextTypes = {
    runtime: types.object
  }

  static propTypes = {
    match: types.shape({
      params: types.shape({
        siteId: types.string.isRequired
      })
    })  
  }

  state = {
    site: {}
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { siteId } = this.props.match.params

    try {
      this.setState({ loading: true })
      const site = await runtime.select('sites', { siteId })
      console.log('site', site)
      this.setState({ site })
    } catch(error) {
      this.setState({ error })
    } finally {
      this.setState({ loading: false })
    }
  }

  titleize = (str) => {
    const { runtime } = this.context
    const { titleize, humanize } = runtime.stringUtils
    return titleize(humanize(str)).replace(/-/g, ' ')
  }

  handleAddPage = async (e) => { }
  handlePublish = async (e) => { }
  handleOpenWebsite = async (e) => { }

  render() {
    const { siteId } = this.props.match.params
    const { loading, site = {} } = this.state
    const { pagesConfig = [], availablePages = [], manifest = {} } = site
    const { name, description, homepage } = manifest

    return (
      <Container style={{ paddingTop: '24px' }}>
        {loading && <Loader active />}        
        {!loading && (
          <Fragment>
            <Header>
              <Header.Content>
                {name}
              </Header.Content>
              <Button.Group floated="right">
                <Button content="Open Website" onClick={this.handleOpenWebsite} />
                <Button content="Add Page" onClick={this.handleAddPage} />
                <Button content="Publish" onClick={this.handlePublish} />
              </Button.Group>              
            </Header>
            <Divider />
            <Grid columns="two">
              <Grid.Column>
                <Header as="h2" content="Sitemap" />  
                {pagesConfig.map(({ name, path }) => <div key={path}>{path} => {name}</div>)}
              </Grid.Column>
              <Grid.Column>
                <Header as="h2" content="Available Pages" />  
                {availablePages.map((page) => <div key={page}><Link to={`/pages/${siteId}/${page}`}>{page}</Link></div>)}
              </Grid.Column>
            </Grid>
          </Fragment>
        )}
      </Container>
    )

  }

}