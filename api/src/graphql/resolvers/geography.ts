import { ApolloError } from 'apollo-server'

import worldcities from '../json/worldcities.json'
import { Document } from 'flexsearch'

function loadCitiesIndex() {
    const citiesIndex = new Document({
        document: {
            id: 'id',
            index: ['city', 'country'],
            store: ['city', 'country', 'lat', 'lng']
        }
    })
    for (const city of worldcities) {
        citiesIndex.add(city)
    }
    return citiesIndex
}
const citiesIndex = loadCitiesIndex()

export const resolvers = {
    Query: {
        searchGeographyCities: async (obj, { name }, ctx) => {
            try {
                const result = citiesIndex
                    .search(name, { enrich: true })
                    .map(({ field, result }) => result.map(({ id, doc: { city, country, lat, lng } }) => (
                        { cityID: id, city, country, latitude: lat, longitude: lng }
                    )))
                    .flat()
                return result
            } catch (error) {
                console.error(error)
                throw new ApolloError('searchGeographyCities', error)
            }
        }
    },
    Mutation: {
        updateGeographyCityToStudy: async (obj, { studyID, cityID }, { ogm }) => {
            try {
                const city = citiesIndex.get(cityID)
                console.log('indexed', city)
                const GeographyCityModel = ogm.model("GeographyCity")
                const existingGeographyCity = await GeographyCityModel.find({where: {cityID}})
                console.log('existing', existingGeographyCity)
                // Check if already recorded
                let geographyCity
                if (!existingGeographyCity.length) {
                    const {country, lat, lng} = city
                    const {geographyCities} = await GeographyCityModel.create({input: [{cityID, city: city.city, country, latitude: lat, longitude: lng}]})
                    geographyCity = geographyCities[0]
                } else {
                    geographyCity = existingGeographyCity[0]
                }
                const StudyModel = ogm.model('Study')
                const study = await StudyModel.update({
                    where: {studyID},
                    connect: {
                        studySites: {
                            where: {node: {cityID}}
                        }
                    }
                })
                // const { rawDatasets: [rawDataset] } = await GeographyCityModel.create({ input: [{}] })
                // const { rawDatasetID } = rawDataset
                console.log(geographyCity)
                return geographyCity
            } catch (error) {       
                console.error(error)
                throw new ApolloError('addGeographyCityToStudy', error)
            }
        }
    }
}