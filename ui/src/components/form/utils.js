import { v4 as uuidv4 } from "uuid";
import { ParseError } from "./validate/validator";
import {z} from 'zod';

export const validateFormFieldInputs = (
  uniqueIdsFormState,
  globalFormState,
  conditionalsFields,
  context,
  validationObject,
  errordisplay,
  setErrorDisplay
) => {
  const form = { ...uniqueIdsFormState, ...globalFormState };

  let stopPopulatingProcess = false;
  for (const key in validationObject) {
    if (
      conditionalsFields[key] &&
      doesFieldNotMeetAllConditions(
        conditionalsFields[key],
        globalFormState,
        context
      )
    ) {
      continue;
    }
    let value = form[key]
    console.log( )
    if (z.optional()._def.typeName === validationObject[key]._def.typeName && value === ""){
      value = undefined
    }

    const validate = validationObject[key].safeParse(value);
    console.log(validate)

    if (!validate.success) {
      stopPopulatingProcess = true;
      setErrorDisplay((err) => ({
        ...err,
        [key]: ParseError(validate.error.issues),
      }));
    } else if (errordisplay[key] !== null) {
      setErrorDisplay((err) => ({ ...err, [key]: null }));
    }
  }
  return stopPopulatingProcess;
};

export const connectionConsistencyCheck = (
  doesFormExist,
  relationalCardinalityToRoot,
  relationalCardinalityToRefrenceKey,
  constraints,
  state
) => {
  
  // const filterOutNonRequiredReferences = constraints.reference.filter((value) => {
    
  //   if ( value.override !== null && !value.override.required ) return false
  //   return value.node.required
  // }) 

  // const sortedIds = sortSubmitterByFormId(state, filterOutNonRequiredReferences)
  
  // console.log(Boolean(doesFormExist), doesFormExist, constraints, relationalCardinalityToRoot, sortedIds)

  
  if (Boolean(doesFormExist)) return false; // the submitter does exist referenced to the root
  console.log("Here");

  if (
    constraints.root !== null &&
    relationalCardinalityToRoot >= constraints.root
  )
    return false; 
    // if there is contraint relative root and 
    // we meet that max constraints then return false
    // as we can not construct anohter submitter under this form



  // 1. from the root check if the required referenced submitteres exist
  //if required submitter refereced does not exist
  //  return false
  //else
  //  if relational cardinality to the root is not met or null
  //  2. check the relational cardinality of the connection
  //  if the cardinality is already met then
  //    return false
  //  else if the cardinality is not met
  //    return true
  return true
};

export const handleRelationshipCardinality = () => {

}

export const doesSumbitterExist = (data) => {
  console.log(data)
  return Boolean(data)
}

/**
 * 
 * @param {*} conditionals (field condition) field metadata the contains info of what needs to be met to be used
 * @param {*} gfs (global state form) An object type, intra connection 
 * @param {*} ctx (context) An object type, which allows the form to handle inter connection to other form
 * @returns (boolean) if there contains a false condition then some condition within the field is not met
 */
export const doesFieldNotMeetAllConditions = (conditionals, gfs, ctx={}) => {
  // =====================
  // Conditional Handler
  // =====================

  let check = []
  // There are no conditions
  // so return false given 
  // there are no condition
  // to be met.

  if (conditionals === null) return false
  
  Object.keys(conditionals).forEach((key) => {
      if (gfs[key] === undefined && ctx[key] === undefined) 
           check.push(false)
      else check.push(conditionals[key] === gfs[key] || ctx[key] === conditionals[key] ); 
    });

  return check.includes(false);
};

export const constructDropdown = (values, menu = []) => {
  // =====================
  // Construct Dropdown
  // =====================
  
  // NOTE:
  // this can be done within
  // the back and and stored
  // within the backend.
  values.forEach((value, index) => {
    menu.push({key: index, text: value, value: value });
  });
  return menu;
};


export const getKeysValuePair = (keys, object) => {
  let tempObject = {} // initialize object

  // look through the array of keys
  // and store it in temp object.
  keys.forEach((key) => {
    tempObject[key] = object[key] // with the given keys assign key and value within that object
  })
  return tempObject
}

