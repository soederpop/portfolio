import React from 'react'
import types from 'prop-types'
import ActiveDocument from './ActiveDocument'

export default function DocPage(props = {}, context = {}) {
  const { runtime } = context
  const { docId  = props.match && props.match.params.docId } = props

  const isAvailable = !!runtime.mdxDocs.checkKey(docId) 

  if (!isAvailable) {
    return (
      <div>
        <h1>Not Found {docId}</h1>  
      </div>
    )
  }

  return <ActiveDocument docId={docId} />
}

DocPage.propTypes = {
  docId: types.string
}

DocPage.contextTypes = {
  runtime: types.shape({
    mdxDoc: types.func,
    mdxDocs: types.shape({
      checkKey: types.func
    })
  })
}