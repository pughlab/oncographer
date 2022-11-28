import { ApolloServer } from 'apollo-server-express'

import {schema, typeDefs} from './schema'

import { driver } from './neo4j'
import {OGM} from '@neo4j/graphql-ogm'
import { minioClient } from '../minio/minio'

import express from 'express'
import { graphqlUploadExpress } from 'graphql-upload'
import { express as voyagerMiddleware } from 'graphql-voyager/middleware';

import dotenv from 'dotenv'
dotenv.config()

import { configureKeycloak } from './keycloak'
const { KeycloakContext } = require('keycloak-connect-graphql')

// Specify host, port and path for GraphQL endpoint
const graphqlPort = process.env.GRAPHQL_SERVER_PORT || 4001
const graphqlPath = process.env.GRAPHQL_SERVER_PATH || '/graphql'
const graphqlHost = process.env.GRAPHQL_SERVER_HOST || '0.0.0.0'
const voyagerPath = process.env.GRAPHQL_VOYAGER_PATH || '/voyager'

console.log(graphqlPort, graphqlPath, graphqlHost)


export const createApolloServer = () => {
  const app = express()

  const { keycloak } = configureKeycloak(app)

  app.use(graphqlUploadExpress())

  app.use(voyagerPath, voyagerMiddleware({ endpointUrl: graphqlPath }));

  const apolloServer = new ApolloServer({
    context: async ({req, res}) => {
      const token = req.headers.authorization || '';
      // console.log(`Req Bearer Token: ${token}`);
      const kauth = new KeycloakContext({req}, keycloak)
  
      // console.log(`kauth: ${kauth.accessToken}`);
      
      const ogm = new OGM({typeDefs, driver})
      return {
        driver,
        neo4jDatabase: process.env.NEO4J_DATABASE,
        minioClient,
        kauth,
        ogm
      }
    },
    schema: schema,
    introspection: true,
    playground: true,
    uploads: false,
  })
  apolloServer.applyMiddleware({ app, path: graphqlPath })

  const wssListenConfig = { host: graphqlHost, port: graphqlPort, path: graphqlPath }
  return {apolloServer, app, wssListenConfig}

}