export const sortSubmitterByFormId = (feildState, fks) => {

  let bucket = {} // initialize bucket will hold all the 
                  // primary keys of each foreign keys referenced in form
  
  // loop through all the reference_key (foreign keys)
  // dump them within there own form bucked
  fks.forEach((fk) => {
    if (bucket[fk.node.primaryFormIdentifiers.form_id] === undefined) {
      bucket[fk.node.primaryFormIdentifiers.form_id] = {
        form: fk.node.primaryFormIdentifiers.form_id,
        formPrimaryIdentifierKeys: {},
      };
    }
    bucket[fk.node.primaryFormIdentifiers.form_id] = {
      ...bucket[fk.node.primaryFormIdentifiers.form_id],
      formPrimaryIdentifierKeys: {
        ...bucket[fk.node.primaryFormIdentifiers.form_id].formPrimaryIdentifierKeys,
        ...getKeysValuePair([fk.node.name], feildState),
      },
    };
  });

  // return an array of all the referenced forms 
  return !Object.keys(bucket).length ? [] : Object.keys(bucket).map(reference => (bucket[reference]))
}

export const ParseFormToGraphQL = (form, fields) => {
  return {"form": form.form_id,
          "uuid": uuidv4(),
          "formPrimaryIdentifierKeys" : getKeysValuePair(fields.formPrimaryIdentifierKeys.map(pk => pk.name), form.ids),
          ...ObjectInputType(form.fields ,fields.formFields),
          ...fields.formReferenceKeys.concat(fields.globalIdentifierKeys).length ? 
          {"formReferenceKeys": 
            { "connect": [ 
                            {"where": 
                              {"node": { "OR" : [
                                              ...sortSubmitterByFormId(form.ids, fields.formReferenceKeys),
                                              { "formPrimaryIdentifierKeys" : getKeysValuePair(fields.globalIdentifierKeys.map(id => id.name), form.ids)}
                                          ]
                                       }
                              } 
                            } 
                          ]
            }
          } : {}
         };
}

/**
 * 
 * @param {*} formState 
 * @param {*} fieldsMetaData 
 * @returns 
 */
 const ObjectInputType = (formState, fieldsMetaData) => {
  let arr = []
  let cond = {}
  fieldsMetaData.forEach((value) => {
      cond[value.name] = value.conditionals === null ? false : doesFieldNotMeetAllConditions(value.conditionals, formState)
  })

  for (const prop in formState){
    if (cond[prop]) continue
    arr.push({ "node" : {key : prop, value : formState[prop] }}) // condition are met then set it to the value else set default value
  }
  return {"fields" : {"create" : arr} }
}

export const parseFormFieldsToQueryContext = (fields, state) => {
  if (fields === null || state === {}) return {};
  return {
    where: {
      formPrimaryIdentifierKeys:
        fields.globalIdentifierKeys.length === 0
          ? null
          : getKeysValuePair(
              fields.globalIdentifierKeys.map((id) => id.name),
              state
            ),
    },
    referencePrimary: {
      ...(!fields.formReferenceKeys.length
        ? {}
        : { OR: [...sortSubmitterByFormId(state, fields.formReferenceKeys)] }),
    },
  };
};

export const submitterBundleQueryParse = (
  self,
  root,
  reference,
  state,
  form_id,
  isRoot=false,
) => {

  console.log(isRoot)
  if (isRoot){
    return {
      self : {
        form: form_id,
        formPrimaryIdentifierKeys:
          self.length === 0
            ? null
            : getKeysValuePair(
                self.map((id) => id.name),
                state
              ),
      }
    }
  }


  return {
    root: {
      formPrimaryIdentifierKeys:
        root.length === 0
          ? null
          : getKeysValuePair(
              root.map((id) => id.name),
              state
            ),
    },
    self: {
      form: form_id,
      formPrimaryIdentifierKeys:
        self.length === 0
          ? null
          : getKeysValuePair(
              self.map((id) => id.name),
              state
            ),
    },
    refrences: {
      ...(!reference.length
        ? {}
        : { OR: [...sortSubmitterByFormId(state, reference)] }),
    },
    form: { form: form_id },
  };
};
