import React from 'react'
import { Switch, Route } from 'react-router-dom'

export const pagesContext = require.context('./pages', false, /Page\.js$/)

export const pages= () => pagesContext.keys().map(key => {
  const mod = pagesContext(key)
  return mod
})

export const routes = () => pagesContext.keys().map(key => {
  const mod = pagesContext(key)
  const routeProps = {
    ...!!mod.exact && { exact: true },
  }
  
  return (<Route key={key} component={mod.default} path={mod.path} {...routeProps} />)
})

export default function Router({ app }) {

  return (
    <Switch>
      {routes()}      
    </Switch>
  )
}