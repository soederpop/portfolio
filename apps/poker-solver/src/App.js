import React, { Component } from 'react'
import types from 'prop-types'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'
import GamePage from './pages/GamePage'
import GamesPage from './pages/GamesPage'
import RangesPage from './pages/RangesPage'
import api from './client'
import RangeCalculator from './components/RangeCalculator'
import FlopBrowser from './components/FlopBrowser'

import './App.css'

export const apiType = types.shape({
  action: types.func,
  searchFlops: types.func,
  searchFlops: types.func,
})

export class App extends Component { 
  static childContextTypes = {
    runtime: types.object,
    api: apiType,
    workspace: types.object
  }

  static propTypes = {
    runtime: types.object
  }
 
  state = {
    activeTool: undefined
  }

  getChildContext() {
    return { 
      runtime: this.props.runtime,
      api,
      workspace: this.props.runtime.workspace
    }
  }

  toggleFlopBrowser = () => {
    const { activeTool } = this.state
    const { runtime } = this.props

    const showDrawer = () => { runtime.workspace.toggleDrawer('right', !!this.state.activeTool) }

    if (activeTool !== 'flopBrowser') {
      this.setState({ activeTool: 'flopBrowser' }, showDrawer)
    } else if (activeTool === 'flopBrowser') {
      this.setState({ activeTool: undefined }, showDrawer)
    }
  }

  toggleRangeCalculator = () => {
    const { activeTool } = this.state
    const { runtime } = this.props

    const showDrawer = () => { runtime.workspace.toggleDrawer('right', !!this.state.activeTool) }

    if (activeTool !== 'rangeCalculator') {
      this.setState({ activeTool: 'rangeCalculator' }, showDrawer)
    } else if (activeTool === 'rangeCalculator') {
      this.setState({ activeTool: undefined }, showDrawer)
    }
  }

  componentDidMount() {
    const { runtime } = this.props
    const { keybindings } = runtime

    this.disposer = runtime.state.observe(({ name, newValue }) => {
      if (name === 'activeTool') {
        this.setState({ activeTool: newValue })
      }
    })

    keybindings.bind('g f', this.toggleFlopBrowser)
    keybindings.bind('g r', this.toggleRangeCalculator)

    this.unbindKeys = () => {
      keybindings.unbind('g f', this.toggleFlopBrowser)
      keybindings.unbind('g r', this.toggleRangeCalculator)
    }
  }

  componentWillUnmount() {
    this.disposer()
  }
  
  render() {
    const { activeTool } = this.state
    const { runtime } = this.props
    const { DrawerLayout, Drawer: Controller } = runtime.workspace 

    const Drawer = (props) => 
      <Controller {...props}>
        <Segment basic inverted fluid style={{ height: '100%'}}>
          {props.children}  
        </Segment>
      </Controller>

    return (
      <BrowserRouter>
        <DrawerLayout>
          <Switch>
            <Route path="/" exact component={GamesPage} /> 
            <Route path="/ranges" exact component={RangesPage} />
            <Route path="/games/:gameId" exact component={GamePage} /> 
          </Switch>
          {activeTool === 'flopBrowser' && <Drawer drawerId="right"><FlopBrowser /></Drawer>}
          {activeTool === 'rangeCalculator' && <Drawer drawerId="right"><RangeCalculator /></Drawer>}
        </DrawerLayout>
      </BrowserRouter>
    )
  }
}

export default App