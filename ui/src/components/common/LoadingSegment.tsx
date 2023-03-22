import React from 'react'
import { Segment, Image } from 'semantic-ui-react'
import logo from '../logos/logo.png'

export const LoadingSegment = () => {
    return (
        <Segment loading style={{ height: "100%" }}>
            <Image src={logo} centered size="medium" />
        </Segment>
    )
}