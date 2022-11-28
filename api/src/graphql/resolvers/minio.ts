import { minioClient, listBucketObjects } from '../../minio/minio'
import { ApolloError } from 'apollo-server'
import  zlib  from 'zlib';
import { extname } from 'path'


export const resolvers = {
  Query: {

  },
  Mutation: {
    minioUpload: async (obj, { bucketName, file }, { driver }) => {
      try {
        const { filename, mimetype, encoding, createReadStream } = await file
        
        let filenameExt = filename
        let stream = createReadStream()

        if (extname(filename) != ".gz") {
          stream = createReadStream().pipe(zlib.createGzip())
          filenameExt = filename.concat(".gz") 
        }
        
        // assume file is already gzipped:
        // const stream = createReadStream()

        // to gzip the file:
        // const compressedFileStream = createReadStream().pipe(zlib.createGzip());

        const session = driver.session()
        const createMinioUpload = await session.run(
          'CREATE (a:MinioUpload {bucketName: $bucketName, objectName: apoc.create.uuid(), filename: $filenameExt}) RETURN a',
          { bucketName, filenameExt }
        )
        // console.log(createMinioUpload.records[0].get(0).properties)
        const minioUpload = createMinioUpload.records[0].get(0)
        const { objectName } = minioUpload.properties
        await minioClient.putObject(bucketName, objectName, stream)
        return minioUpload.properties
      } catch (error) {
        console.log(error)
        throw new ApolloError('mutation.minioUpload error')
      }
    },
  },

  MinioBucket: {
    minioObjects: async ({ bucketName }, { }, { minioClient, ogm, driver }) => {
      try {
        const MinioUploadModel = ogm.model("MinioUpload")
        const bucketItemNames = (await listBucketObjects(minioClient, bucketName)).map(({ name }) => name)

        const res = await MinioUploadModel.find({
          where: {
            objectName: { IN: [bucketItemNames] }
          }
        })
        console.log(res)
        return []
        // const session = driver.session()
        // const findMinioUpload = await session.run(
        //   // Rename label to MinioUpload to match schema
        //   'MATCH (a:MinioObject) WHERE a.objectName IN $bucketItemNames RETURN a',
        //   {bucketItemNames}
        // )
        // console.log(findMinioUpload.records.map(record => record.toObject()))
        // console.log(createMinioUpload.records[0].get(0).properties)
        // const minioUpload = findMinioUpload.records[0].get(0)

        // return findMinioUpload.records.map(record => record.toObject())
        // return bucketItems.map(({name, ...rest}) => ({bucketName, objectName: name}))
      } catch (error) {
        console.log(error)
        throw new ApolloError('miniobucket.minioobjects', error)
      }
    }
  },

  MinioUpload: {
    presignedURL: async (
      { bucketName, objectName },
      { },
      { driver, ogm, minioClient }
    ) => {
      try {
        const presignedURL = await minioClient.presignedUrl('GET', bucketName, objectName)
        console.log(presignedURL)
        return presignedURL
      } catch (error) {
        console.log(error)
        console.log('minioupload.presignedurl error')
        throw new ApolloError('minioupload.presignedurl', error)
      }
    }

  }
}