import { ApolloError } from 'apollo-server'
import { GraphQLScalarType, Kind, GraphQLError } from 'graphql'

function value(value) {
    var vtype = null;
    switch(typeof value) {
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
        console.log(value, typeof value)
        throw new ApolloError('value')
        // throw new GraphQLError('Provided value is not an odd integer', {extensions: { code: 'BAD_USER_INPUT' },});
    }
    return vtype;
  }
  
  function vSet(value) {
    var vtype = null;
    console.log(typeof value, value)
    switch(typeof value) {
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
        // throw new GraphQLError('Provided value is not an odd integer', {extensions: { code: 'BAD_USER_INPUT' },});
    }
    return vtype;
  }
  
  function conditional(value) {
    if (typeof value === "string"){
      return JSON.parse(value)
    } else {
        throw new ApolloError('conditional')
        // throw new GraphQLError('Provided value is not an odd integer', {extensions: { code: 'BAD_USER_INPUT' },});
    }
  }

export const resolvers = {
    FormValue : new GraphQLScalarType({
      name : 'FormValue',
      description : 'custom value scalar type for fields',
      parseValue : value, 
      serialize : value,
      parseLiteral(ast) {
        console.log(ast, Kind)
        if (ast.kind === Kind.INT){
          return parseInt(ast.value)
        } else if (ast.kind === Kind.FLOAT){
          return parseFloat(ast.value)
        } else if (ast.kind === Kind.OBJECT) {
            // @ts-ignore
          return ast.value
        } else {
            throw new ApolloError('value resolver')
        //   throw new GraphQLError('Provided value is not an odd integer', {
        //     extensions: { code: 'BAD_USER_INPUT' },
        //   });
        }
      }
    }),
    SampleSet : new GraphQLScalarType({
      name : 'SampleSet',
      description : 'custom set scalar type for fields',
      parseValue : vSet,
      serialize : vSet,
      parseLiteral(ast) {
        console.log(ast, Kind)
        if (ast.kind === Kind.INT){
          return parseInt(ast.value)
        } else if (ast.kind === Kind.FLOAT){
          return parseFloat(ast.value)
        } else if (ast.kind === Kind.OBJECT) {
            // @ts-ignore
          return ast.value
        } else {
            throw new ApolloError('sampleSet resolver')
        //   throw new GraphQLError('Provided value is not an odd integer', {
        //     extensions: { code: 'BAD_USER_INPUT' },
        //   });
        }
      }
    }),
    Conditional : new GraphQLScalarType({
      name : 'Conditional',
      description : 'custom set scalar type for conditional fields',
      parseValue : conditional,
      serialize : conditional,
    })
  
  };