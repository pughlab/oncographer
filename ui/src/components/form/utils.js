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
            program_id: state.patientID.program_id,
            study: state.patientID.study
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

function getBranchFieldLabel(labelContainer, branchFields, submissionFields) {
  for (const branch of branchFields) {
    for (const field of submissionFields) {
      if (field.key === branch) {
        return labelContainer[field.value]
      }
    }
  }
}

export function findDisplayName(field, study, activeSubmission, parentForm) {
  if (!field.display_name) {
    return field.label
  }
  if (typeof field.display_name === "string") {
    return field.display_name
  }
  for (const key in field.display_name) {
    if (key === study && typeof field.display_name[key] === "string") {
      return field.display_name[key]
    } else if (
      typeof field.display_name[key] === "object"
      && activeSubmission
      && parentForm
      && parentForm.branch_fields
      && activeSubmission.form_id === parentForm.form_id
    ) {
      return getBranchFieldLabel(field.display_name[key], parentForm.branch_fields, activeSubmission.fields)
    }
  }
}
