import React from 'react'
import { Message } from 'semantic-ui-react'


export const BasicErrorMessage = () => {
    return (
        <Message warning>
            <Message.Header>Something went wrong</Message.Header>
            <p>Restart the page, then try again.</p>
        </Message>
    )
}