import { v4 as uuidv4 } from "uuid";
import { ParseError } from "./validate/validator";
import {z} from 'zod';

export const validateInputs = (
  state,
  updateErrorMessages
) => {
  const form = {
    ...state.patientID,
    ...state.formIDs,
    ...state.fields
  }
  let validationSuccessful = true
  for (const key in state.validators) {
    if (
      state.conditions[key] 
      && doesFieldNotMeetAllConditions(state.conditions[key], state.fields)
    ) {
      continue
    }
    let value = form[key]
    if (
      z.optional()._def.typeName === state.validators[key]._def.typeName
      && value === ''
    ) {
      value = undefined
    }

    const validation = state.validators[key].safeParse(value)

    if (!validation.success) {
      validationSuccessful = false
      updateErrorMessages({[key]: ParseError(validation.error.issues)})
    } else if (state.errorMessages[key] !== null) {
      updateErrorMessages({ [key]: null })
    }
  }
  return validationSuccessful
}

export const validateFormFieldInputs = (
  uniqueIdsFormState,
  globalFormState,
  conditionalsFields,
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
        globalFormState
      )
    ) {
      continue;
    }
    let value = form[key]

    if (z.optional()._def.typeName === validationObject[key]._def.typeName && value === ""){
      value = undefined
    }

    const validate = validationObject[key].safeParse(value);

    if (!validate.success) {
      stopPopulatingProcess = true;
      setErrorDisplay({ [key]: ParseError(validate.error.issues) });
    } else if (errordisplay[key] !== null) {
      setErrorDisplay({ [key]: null });
    }
  }
  return stopPopulatingProcess;
};


export const doesSubmitterExist = (data) => {

  return Boolean(data)
}

/**
 * 
 * @param {*} conditionals (field condition) field metadata the contains info of what needs to be met to be used
 * @param {*} gfs (global state form) An object type, intra connection 
 * @param {*} ctx (context) An object type, which allows the form to handle inter connection to other form
 * @returns (boolean) if there contains a false condition then some condition within the field is not met
 */
