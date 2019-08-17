import React, { Component } from 'react'
import { Grid, Icon, Segment, Tab, Image, Header, Container } from 'semantic-ui-react'
import types from 'prop-types'
import { Link } from 'react-router-dom'
import DrawerLayout from '../components/DrawerLayout'
import Drawer from '../components/Drawer'
import DocPage from '../components/DocPage'

export const path = "/frameworks/:frameworkId"

export default class BrowseFrameworkPage extends Component {
  static contextTypes = {
    runtime: types.object
  }

  static propTypes = {
    match: types.shape({
      params: types.shape({
        frameworkId: types.string.isRequired
      })
    })  
  }

  state = {
    blocks: {},
    selectedBlock: undefined
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { keybindings, workspace } = runtime 
    const { frameworkId } = this.props.match.params
    const blocks = await runtime.select('blocks', { frameworkId })
    this.setState({ blocks })

    keybindings.bind('esc', () => {
      this.setState({ selectedBlock: undefined }, () => workspace.toggleDrawer('right', false))
    })
  }

  componentWillUnmount() {
    const { runtime } = this.context
    const { keybindings } = runtime 
    keybindings.unbind('esc')
  }

  titleize = (str) => {
    const { runtime } = this.context
    const { titleize, humanize } = runtime.stringUtils
    return titleize(humanize(str)).replace(/-/g, ' ')
  }

  handleSelectBlock = (selectedBlock) => {
    const { runtime } = this.context
    
    this.setState({ selectedBlock }, () => runtime.workspace.toggleDrawer('right'))
  }

  render() {
    const { runtime } = this.context
    const { frameworkId } = this.props.match.params
    const { selectedBlock, blocks = {} } = this.state

    const framework = runtime.mdxDoc(`frameworks/${frameworkId}`)
    const groups = Object.keys(blocks)
    const panes = groups.map((group) => { 
          const set = blocks[group]
          return {
            menuItem: this.titleize(group),
            render: () => (
              <Container key={group}>
                <Header as="h3" dividing content={this.titleize(group)} />
                <Image.Group size="medium">
                  {set.map((item) => <Image onClick={() => this.handleSelectBlock(item)} key={item} centered verticalAlign="top" src={`/preview/${item.replace('startup/','').replace(/\/[a-z]+/i,'/')}.png`} bordered /> )}
                </Image.Group>
              </Container>
            )
          }
        })

    return (
      <DrawerLayout>
        {selectedBlock && <Drawer drawerId="right">
          <Segment fluid style={{ height: '100%' }}>
            <DocPage docId={selectedBlock} />
          </Segment>
        </Drawer>}
        <Container fluid style={{ padding: '24px', height: '100%' }}>
          <Grid>
            <Grid.Column width={14}>
              <Header fluid as="h1" content={`Browse ${framework.title}`} />
            </Grid.Column>
            <Grid.Column width={2}>
              <Link to="/"><Icon large circular name="home" /></Link>
            </Grid.Column>
          </Grid>
          <Container fluid>
            <Tab menu={{ fluid: true, vertical: true, tabular: true }} panes={panes} />
          </Container>
        </Container>
      </DrawerLayout>
    )
  }
}