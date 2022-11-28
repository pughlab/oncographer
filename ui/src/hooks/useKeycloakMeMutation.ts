import { gql, useMutation } from "@apollo/client";
import { useReducer, useCallback, useState, useEffect } from "react"
import { useAppDispatch } from "../state/hooks";
import { setKeycloakMe } from "../state/appContext";

export default function useKeycloakMeMutation(): [any] {
    const dispatch = useAppDispatch()

    const [meMutation, mutationState] = useMutation(gql`
        mutation CheckinKeycloakMe {
            me {
                keycloakUserID
                name
                email
            }
        }
    `, {
        onCompleted: (data) => {
            console.log(data)
            if (!!data) {
                dispatch(setKeycloakMe({keycloakMe: data?.me}))
            }
        }
    })
    const {loading, data, error} = mutationState
    useEffect(() => {meMutation()}, [])
    // console.log(mutationState)

    return [mutationState]
    
}
  
  