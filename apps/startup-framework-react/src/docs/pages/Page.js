import React, { Component } from 'react'
import { Menu, Icon, Grid, Button, Image, Container } from 'semantic-ui-react'
import types from 'prop-types'
import PageCanvas from '../components/PageCanvas'
import { DndProvider } from 'react-dnd'
import { Link } from 'react-router-dom'
import Html5Backend from 'react-dnd-html5-backend'
import BlockSelector from '../components/BlockSelector'

export const path = "/pages/:siteId/:pageId"

function BlockControls(props = {}) {
  const { name, handleSave, blocks } = props

  const moveUp = () => {
    const currentIndex = blocks.indexOf(name)
    console.log('before moing up', blocks, currentIndex)
    const me = blocks[currentIndex]
    if (currentIndex !== 0) {
      blocks.splice(currentIndex, 1)
      blocks.splice(currentIndex - 1, 0, me)
    }

    console.log('after moing up', blocks)
    return handleSave(blocks)
  }

  const moveDown = () => {
    const currentIndex = blocks.indexOf(name)
    console.log('before moing down', blocks, currentIndex)
    const me = blocks[currentIndex]
    if (currentIndex !== blocks.length - 1) {
      blocks.splice(currentIndex, 1)
      blocks.splice(currentIndex + 1, 0, me)
    }
    
    console.log('moing down', blocks)
    return handleSave(blocks)
  }

  return (
    <div style={{ position: 'absolute', top: '20%', right: '0px' }}>
      <Button.Group vertical>
        <Button icon="chevron up" onClick={moveUp} />  
        <Button icon="edit" />
        <Button icon="chevron down" onClick={moveDown} />  
      </Button.Group>
    </div>
  )
}

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
    page: {},
    dragging: false,
    blocks: []
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { pageId, siteId } = this.props.match.params

    try {
      this.setState({ loading: true })
      const { page, site } = await runtime.select('pages', { siteId, pageId })
      this.setState({ site, page, blocks: page.blocks || [], blocksHash: runtime.hashObject(page.blocks || []) })
    } catch(error) {
      this.setState({ error })
    } finally {
      this.setState({ loading: false })
    }

    this.handleCanvasUpdate = runtime.lodash.debounce(this.handleUpdate, 1000)
    this.handleBlockUpdate = runtime.lodash.debounce((newItems) => {
      console.log('handling block update', newItems)
      this.setState({ blocks: newItems.map(i => i.name || i)})
    }, 1000)
  }

  componentWillUnmount() {
    this.handleCanvasUpdate.cancel()
  }

  titleize = (str) => {
    const { runtime } = this.context
    const { titleize, humanize } = runtime.stringUtils
    return titleize(humanize(str)).replace(/-/g, ' ')
  }

  handleUpdate = async () => { 
    const { runtime } = this.context

    console.log('Sending Update', {
      blocks: this.state.blocks,
      ...this.props.match.params
    })

    const result = await runtime.appClient.updatePage({
      blocks: this.state.blocks,
      ...this.props.match.params
    })

    return result
  }

  handleCanvasUpdate = (newItems = []) => {
    const { runtime } = this.context
    const { blocksHash } = this.state
    
    const blocks = newItems.map(({ name }) => name)
    const nextHash = runtime.hashObject(blocks)

    console.log('Handling Canvas Update', newItems, blocks, nextHash, blocksHash, blocks)

    if (blocksHash === nextHash) {
      return this.state.blocks
    }

    console.log('handling canvas update', blocks)

    this.setState({
      blocks,
      blocksHash: nextHash
    }, this.handleUpdate)

    return blocks
  }

  renderItem = (props) => { 
    const { dragging, draggingIndex } = this.state
    const { controls } = props

    const style = {}
    
    if (dragging && draggingIndex === props.index) {

    }

    if (dragging && draggingIndex !== props.index) {
    }

    const imageUrl = props.name && `/preview/${props.name.replace(
      '/' +
        props.name
          .split('/')
          .pop()
          .replace(/\d/g, ''),
      '/'
    )}.png`

    return (
      <div key={props.index} style={{ position: 'relative', ...style }}>
        <div key={props.index} style={{ position: 'relative', margin: '0px auto', maxHeight: '400px', maxWidth: '600px',  }}>
          {imageUrl && <Image src={imageUrl} fluid />}
        </div>
        {controls}
      </div>
    )
  } 

  render() {
    const { siteId } = this.props.match.params
    const { blocks = [], dragging, loading, site = {}, page = {} } = this.state
    return (
      <DndProvider backend={Html5Backend}>
        <Menu fixed='top' inverted>
          <Menu.Item as={Link} to={`/sites/${siteId}`}>
            <Icon name="home" />  
          </Menu.Item>
          <Menu.Menu position="right">
            <Menu.Item>
              <Icon name="disk" onClick={this.handleUpdate} />  
            </Menu.Item>
          </Menu.Menu>
        </Menu>
        <Grid style={{ width: '100%', height: '100%' }}>
          <Grid.Column width={3} stretched>
            {!loading && <BlockSelector 
              frameworkId="startup" 
              segment={{ inverted: true }} 
              defaultGroup='contents'
            />}
          </Grid.Column>
          <Grid.Column width={13}>
            {!loading && <PageCanvas 
              handleSave={(items) => this.handleCanvasUpdate(items)}
              items={blocks.map((name,order) => ({ order, name }))} 
              onDrag={({ index }) => this.setState({ dragging: true, draggingIndex: index })}
              onDragStop={() => this.setState({ dragging: false, draggingIndex: undefined })}
              onUpdate={this.handleBlockUpdate || (() => {})}              
              controls={BlockControls}
              renderItem={this.renderItem}
            />}
          </Grid.Column>
        </Grid>
      </DndProvider>
    )

  }

}