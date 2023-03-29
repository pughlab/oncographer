import React from 'react'
import { Image, Message } from 'semantic-ui-react'
import logo from '../logos/logo.png'

export const WelcomeMessage = () => {
    return (
        <Message color={'teal'}>
            <Message.Header>Welcome to mCODER2!</Message.Header>
            <p>Type a donor's ID in the search form or select a form on the left menu to start.</p>
            <Image fluid src={logo} size={'medium'} centered />
        </Message>
    )
}