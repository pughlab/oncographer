import React, { useCallback } from 'react'
import { Divider, List, Segment, Button, Modal } from 'semantic-ui-react'
import { useDropzone, FileWithPath } from 'react-dropzone'
import { gql, useQuery } from '@apollo/client'
import useMinioUploadMutation from '../../../hooks/useMinioUploadMutation'
import SegmentPlaceholder from '../SegmentPlaceholder'


function MinioUploadModal({ bucketName }: Readonly<{bucketName: any}>) {
    const { mutation: uploadMutation } = useMinioUploadMutation()
    const onDrop = useCallback((files: FileWithPath[]) => {
        uploadMutation({
            variables: {
                bucketName: bucketName,
                file: files[0]
            }
        })
    }, [])
    const { getRootProps, getInputProps } = useDropzone({ onDrop })
    return (
        <Modal
            trigger={<Button fluid icon='upload' />}
        >
            <Modal.Content>
                <SegmentPlaceholder text='Click to upload a file' icon='upload'>
                    <div {...getRootProps()}>
                        <Button>
                            Upload a file{' '}
                            <input {...getInputProps()} />
                        </Button>
                    </div>
                </SegmentPlaceholder>
            </Modal.Content>
        </Modal>
    )
}

export default function MinioBucket({ bucketName }: Readonly<{bucketName: any}>) {
    const { data } = useQuery(gql`
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
                    {minioUploads.map((minioUpload: any) => (
                        <List.Item
                            key={minioUpload.filename}
                            content={minioUpload.filename}
                            description={minioUpload.objectName}
                        />
                    ))}
                </List>
            }
        </Segment>
    )
}