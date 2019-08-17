import '@babel/polyfill/noConflict'
import React from 'react'
import DocsApp from './App'
import { render } from 'react-dom'

window.React = React

render(<DocsApp runtime={require('./runtime').default} />, document.getElementById('root'))