import React from 'react'
import { Image, Message, Segment } from 'semantic-ui-react'
import logo from '../logos/logo.png'

export const WelcomeMessage = () => {
    return (
        <Segment color={'teal'}>
        <Message >
            <Message.Header>Welcome to mCODER2!</Message.Header>
            <p>Enter a Donor ID in the search form above or select a form on the left menu to begin abstracting.</p>
        </Message>

        <Image src={logo} size={'large'} centered />

        </Segment>
    )
}