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
        return parseInt(ast.value)
      } else if (ast.kind === Kind.FLOAT) {
        return parseFloat(ast.value)
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
        return parseInt(ast.value)
      } else if (ast.kind === Kind.FLOAT) {
        return parseFloat(ast.value)
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
        let command = study 
          ? "MATCH (p:Patient { patient_id: $patient_id, program_id: $program_id, study: $study }) RETURN p"
          : "MATCH (p:Patient { patient_id: $patient_id, program_id: $program_id }) RETURN p"
        const result = await session.run(command, study ? { patient_id, program_id, study } : { patient_id, program_id })

        if (result.records.length > 0 ) {
          return result.records[0].get('p').properties
        }

        command = study
          ? "CREATE (p:Patient { patient_id: $patient_id, program_id: $program_id, study: $study }) return p"
          : "CREATE (p:Patient { patient_id: $patient_id, program_id: $program_id }) return p"
        const createPatient = await session.run(
          command,
          study ? { patient_id, program_id, study } : { patient_id, program_id }
        )

        return createPatient.records[0].get(0).properties
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
    }
  }
};