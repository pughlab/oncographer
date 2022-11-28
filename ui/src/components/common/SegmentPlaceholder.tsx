import React from 'react'
import { Container, Header, Icon, Segment } from 'semantic-ui-react'
export default function SegmentPlaceholder ({text='', icon='exclamation', children}:  {text: string | Element, icon: string, buttons?: [Element]}) {
    return (
        <Segment placeholder>
          <Header icon>
            <Icon name={icon} />
              {text}
          </Header>
          {children}
        </Segment>
    )
}

export function ContainerSegmentPlaceholder(props) {
  return (
    <Container>
      <SegmentPlaceholder {...props} />
    </Container>
  )
}