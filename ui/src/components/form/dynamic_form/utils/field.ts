import { Field, FieldValue } from "../types";

export function isFalsy(value: any) {
  return ["", [], {}, 0, NaN, null, undefined].includes(value)
}

function evaluateOperation(fieldValues: { [key: string]: FieldValue }, field: string, operation: string, conditionValue: FieldValue) {
  let result = false;

  // check if the field should NOT be disabled
  // this will be negated in the final return sentence
  if (fieldValues.hasOwnProperty(field)) {
    switch (operation) {
      case "eq":
        result = fieldValues[field] === conditionValue;
        break;
      case "neq":
        result = fieldValues[field] !== conditionValue;
        break;
      case "lt":
        result = fieldValues[field] < conditionValue;
        break;
      case "gt":
        result = fieldValues[field] > conditionValue;
        break;
      case "min":
      case "gte":
        result = fieldValues[field] >= conditionValue;
        break;
      case "max":
      case "lte":
        result = fieldValues[field] <= conditionValue;
        break;
      case "in":
        result = Array.isArray(fieldValues[field])
          ? false
          : conditionValue.includes(fieldValues[field].toString())
        break;
      case "nin":
        result = Array.isArray(fieldValues[field])
        ? false
        : !conditionValue.includes(fieldValues[field].toString())
        break;
      case "any":
        result = Array.isArray(fieldValues[field])
          ? Array.from(fieldValues[field]).some((item) => conditionValue.includes(item))
          : fieldValues[field] === conditionValue;
        break;
      case "defined":
        result = !isFalsy(fieldValues[field])
        break;
      case "notdefined":
        result = isFalsy(fieldValues[field])
        break;
    }
  }

  return !result;
};

function evaluateCondition(fieldValues: { [key: string]: FieldValue }, condition: string) {
  const parts = condition.split(" ");
  const field = parts[0];
  const operator = parts[1];
  let evaluatedValue;

  try {
    evaluatedValue = JSON.parse(parts.slice(2).join(" "));
  } catch (error) {
    evaluatedValue = parts.length > 2 ? parts.slice(2).join(" ") : null;
  }

  return evaluateOperation(fieldValues, field, operator, evaluatedValue);
};

export function fieldIsDisabled(fieldValues: { [key: string]: FieldValue }, conditions: string[] = []) {
  
  const checks: boolean[] = [];

  if (!conditions || conditions?.length === 0 || fieldValues === null) return false;

  conditions?.forEach((condition: string) => {
    checks.push(evaluateCondition(fieldValues, condition));
  });

  return checks.reduce((cond1, cond2) => cond1 && cond2, true);
};

export function findLabel(field: Field, fieldValues: { [key: string]: FieldValue }, currentStudy: string|null) {
  let label = ""

  try {
    label = field.label.default
    const labelKeys = Object.keys(field.label)

    if (currentStudy && field.studies.includes(currentStudy) && labelKeys.includes(currentStudy)) {
      label = field.label[currentStudy]
    } else {
      for (const value of Object.values(fieldValues)) {
        if (labelKeys.includes(value as string)) {
          label = field.label[value as string]
          break
        }
      }
    }
  } catch (error) {
    throw new Error(`Could not parse label: ${error}`)
  }

  return label
}

export function getFilledFields(valuesObject: {[key: string]: FieldValue}) {
  return Object.keys(valuesObject)
    .filter((field) => !isFalsy(valuesObject[field]))
}

export function getDisabledFields(widgets: Field[], valuesObject: {[key: string]: FieldValue}) {
  const disabledFields: string[] = []
  widgets.forEach((field: Field) => {
    if (fieldIsDisabled(valuesObject, field.enablingConditions)) {
      disabledFields.push(field.name)
    }
  })
  return disabledFields
}
