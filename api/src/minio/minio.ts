import dotenv from 'dotenv'
import { Client, BucketItem } from 'minio'

dotenv.config()

const MINIO_ROOT_USER = process.env.MINIO_ROOT_USER || 'DEFAULT_MINIO_ROOT_USER'
const MINIO_ROOT_PASSWORD = process.env.MINIO_ROOT_PASSWORD || 'DEFAULT_MINIO_ROOT_PASSWORD'
const MINIO_IP = process.env.MINIO_IP || 'DEFAULT_MINIO_IP'

console.log('MINIO_IP', MINIO_IP)

const minioConfig = {
  endPoint: MINIO_IP,
  port: 9000,
  useSSL: false,
  accessKey: MINIO_ROOT_USER,
  secretKey: MINIO_ROOT_PASSWORD
}

const minio = require('minio')

export const minioClient: Client = new minio.Client(minioConfig)
minioClient.setRequestOptions({rejectUnauthorized: false})

export const makeBucket = async (minioClient: Client, bucketName: string) => {
  try {
    if (! await minioClient.bucketExists(bucketName)) {
      console.log(`creating bucket ${bucketName}`)
      await minioClient.makeBucket(bucketName, 'us-east-1')
    }
  } catch (error) {
    console.error(error)
    throw new Error('minio.createBucket: ' + error)
  }
}

export const listBucketObjects = async (minioClient: Client, bucketName: string): Promise<BucketItem[]> => {
  try {
    const exists = await minioClient.bucketExists(`${bucketName}`)
    if (exists) {
      const objects: BucketItem[] = await new Promise(
        (resolve, reject) => {
          let objects: BucketItem[] = []
          const stream = minioClient.listObjectsV2(`${bucketName}`, '', true)
          stream.on('data', (obj: BucketItem) => objects.push(obj)),
          stream.on('end', () => resolve(objects))
          stream.on('error', (err: Error) => reject(err))
        }
      )
      return objects
    }
    return []
  }
  catch(error) {
    console.error(error)
    throw new Error('minio.listBucketObjects: ' + error)
  }
}

export async function putObjectBucket (minioClient: Client, file: any, bucketName: string, objectName: string) {
  try {
    if (! await minioClient.bucketExists(bucketName)) {
      console.log(`creating bucket ${bucketName}`)
      await minioClient.makeBucket(bucketName, 'us-east-1')
    }
    const {filename, mimetype, encoding, createReadStream} = await file
    const stream = createReadStream()
    return await minioClient.putObject(bucketName, objectName, stream)
  } catch (error) {
    console.error(error)
    throw new Error('minio.putObjectTemporaryBucket')
  }
}

export async function makePresignedURL (minioClient: Client, bucketName: string, objectName: string) {
  try {
    const presignedUrl = await minioClient.presignedUrl('GET', bucketName, objectName, 24*60*60)
    return presignedUrl
  } catch (error) {
    console.error(error)
    throw new Error('minio.presignedURL: ' +error)
  }
}