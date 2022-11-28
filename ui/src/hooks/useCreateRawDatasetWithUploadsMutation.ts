import { gql, useMutation } from "@apollo/client";
import { useReducer, useCallback, useState } from "react"

export default function useCreateRawDatasetWithUploadsMutation(): [any, any, boolean] {
    const [success, setSuccess] = useState(false)
    const [createRawDatasetWithUploads, mutationState] = useMutation(gql`
        mutation createRawDatasetWithUploads(
            $name: String!
            $description: String!
            $rawDataFile: Upload!
            $codebookFile: Upload!
        ) {
            createRawDatasetWithUploads(
                name: $name
                description: $description
                rawDataFile: $rawDataFile
                codebookFile: $codebookFile
            )
        }
    `, {
        onCompleted: (data) => {
            console.log(data)
            if (!!data) {
                console.log(data)
                setSuccess(!!data?.createRawDatasetWithUploads)
            }
        }
    })
    const {loading, data, error} = mutationState
    

    return [createRawDatasetWithUploads, mutationState, success]
    
}
  
  