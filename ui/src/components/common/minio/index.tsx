import React, { useCallback } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'
import { Message, Divider, Container, Icon, List, Input, Segment, Form, Button, Modal } from 'semantic-ui-react'
import SegmentPlaceholder from '../SegmentPlaceholder'
import { useDropzone, FileWithPath } from 'react-dropzone'
import { gql, useQuery } from '@apollo/client'
import useMinioUploadMutation from '../../../hooks/useMinioUploadMutation'
import SegmentPlaceholder from '../SegmentPlaceholder'


function MinioUploadModal({ bucketName }) {
    const { state: uploadState, dispatch: uploadDispatch, mutation: uploadMutation } = useMinioUploadMutation()
    const onDrop = useCallback((files: FileWithPath[]) => {
        uploadMutation({
            variables: {
                bucketName: bucketName,
                file: files[0]
            }
        })
    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
    return (
        <Modal
            trigger={<Button fluid icon='upload' />}
        >
            <Modal.Content>
                <SegmentPlaceholder text='Click to upload a file' icon='upload'>
                    <div {...getRootProps()}>
                        <Button>
                            Upload a file
                            <input {...getInputProps()} />
                        </Button>
                    </div>
                </SegmentPlaceholder>
            </Modal.Content>
        </Modal>
    )
}

export default function MinioBucket({ bucketName }) {
    const { data, loading, error } = useQuery(gql`
        query MinioUploads($bucketName: ID!) {
            minioUploads(where: {bucketName: $bucketName}) {
                bucketName
                objectName
                filename
            }
        }`,
        { variables: { bucketName }, fetchPolicy: 'network-only' })
    if (!data?.minioUploads) {
        return null
    }
    const { minioUploads } = data
    return (
        <Segment>
            <MinioUploadModal bucketName={bucketName} />
            <Divider horizontal />
            {!minioUploads.length ? <SegmentPlaceholder text={'No uploads yet'} /> :
                <List celled divided>
                    {minioUploads.map(minioUpload => (
                        <List.Item
                            content={minioUpload.filename}
                            description={minioUpload.objectName}
                        />
                    ))}
                </List>
            }
        </Segment>
    )
}