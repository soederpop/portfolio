import React, { Fragment, Component } from 'react'
import { Grid, Button, Image, Divider, Dropdown, Header, Segment  } from 'semantic-ui-react'
import types from 'prop-types'
import { Link } from 'react-router-dom'
import Block from '../components/PaletteItem'

export default class BlockSelector extends Component {
  static contextTypes = {
    runtime: types.object
  }

  state = {
    blocks: {},
    group: this.props.defaultGroup 
  }

  async componentDidMount() {
    const { runtime } = this.context
    const { frameworkId } = this.props
    const blocks = await runtime.select('blocks', { frameworkId })

    if (this._isMounted !== false) {
      this.setState({ blocks })
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  titleize = (str) => {
    const { runtime } = this.context
    const { titleize, humanize } = runtime.stringUtils
    return titleize(humanize(str)).replace(/-/g, ' ')
  }

  previewImageUrl = (item) => {
    const { frameworkId } = this.props
    return `/preview/${item.replace(`${frameworkId}/`,'').replace(/\/[a-z]+/i,'/')}.png`
  }

  render() {
    const { segment = { basic: true }, frameworkId } = this.props
    const { group, blocks = {} } = this.state
    const groups = Object.keys(blocks)
    const selectedBlocks = group 
      ? blocks[group] || []
      : []

    return (
      <Segment basic {...segment} style={{ height: '100%', width: '100%' }}>
        <Grid style={{ padding: 0, margin: 0 }}>
          <Grid.Column width={10}>
            <Dropdown 
              fluid
              options={groups.map((key) => ({ key, text: key, value: key }))}
              selection
              value={group}
              onChange={(e, { value }) => this.setState({ group: value })}
            />
          </Grid.Column>
          <Grid.Column width={6}>
            <Button as={Link} to={`/frameworks/${frameworkId}`} size="small" fluid basic inverted content="All" />
          </Grid.Column>
        </Grid>
        {!group && <Header as="h4" inverted content="Select a block category" />}
        {group && <Divider /> }
        <div style={{ maxHeight: '700px', height: '80%', overflowY: 'scroll' }}>
          {selectedBlocks.map((block) => 
            <Block key={block} name={block.replace(`${frameworkId}/`, '')}>
              <div style={{ padding: '12px 0px'}}>
                <Image src={this.previewImageUrl(block)} fluid />
              </div>
            </Block>)}
        </div> 
      </Segment>
    )
  }
}