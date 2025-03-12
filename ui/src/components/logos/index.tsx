import * as React from 'react'

import logo from './logo.png'
import { Image, Container, Segment, Header, Divider } from 'semantic-ui-react'

export function Logo ({size='medium', ... props}: any) {
    return (
        <Image size={size} src={logo} {... props} />
    )
}

export function AboutPortal () {
    return (
      <Container>
        <Divider horizontal>
          <Header as='h1'>
            <Header.Content>
              Portal
              <Header.Subheader>Description</Header.Subheader>
            </Header.Content>
          </Header>
        </Divider>
        <Segment color='black' size='big'>
          <Divider horizontal>
            <Header as='h2' content='About Us' />
          </Divider>
        </Segment>
      </Container>
    )
  }