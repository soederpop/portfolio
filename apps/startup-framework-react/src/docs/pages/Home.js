import React from 'react'
import { Grid, Icon, Segment, Header, Container } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

export const path = '/'

export default function HomePage() {
  return (
    <Container style={{ paddingTop: '24px' }}>
      <Header as="h1" dividing content="Home" />
      <Grid columns="three" doubling stackable>
        <Grid.Column>
          <Segment>
            <Header as={Link} to="/frameworks">
              <Icon name="lab" />
              <Header.Content>Frameworks</Header.Content>
            </Header>
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Segment>
            <Header as={Link} to="/sites">
              <Icon name="cloud" />
              <Header.Content>Sites</Header.Content>
            </Header>
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Segment>
            <Header as={Link} to="/data-sources">
              <Icon name="database" />
              <Header.Content>Data Sources</Header.Content>
            </Header>
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Segment>
            <Header as={Link} to="/settings">
              <Icon name="cogs" />
              <Header.Content>Settings</Header.Content>
            </Header>
          </Segment>
        </Grid.Column>
      </Grid>
    </Container>
  )
}
