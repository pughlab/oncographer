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
      && fieldIsDisabled(state.conditions[key], state.fields)
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

export const fieldIsDisabled = (conditions, fieldValues) => {

  // helper functions
  const evaluateOperation = (field, operation, value) => {
    let result = false

    // check if the field should NOT be disabled
    // this will be negated in the final return sentence
    switch (operation) {
      case "eq":
        result = fieldValues[field] === value
        break
      case "neq":
        result = fieldValues[field] !== value
        break
      case "lt":
        result = fieldValues[field] < value
        break
      case "gt":
        result = fieldValues[field] > value
        break
      case "min":
      case "gte":
        result = fieldValues[field] >= value
        break
      case "max":
      case "lte":
        result = fieldValues[field] <= value
        break
      case "in":
        result = fieldValues.hasOwnProperty(field) ? value.includes(fieldValues[field]) : false
        break
      case "nin":
        result = fieldValues.hasOwnProperty(field) ? !value.includes(fieldValues[field]) : false
        break
      case "any":
        if (fieldValues.hasOwnProperty(field) && Array.isArray(fieldValues[field])) {
          result = fieldValues[field].some(item => value.includes(item))
        } else if (!Array.isArray(fieldValues[field])) {
          result = fieldValues[field] === value
        }
        break
      case "defined":
        result = ![null, undefined, "", 0, NaN].includes(fieldValues[field])
        break
    }

    return !result
  }

  const evaluateCondition = (condition) => {
    const parts = condition.split(" ")
    const field = parts[0]
    const operator = parts[1]
    let value

    try {
      value = JSON.parse(parts.slice(2).join(" "))
    } catch (error) {
      value = parts.length > 2 ? parts.slice(2).join(" ") : null
    }

    return evaluateOperation(field, operator, value)
  }

  // main logic
  const checks = []

  if (conditions === null || fieldValues === null) return false

  conditions.forEach((condition) => {
    checks.push(evaluateCondition(condition))
  })

  return checks.reduce((cond1, cond2) => cond1 && cond2, true)
}

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
          return { "node": { 'key': key, 'value': typeof fields[key] === 'object' ? JSON.stringify(fields[key]) : fields[key] }}
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

export function findDescription(field, study) {
  let description = ""
  if (typeof field.description === "string") {
    try {
      const descriptionObject = JSON.parse(field.description)
      description = descriptionObject[study]
    } catch (_error) {
      description = field.description
    }
  } else if (typeof field.description === "object") {
    description = field.description[study]
  }
  return description
}

export function findDisplayName(field, study, activeSubmission = null, parentForm = null) {
  const handleObjectDisplayName = () => {
    for (const key in field.display_name) {
      if (key === study) {
        if (typeof field.display_name[key] === "string") {
          return field.display_name[key]
        }
        if (
          activeSubmission
          && parentForm
          && parentForm.branch_fields
          && activeSubmission.form_id === parentForm.form_id
        ) {
          return getBranchFieldLabel(field.display_name[key], parentForm.branch_fields, activeSubmission.fields)
        }
      }
    }
    return field.display_name[study].hasOwnProperty('default') ? field.display_name[study]['default'] : null
  }

  if (!field.display_name) {
    return field.__typename.toLowerCase() === "field" ? field.label : field.form_name
  }
  switch (typeof field.display_name) {
    case "string":
      return field.display_name
    case "object":
      return handleObjectDisplayName()
  }
}

export function getParentForm(root, form) {
  const stack = [ root ]
  while (stack.length) {
    const node = stack.pop()
    const item = node.node ? node.node : node
    for (const edge of item.next_formConnection.edges) {
      if (edge.node === form) {
        return node
      }
    }
    stack.push(...item.next_formConnection.edges)
  }
  return null
}

export function fieldIsRequired(field, study) {
  return typeof field.required === "boolean" ? field.required : JSON.parse(field.required)[study]
}
