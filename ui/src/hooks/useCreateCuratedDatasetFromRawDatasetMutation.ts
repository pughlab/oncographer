import { gql, useMutation } from "@apollo/client";
import { useReducer, useCallback, useState } from "react"

export default function useCreateCuratedDatasetFromRawDatasetMutation(): [any, any, boolean] {
    const [success, setSuccess] = useState(false)
    const [createCuratedDatasetFromRawDataset, mutationState] = useMutation(gql`
        mutation createCuratedDatasetFromRawDataset(
            $name: String!
            $description: String!
            $rawDatasetID: ID!
        ) {
            createCuratedDatasetFromRawDataset(
                name: $name
                description: $description
                rawDatasetID: $rawDatasetID
            )
        }
    `, {
        onCompleted: (data) => {
            console.log(data)
            if (!!data) {
                console.log(data)
                setSuccess(!!data?.createCuratedDatasetFromRawDataset)
            }
        }
    })
    const {loading, data, error} = mutationState
    

    return [createCuratedDatasetFromRawDataset, mutationState, success]
    
}
  
  