import React from 'react'
import { Image, Message, Segment } from 'semantic-ui-react'
import logo from '../logos/logo.png'

export const WelcomeMessage = ({ withRoles }: { withRoles: boolean }) => {
    return (
        <Segment color={'teal'}>
        <Message positive={withRoles} warning={!withRoles}>
            <Message.Header>Welcome to OncoGrapher!</Message.Header>
            {
                withRoles ? <p>Enter a patient's information in the search form above to begin abstracting.</p>
                : <p>Currently, you do not have any roles assigned. Please ask the administrators to provide you with a role.</p>
            }
        </Message>

        <Image src={logo} size={'large'} centered />

        </Segment>
    )
}