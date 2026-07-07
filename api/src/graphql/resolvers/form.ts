import { ApolloError } from 'apollo-server'
import { GraphQLScalarType, Kind } from 'graphql'
import { v4 as uuidv4 } from 'uuid'

function value(value) {
  let vtype = null;

  switch (typeof value) {
    case "number":
      vtype = value
      break;
    case "string":
      vtype = value
      break;
    case "boolean":
      vtype = value
      break;
    case "object":
      vtype = value.low === undefined ? value : value.low
      break;
    default:
      throw new ApolloError('value')
  }
  return vtype;
}

function vSet(value) {
  let vtype = null;
  switch (typeof value) {
    case "number":
      vtype = value
      break;
    case "string":
      vtype = JSON.parse(value)
      break;
    case "object":
      vtype = value.low === undefined ? value : value.low
      break;
    default:
      throw new ApolloError('vset')
  }
  return vtype;
}

function Parser(value) {
  if (typeof value === "string") {
    return JSON.parse(value)
  } else if (typeof value === "object") {
    return JSON.stringify(value)
  } else {
    throw new ApolloError('parser conditional')
  }
}

export const resolvers = {
  FormValue: new GraphQLScalarType({
    name: 'FormValue',
    description: 'custom value scalar type for fields',
    parseValue: value,
    serialize: value,
    parseLiteral(ast) {
      console.log(ast, Kind)
      if (ast.kind === Kind.INT) {
        return Number.parseInt(ast.value)
      } else if (ast.kind === Kind.FLOAT) {
        return Number.parseFloat(ast.value)
      } else if (ast.kind === Kind.OBJECT) {
        // @ts-ignore
        return ast.value
      } else {
        throw new ApolloError('value');

      }
    }
  }),
  SampleSet: new GraphQLScalarType({
    name: 'SampleSet',
    description: 'custom set scalar type for fields',
    parseValue: vSet,
    serialize: vSet,
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return Number.parseInt(ast.value)
      } else if (ast.kind === Kind.FLOAT) {
        return Number.parseFloat(ast.value)
      } else if (ast.kind === Kind.OBJECT) {
        // @ts-ignore
        return ast.value
      } else {
        throw new ApolloError('value');
      }
    }
  }),
  Parser: new GraphQLScalarType({
    name: 'Parser',
    description: 'custom set scalar type for conditional fields',
    parseValue: Parser,
    serialize: Parser,
    parseLiteral(ast) {
      console.log(ast, Kind)
      if (ast.kind === Kind.OBJECT) {
        // @ts-ignore
        return JSON.stringify(ast.value)
      } else {
        throw new ApolloError('value');
      }
    }
  }),
  Mutation: {
    findOrCreatePatient: async (_obj, args, { driver }) => {
      const { patient_id, program_id, study } = args
      const session = driver.session()

      try {
        const command = study 
          ? "MERGE (p:Patient { patient_id: $patient_id, program_id: $program_id, study: $study }) RETURN p"
          : "MERGE (p:Patient { patient_id: $patient_id, program_id: $program_id }) RETURN p"
        const result = await session.run(command, study ? { patient_id, program_id, study } : { patient_id, program_id })

        return result.records[0].get('p').properties
      } catch (error) {
        throw new Error(`Could not find or create Patient. Caused by ${error}`)
      } finally {
        session.close()
      }
    },
    updateOrCreateDraft: async (_obj, args, { driver }) => {
      const { form_id, patient_id, draft_id, data } = args.input
      const session = driver.session()

      try {
        let command = draft_id 
          ? "MERGE (d:FormDraft { draft_id: $draft_id, form_id: $form_id, patient_id: $patient_id }) SET d.data = $data RETURN d"
          : "MERGE (d:FormDraft { form_id: $form_id, patient_id: $patient_id }) SET d.draft_id = $draft_id, d.data = $data RETURN d"
        const createDraft = await session.run(
          command,
          draft_id ? { form_id, patient_id, data } : { form_id, patient_id, draft_id: uuidv4(), data }
        )

        return createDraft.records[0].get(0).properties
      } catch (error) {
        throw new Error(`Could not find or create draft. Caused by ${error}`)
      } finally {
        session.close()
      }
    },
    deleteSubmissionAndFields: async (_obj, args, { driver, kauth }) => {
      const { submission_id } = args.where
      const session = driver.session()
      const adminRoles : string[] = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES) || []
      const clientName : string = process.env.KEYCLOAK_SERVER_CLIENT || ""
      const userID = kauth?.accessToken?.content?.sub || null
      const isAdmin =  (
        kauth
        ? adminRoles.some((role) => kauth.accessToken?.content?.resource_access[clientName]?.roles?.includes(role))
        : false
      )

      try {
        if (isAdmin) {
          let command = `MATCH (s:Submission { submission_id: $submission_id })-[r]->(x:FieldKeyValuePair) 
          WITH x, r, s, COUNT(s) AS nodesDeleted, COUNT(r) AS relationshipsDeleted
          DETACH DELETE x, s 
          RETURN nodesDeleted, relationshipsDeleted`
          await session.run(command, { submission_id })
        } else if (userID) {
          let command = `MATCH 
            (k:KeycloakUser { keycloakUserID: $userID })<-[r1:SUBMITTED_BY]-(s:Submission { submission_id: $submission_id })-[r2:HAS_VALUE]->(x:FieldKeyValuePair) 
            WITH x, r1, r2, s, COUNT(s) + COUNT(x) AS nodesDeleted, COUNT(r1) + COUNT(r2) AS relationshipsDeleted
            DETACH DELETE x, s 
            RETURN nodesDeleted, relationshipsDeleted`
          await session.run(command, { submission_id, userID })
        } else {
          throw new Error(`You are not authorised to do this operation`)
        }
      } catch (error) {
        throw new Error(`Could not delete submission and/or related fields. Caused by ${error}`)
      } finally {
        session.close()
      }
    },
    submitForm: async (_obj, args, { driver, kauth }) => {
      const { submission_id, form_id, patient_id, program_id, study, fields } = args.input
      const session = driver.session()

      const finalSubmissionId = submission_id || uuidv4()
      const keycloakUserID = kauth?.accessToken?.content?.sub
      const email = kauth?.accessToken?.content?.email
      const name = kauth?.accessToken?.content?.name

      try {
        const result = await session.writeTransaction(async tx => {
          await tx.run(`
            MERGE (p:Patient { patient_id: $patient_id, program_id: $program_id, study: $study })
          `, { patient_id, program_id, study })

          await tx.run(`
            MERGE (s:Submission { submission_id: $submission_id })
            ON CREATE SET 
              s.form_id = $form_id,
              s.created_at = datetime(),
              s.editableUntil = datetime().plus({ hours: 1 })
            ON MATCH SET
              s.form_id = $form_id

            WITH s
            MATCH (p:Patient { patient_id: $patient_id, program_id: $program_id, study: $study })
            MERGE (s)-[:DATA_FOR]->(p)
          `, { submission_id: finalSubmissionId, form_id, patient_id, program_id, study })

          if (fields) {
            await tx.run(`
              MATCH (s:Submission { submission_id: $submission_id })
              OPTIONAL MATCH (s)-[r:HAS_VALUE]->(old:FieldKeyValuePair)
              DELETE r, old
            `, { submission_id: finalSubmissionId })
          }
        })
      } catch (error) {
        throw new Error(`Could not submit form. Caused by ${error}`)
      } finally {
        session.close()
      }
    }
  }
};