import { gql, useMutation } from "@apollo/client";
import { useReducer, useCallback } from "react"

import {useDropzone} from 'react-dropzone'

interface UploadState {
    file?: any;
    minioUpload?: any // should use type
    isLoading: boolean;
    error?: string;
}

type UploadAction =
 | { type: 'SET_FILE', file: any }
 | { type: 'SET_MINIO_UPLOAD', minioUpload: any }
//  | { type: 'failure', error: string };

const reducer = (state: UploadState, action: UploadAction): UploadState => {
    switch (action.type) {
        case 'SET_FILE':
            return {...state, file: action.file}
        case 'SET_MINIO_UPLOAD':
            return {...state, minioUpload: action.minioUpload}
    }
    return state
}
const initialState = {
    file: undefined,
    minioUpload: undefined,
    isLoading: false,
    error: undefined
}

export default function useMinioUploadMutation() {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [minioUpload, {loading, error, data}] = useMutation(gql`
        mutation minioUpload(
            $bucketName: String!
            $file: Upload!
        ) {
            minioUpload(
                bucketName: $bucketName
                file: $file
            ) {
                bucketName
                objectName
                filename
            }
        }
    `, {
        onCompleted: (data) => {
            if (!!data) {
                console.log(data)
                dispatch({type: 'SET_MINIO_UPLOAD', minioUpload: data.minioUpload})
            }
        }
    })
    

    return {state, dispatch, mutation: minioUpload}
    
}
  
  