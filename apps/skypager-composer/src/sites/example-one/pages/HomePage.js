
import React, { Fragment } from 'react'

import Header1 from '../../../blocks/headers/Header1'
import Contact2 from '../../../blocks/contacts/Contact2'
import Footer2 from '../../../blocks/footers/Footer2'

export const path = '/'

export const exact = true

export default function HomePage(props = {}) {
  return (
    <Fragment>
      <Header1 />
      <Contact2 />
      <Footer2 />
    </Fragment>
  )
} 
  