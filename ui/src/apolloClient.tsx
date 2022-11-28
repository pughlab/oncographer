import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'
import { setContext } from '@apollo/client/link/context';

const GRAPHQL_IP = window.location.hostname

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('keycloak_token');
  // return the headers to the context so httpLink can read them
  // console.log('SETTING CONTEXT WITH KC TOKEN', token)
  return {
    headers: {
      ...headers,
      // 'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Credentials': true,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

const link = createUploadLink({uri:`https://${GRAPHQL_IP}:4001/graphql`})

const apolloClient = new ApolloClient({
    link: authLink.concat(link),
    cache: new InMemoryCache(),
  })

export default apolloClient