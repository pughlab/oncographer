import { listBucketObjects } from '../../minio/minio'
import papa from 'papaparse'
import { ApolloError } from 'apollo-server'
import zlib from 'zlib'


export const resolvers = {
    Query: {

    },
    Mutation: {
        createCuratedDatasetFromCSVCodebook: async (parent, { rawDatasetID }, { driver, ogm, minioClient }) => {
            try {
                const RawDatasetModel = ogm.model("RawDataset")
                const DataVariableModel = ogm.model('DataVariable')
                const bucketName = `raw-dataset-${rawDatasetID}`

                const bucketItemNames = (await listBucketObjects(minioClient, bucketName)).map(({ name }) => name)
                console.log(bucketItemNames)
                // From RD a69f105c-005a-46c1-9980-ffae7e2165df
                const rawCSV = '861145dd-0fc9-4565-8283-ec1b04099a70'
                const codebook = '44595b5b-3c89-4e2f-a930-f31400919461'

                const rawCSVStream = await minioClient.getObject(bucketName, rawCSV)
                const codebookStream = await minioClient.getObject(bucketName, codebook)
                // gunzip stream
                // const compressedFileStream = stream.pipe(zlib.createGunzip())
                const parseStream = async (stream: any) => {
                    let result = { meta: {}, data: [] }
                    return await new Promise((resolve, reject) => {
                        papa.parse(stream.pipe(zlib.createGunzip()), {
                            worker: true,
                            delimiter: ",",
                            step: (row) => {
                                result.data.push(row.data)
                            },
                            complete: () => {
                                resolve(result);
                            },
                            error: (err) => {
                                reject(err);
                            },
                        })
                    })
                }
                const rawResult: any = await parseStream(rawCSVStream)
                const codebookResult: any = await parseStream(codebookStream)
                // Turn codebook to map
                let codebookMap: any = new Map()
                for (const row of codebookResult.data) {
                    const [code, description, jsonSchema] = row
                    codebookMap.set(code, { description, jsonSchema })
                }
                console.log(codebookMap)
                // console.log(rawResult)
                const [rawCodeHeaders, ... rawRows] = rawResult.data
                const zip = (a, b) => a.map((k, i) => [k, b[i]]);
                for (const row of rawRows) {
                    const zippedRow = zip(rawCodeHeaders, row)
                    // console.log(zippedRow)
                    let dataVariableInputFields = []
                    for (const codeValue of zippedRow) {
                        const [code, value] = zippedRow
                        // console.log(zippedRow, codebookMap[code], codebookMap['CHILDid'])
                        const codemapRef = codebookMap.get('CHILDid')
                        console.log(codemapRef)
                        const field = {
                            description: codemapRef.description,
                            jsonSchema: codemapRef.jsonSchema,
                            code,
                            value,
                        }
                        dataVariableInputFields.push(field)
                    }
                    const { dataVariables: [dataVariable] } = await DataVariableModel.create({ input: [{
                        fields: dataVariableInputFields
                    }] })
                    console.log(dataVariable)
                    // const { dataVariableID, ...dataVariableRest } = dataVariable
        
                    // await CuratedDatasetModel.update({
                    //   where: { curatedDatasetID },
                    //   update: {
                    //     dataVariables: {
                    //       connectOrCreate: {
                    //         where: { node: { dataVariableID } },
                    //         onCreate: { node: dataVariableRest }
                    //       }
                    //     }
                    //   }
                    // })
                }
                return true
            } catch (error) {
                console.error(error)
                return new ApolloError('csv transform', error)
            }
        },
    },
}