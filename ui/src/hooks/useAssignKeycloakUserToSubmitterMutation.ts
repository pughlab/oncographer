import { gql, useMutation } from "@apollo/client";
import { useReducer, useCallback, useState, useEffect } from "react"

export default function useAssignKeycloakUserToSubmitterMutation(): [any] {
    const [assignKeycloakUserToSubmitterMutation, mutationState] = useMutation(gql`
        mutation AssignKeycloakUserToSubmitter($uuid: ID!) {
            assignKeycloakUserToSubmitter(uuid: $uuid) {
                keycloakUserID
            }
        }
    `, {
        onCompleted: (data) => {
            console.log(data)
        }
    })
    const {loading, data, error} = mutationState
    useEffect(() => {assignKeycloakUserToSubmitterMutation()}, [])
    // console.log(mutationState)

    return [mutationState]
}