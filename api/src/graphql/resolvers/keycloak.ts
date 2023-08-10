import { ApolloError } from 'apollo-server'

export const resolvers = {
  Query: {

  },
  Mutation: {
    // TODO: use ogm models instead of session
    me: async (obj, params, { driver, kauth }, resolveInfo) => {
      try {
        const { sub: keycloakUserID, email, name, ...kcAuth } = kauth.accessToken.content
        const keycloakUser = { keycloakUserID, email, name }

        const session = driver.session()
        const existingUser = await session.run(
          'MATCH (a:KeycloakUser {keycloakUserID: $keycloakUserID}) RETURN a',
          { keycloakUserID }
        )
        // console.log('match result', existingUser)
        if (!existingUser.records.length) {
          const createUser = await session.run(
            'CREATE (a:KeycloakUser {keycloakUserID: $keycloakUserID, name: $name, email: $email}) RETURN a',
            keycloakUser
          )
          // console.log('createUser result', createUser)
          return createUser.records[0].get(0).properties
        } else {
          // console.log('existing user props', existingUser.records[0].get(0).properties)
          return keycloakUser
        }
      } catch (error) {
        throw new ApolloError('mutation.me error')
      }
    },
    assignKeycloakUserToSubmitter: async (obj, { submitterID }, { driver, kauth }, resolveInfo) => {
      try {
        const { sub: keycloakUserID, email, name, ...kcAuth } = kauth.accessToken.content
        const keycloakUser = { keycloakUserID, email, name }

        const session = driver.session()
        const existingUser = await session.run(
          'MATCH (a:KeycloakUser {keycloakUserID: $keycloakUserID}) RETURN a',
          { keycloakUserID }
        )
        // console.log('match result', existingUser)
        if (existingUser.records.length) {
          const createConnectionToSubmitter = await session.run(
            'MATCH (s:Submitter {uuid: $submitterID}), (k:KeycloakUser {keycloakUserID: $keycloakUserID}) MERGE (s)-[:SUBMITTED_BY]->(k) RETURN s, k',
            { submitterID, keycloakUserID }
          )
      
          return keycloakUser
        } else {
          // console.log('existing user props', existingUser.records[0].get(0).properties)
          throw new ApolloError('mutation.missing user error')
        }
        
      } catch (error) {
        throw new ApolloError('mutation.me error')
      }
    },
    assignKeycloakUserToSubmission: async (obj, { submissionID }, { driver, kauth }) => {
      const session = driver.session()
      try {
        const { sub: keycloakUserID, email, name }  = kauth.accessToken.content
        const keycloakUser = { keycloakUserID, email, name }

        const existingUser = await session.run(
          'MATCH (a:KeycloakUser {keycloakUserID: $keycloakUserID}) RETURN a',
          { keycloakUserID }
        )

        if (existingUser.records.length > 0) {
          await session.run(
            "MATCH (s:Submission {submission_id: $submissionID}), (k:KeycloakUser {keycloakUserID: $keycloakUserID}) MERGE (s)-[:SUBMITTED_BY]->(k) RETURN s, k",
            { submissionID, keycloakUserID }
          )

          return keycloakUser
        } else {
          throw new ApolloError('Error: The user does not exist')
        }
      } catch (error) {
        throw new Error(`Could not assign the user data to the submission. Caused by: ${error}`)
      } finally {
        session.close()
      }
    }
  },
}