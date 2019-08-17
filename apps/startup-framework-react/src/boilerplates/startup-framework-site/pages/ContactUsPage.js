
import React, { Fragment } from 'react'

import Header8 from '../../../blocks/headers/Header8'
import Content8 from '../../../blocks/contents/Content8'
import Content23 from '../../../blocks/contents/Content23'
import Contact4 from '../../../blocks/contacts/Contact4'
import Navigation5 from '../../../blocks/navigations/Navigation5'
import Footer12 from '../../../blocks/footers/Footer12'

export const path = '/contact-us'

export const exact = true

export default function ContactUsPage(props = {}) {
  return (
    <Fragment>
      <Header8 />
      <Content8 />
      <Content23 />
      <Contact4 />
      <Navigation5 />
      <Footer12 />
    </Fragment>
  )
} 
  