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
