import { makeBucket } from '../../minio/minio'
import { ApolloError } from 'apollo-server'

export const resolvers = {
  Query: {

  },
  Mutation: {
    createRawDatasetWithMinioBucket: async (
      parent,
      {studyID, studySiteID, name, description},
      { driver, ogm, minioClient }
    ) => {
      try {
        const RawDatasetModel = ogm.model("RawDataset")

        const rawDatasetInput = {name, description, fromStudy: {connect: {where: {node: {studyID}}}}}
        const { rawDatasets: [rawDataset] } = await RawDatasetModel.create({ input: [rawDatasetInput] })
        const { rawDatasetID } = rawDataset
        const bucketName = `raw-dataset-${rawDatasetID}`
        await makeBucket(minioClient, bucketName)

        const StudyModel = ogm.model('Study')
        const {studies: [study]} = await StudyModel.update({
          where: {studyID},
          connect: {rawDatasets: {where: {node: {rawDatasetID}}}}
        })

        await RawDatasetModel.update({
          where: {rawDatasetID},
          connect: {studySite: {where: {node: {cityID: studySiteID}}}}
        })
        return rawDataset
      } catch (error) {
        console.log('createRawDatasetWithMinio', error)
        throw new ApolloError('createRawDatasetWithMinio', error)
      }
    },
  },

  RawDataset: {
    minioBucket: async (
      { rawDatasetID },
      { },
      { minioClient }
    ) => {
      try {
        return {
          bucketName: `raw-dataset-${rawDatasetID}`
        }
      } catch (error) {
        console.log(error)
        throw new ApolloError('rawdataset.miniobucket', error)
      }
    }
  },
}