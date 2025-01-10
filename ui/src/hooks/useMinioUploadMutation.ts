import { gql, useMutation } from "@apollo/client";
import { useReducer } from "react"

interface UploadState {
    file?: any;
    minioUpload?: any // should use type
    isLoading: boolean;
    error?: string;
}

type UploadAction =
    | { type: 'SET_FILE', file: any }
    | { type: 'SET_MINIO_UPLOAD', minioUpload: any }

const reducer = (state: UploadState, action: UploadAction): UploadState => {
    switch (action.type) {
        case 'SET_FILE':
            return {...state, file: action.file}
        case 'SET_MINIO_UPLOAD':
            return {...state, minioUpload: action.minioUpload}
        default:
            return state
    }
}
const initialState = {
    file: undefined,
    minioUpload: undefined,
    isLoading: false,
    error: undefined
}

export default function useMinioUploadMutation() {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [minioUpload] = useMutation(gql`
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
            if (data) {
                dispatch({type: 'SET_MINIO_UPLOAD', minioUpload: data.minioUpload})
            }
        }
    })
    

    return {state, dispatch, mutation: minioUpload}
    
}