export const doesFieldNotMeetAllConditions = (conditionals, gfs) => {
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
      if (gfs[key] === undefined) 
          check.push(false)
      else {
        Array.isArray(conditionals[key]) ? 
        check.push(conditionals[key].includes(gfs[key])) :
        check.push(conditionals[key] === gfs[key]);
      }
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


export const getKeyValuePairs = (keys, object) => {
  let tempObject = {} // initialize object

  // look through the array of keys
  // and store it in temp object.
  if (keys) {
    keys.forEach((key) => {
      tempObject[key] = object[key] || "" // with the given keys assign key and value within that object
    })
  }
  return tempObject
}

// sort just the reference keys that are not global identifier
export const sortSubmitterByFormId = (fieldState, fks, deleteNonFullBucket=true, uuids={}) => {

  let bucket = new Object() // initialize bucket will hold all the 
                  // primary keys of each foreign keys referenced in form
  
  // loop through all the reference_key (foreign keys)
  // dump them within there own form bucked object
  fks.forEach((fk) => {
    if (!bucket.hasOwnProperty(fk.node.primaryFormIdentifiers.form_id)) {
      bucket[fk.node.primaryFormIdentifiers.form_id] = {
        form: fk.node.primaryFormIdentifiers.form_id,
        
        formPrimaryIdentifierKeys: {},
      };
    }

    if(uuids.hasOwnProperty(fk.node.primaryFormIdentifiers.form_id)){
      bucket[fk.node.primaryFormIdentifiers.form_id] = {
        ...bucket[fk.node.primaryFormIdentifiers.form_id],
        uuid : uuids[fk.node.primaryFormIdentifiers.form_id]
       }
    }

    bucket[fk.node.primaryFormIdentifiers.form_id] = {
      ...bucket[fk.node.primaryFormIdentifiers.form_id],
      formPrimaryIdentifierKeys: {
        ...bucket[fk.node.primaryFormIdentifiers.form_id].formPrimaryIdentifierKeys,
        ...getKeyValuePairs([fk.node.name], fieldState),
        
      },
    };

    if (deleteNonFullBucket && fieldState[fk.node.name] === "" ||  fieldState[fk.node.name] === undefined) delete bucket[fk.node.primaryFormIdentifiers.form_id] // do not include the form if it's not been full filled out
  
  });

  // return an array of all the referenced forms 
  return Object.keys(bucket).length ? Object.keys(bucket).map(reference => (bucket[reference])) : []
}

export const submitterReferenceFormsRelationalCardinality = (fks) => {

  let bucket = {} // initialize bucket will hold all the 
                  // primary keys of each foreign keys referenced in form
  
  // loop through all the reference_key (foreign keys)
  // dump them within there own form bucked object
  fks.forEach((fk) => {
    if (fk.relationship_cardinality !== null && bucket[fk.node.primaryFormIdentifiers.form_id] === undefined) {
      bucket[fk.node.primaryFormIdentifiers.form_id] = fk.relationship_cardinality
    }
  });
  
  return bucket
}

export const ParseFormToGraphQL = (form, fields) => {
  return {"form": form.form_id,
          "uuid": uuidv4(),
          "formPrimaryIdentifierKeys" : getKeyValuePairs(fields.formPrimaryIdentifierKeys.map(pk => pk.name), form.ids),
          "fields" : {
            "create" : [...ObjectInputType(form.fields ,fields.formFieldsMetadata, form.context)]
          },
          ...fields.formReferenceKeys.concat(fields.globalIdentifierKeys).length ? 
          {"formReferenceKeys": 
            { "connect": [ 
                            {"where": 
                              {"node": { "OR" : [
                                              ...sortSubmitterByFormId(form.ids, fields.formReferenceKeys, true, form.uuids ),
                                              { "formPrimaryIdentifierKeys" : getKeyValuePairs(fields.globalIdentifierKeys.map(id => id.name), form.ids)}
                                          ]
                                       }
                              } 
                            } 
                          ]
            }
          } : {}
         };
}

export const createSubmissionInput = (formID, state) => {
  const fields = Object.fromEntries(
    Object.entries({
      ...state.formIDs,
      ...state.fields
    }).filter(([_key, value]) => value && value !== '')
  )
  return {
    "form_id": formID,
    "patient": {
      "connect": {
        "where": {
          "node": {
            patient_id: state.patientID.submitter_donor_id,
            program_id: state.patientID.program_id
          }
        }
      }
    },
    "fields": {
      "create": Object.keys(fields).map(
        function(key) { 
          return { "node": { 'key': key, 'value': fields[key] }}
        }
      )
    }
  }
}

/**
 * 
 * @param {*} formState 
 * @param {*} fieldsMetaData 
 * @returns 
 */
 const ObjectInputType = (formState, fieldsMetaData, context) => {
  let arr = []
  let cond = {}
  fieldsMetaData.forEach((value) => {
      cond[value.name] = value.conditionals === null ? false : doesFieldNotMeetAllConditions(value.conditionals, formState, context)
  })

  for (const prop in formState){
    if (cond[prop]) continue
    arr.push({ "node" : {key : prop, value : formState[prop] }}) // condition are met then set it to the value else set default value
  }
  return arr
}

export const parseFormFieldsToQueryContext = (fields, state) => {
  if (fields === null || state === {}) return {};
  return {
    root: {
      formPrimaryIdentifierKeys:
        fields.globalIdentifierKeys.length === 0
          ? null
          : getKeyValuePairs(
              fields.globalIdentifierKeys.map((id) => id.name),
              state
            ),
    },
    references: {
      ...(!fields.formReferenceKeys.length
        ? {}
        : { OR: [...sortSubmitterByFormId(state, fields.formReferenceKeys, false)] }),
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

  if (isRoot){
    return {
      self : {
        form: form_id,
        formPrimaryIdentifierKeys:
          self.length === 0
            ? null
            : getKeyValuePairs(
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
          : getKeyValuePairs(
              root.map((id) => id.name),
              state
            ),
    },
    self: {
      form: form_id,
      formPrimaryIdentifierKeys:
        self.length === 0
          ? {}
          : getKeyValuePairs(
              self.map((id) => id.name),
              state
            ),
    },
    references: {
      ...(!reference.length
        ? {}
        : { OR: [...sortSubmitterByFormId(state, reference)] }),
    },
    form: { form: form_id },
  };
};


