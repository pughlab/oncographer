import React from 'react'
import { Container, Header, Icon, Segment, SemanticICONS } from 'semantic-ui-react'
export default function SegmentPlaceholder ({text='', icon='exclamation', children}:  Readonly<{text: string | Element, icon?: SemanticICONS, buttons?: [Element], children?: any}>) {
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

export function ContainerSegmentPlaceholder(props: any) {
  return (
    <Container>
      <SegmentPlaceholder {...props} />
    </Container>
  )
}