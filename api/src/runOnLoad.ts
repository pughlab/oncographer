export default async function runOnLoad ({wssListenConfig}) {
  const { host: graphqlHost, port: graphqlPort, path: graphqlPath } = wssListenConfig
  console.log(`GraphQL server ready at http://${graphqlHost}:${graphqlPort}${graphqlPath}`)
}