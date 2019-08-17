
import React, { Fragment } from 'react'

import Header4 from '../../../blocks/headers/Header4'
import Team1 from '../../../blocks/teams/Team1'
import Footer5 from '../../../blocks/footers/Footer5'

export const path = '/our-team'

export const exact = true

export default function OurTeamPage(props = {}) {
  return (
    <Fragment>
      <Header4 />
      <Team1 />
      <Team1 />
      <Team1 />
      <Footer5 />
    </Fragment>
  )
} 
  