import React, { Fragment, Component } from 'react'
import { Segment, Grid, Divider, Loader, Button, Tab, Image, Header, Container } from 'semantic-ui-react'
import types from 'prop-types'
import PageCanvas from '../components/PageCanvas'

export const path = "/pages/:siteId/:pageId"

export default class PagePage extends Component {
  static contextTypes = {
    runtime: types.object
  }

  static propTypes = {
    match: types.shape({
      params: types.shape({
        siteId: types.string.isRequired,
        pageId: types.string.isRequired
      })
    })  
  }

  state = {
    site: {},
    page: {}
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { pageId, siteId } = this.props.match.params

    try {
      this.setState({ loading: true })
      const { page, site } = await runtime.select('pages', { siteId, pageId })
      console.log({ page, site })
      this.setState({ site, page })
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
    const { siteId, pageId } = this.props.match.params
    const { loading, site = {}, page = {} } = this.state
    const { blocks = [] } = page
    return (
      <Container style={{ paddingTop: '24px' }}>
        {loading && <Loader active />}        
        {!loading && (
          <Fragment>
            <Header>
              <Header.Content>
                {pageId}
              </Header.Content>
              <Button.Group floated="right">
                <Button content="Open Website" onClick={this.handleOpenWebsite} />
                <Button content="Edit" onClick={this.handleAddPage} />
              </Button.Group>              
            </Header>
            <PageCanvas 
              items={blocks.map(name => ({ name }))} 
              renderItem={(props) => <Segment key={props.index}>{props.name}</Segment>}
            />
          </Fragment>
        )}
      </Container>
    )

  }

}