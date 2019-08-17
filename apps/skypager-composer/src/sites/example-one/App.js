import React, { Component } from 'react'
import Website from '../../components/Website'
import routes from './routes'

export default class ExampleOneApp extends Component {
  state = {}

  render() {
    return (
      <Website {...this.props}>
        {routes({ app: this })}
      </Website>
    )
  }
}
