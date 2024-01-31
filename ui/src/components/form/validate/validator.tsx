import {z} from 'zod'

/**
 * naive validation 
 * @param {field}   
 * @returns 
 */
 export function zodifyField(field, study) {  
  
    let schema : any = z // zod schema object that will be used to validate the field
  
    // NOTE: if you want to add a custom type then
    //       then it must be map to a zod type
    //       so it can be validated
  
    // determine the primative type
    switch (field.type.toLowerCase()) {
        case "text":
          schema = schema.string().min(1, { message : field.component.toLowerCase() === "input" ? "Must be 1 or more characters long" : `You need to select one of these fields`}); // any string whith a min character length of 1
          break;
        case "integer":
          schema = schema.number().int(); // x∈Z
          break;
        case "number":
          schema = schema.number(); // x∈[-inf,inf]
          break;
        case "month":
          schema = schema.date({message : "Must be a date"}); // new Date()
          break;
        case "mutiple":
        schema = schema.array(z.any()) // Array[any]
          break;
        case "textarea":
          schema = schema.string().min(1, { message: "Must be 1 or more characters long"}); // any string whith a min character length of 1
          break;
        default:
          throw new Error(`There is something wrong with the field schema type: ${field.type}\ndoes not exist...`)
    }
  
    // define a possible min, and max
    if (["number", "integer"].includes(field.type.toLowerCase())){
      schema = field.set.min === null ? schema : schema.min(field.set.min, { message : `The minimum number you can enter is ${field.set.min}`})
      schema = field.set.max === null ? schema : schema.max(field.set.max, { message : `The maximum number you can enter is ${field.set.max}`})
    }
  
    // check if the field contains a regex
    schema = field.regex === null ? schema : schema.regex(new RegExp(field.regex), { message : "The text you have filled in does not match the standard expression"})
    // check if the field is not required
    if (typeof field.required === "boolean") {
      schema = field.required ? schema : schema.optional()
    } else {
      schema = JSON.parse(field.required)[study] ? schema : schema.optional()
    }
    
    return schema
  }



/**
 * Given there is more then one error then populate all the errors
 * that are thrown.
 * @param {*} arr 
 * @returns 
 */
 export const ParseError = (arr) => {
    return {  pointing: 'above', content : arr.map((issue, index) => {
      if (arr.length === 1) return `${issue.message}`;
      return index === arr.length - 1
        ? `and ${issue.message.toLowerCase()}`
        : `${issue.message}, `;
    })}
  }
  