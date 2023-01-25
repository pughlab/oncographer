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
      throw new ApolloError('value')
      // throw new GraphQLError('Provided value is not an odd integer', {extensions: { code: 'BAD_USER_INPUT' },});
  }
  return vtype;
}
  
  function vSet(value) {
    var vtype = null;
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
  
  function Parser(value) {
    // console.log(typeof value)
    if (typeof value === "string"){
      return JSON.parse(value)
    } else if(typeof value === "object"){
      return JSON.stringify(value)
    } else {
        throw new ApolloError('parser conditional')
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
        throw new ApolloError('value');

      }
    }
  }),
  SampleSet : new GraphQLScalarType({
    name : 'SampleSet',
    description : 'custom set scalar type for fields',
    parseValue : vSet,
    serialize : vSet,
    parseLiteral(ast) {
      if (ast.kind === Kind.INT){
        return parseInt(ast.value)
      } else if (ast.kind === Kind.FLOAT){
        return parseFloat(ast.value)
      } else if (ast.kind === Kind.OBJECT) {
            // @ts-ignore
        return ast.value
      } else {
        throw new ApolloError('value');
      }
    }
  }),
  Parser : new GraphQLScalarType({
    name : 'Parser',
    description : 'custom set scalar type for conditional fields',
    parseValue : Parser,
    serialize : Parser,
    parseLiteral(ast) {
      console.log(ast, Kind)
       if (ast.kind === Kind.OBJECT) {
          // @ts-ignore
        return JSON.stringify(ast.value)
      } else {
        throw new ApolloError('value');
      }
    }
  })

};