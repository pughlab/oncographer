import { Field, FieldValue } from "../types";

export const isFalsy = (value: any) => {
  return ["", [], {}, 0, NaN, null, undefined].includes(value)
}

export const fieldIsDisabled = (fieldValues: { [key: string]: FieldValue }, conditions: string[] = []) => {
  // helper functions
  const evaluateOperation = (field: string, operation: string, conditionValue: FieldValue) => {
    let result = false;

    // check if the field should NOT be disabled
    // this will be negated in the final return sentence
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
        result = typeof fieldValues[field] === 'string'
          ? conditionValue.includes(fieldValues[field] as string)
          : false;
        break;
      case "nin":
        result = typeof fieldValues[field] === 'string'
          ? !conditionValue.includes(fieldValues[field] as string)
          : false;
        break;
      case "any":
        if (Array.isArray(fieldValues[field])) {
          result = Array.from(fieldValues[field]).some((item) => conditionValue.includes(item));
        } else {
          result = fieldValues[field] === conditionValue;
        }
        break;
      case "defined":
        result = fieldValues.hasOwnProperty(field) && !isFalsy(fieldValues[field])
        break;
    }

    return !result;
  };

  const evaluateCondition = (condition: string) => {
    const parts = condition.split(" ");
    const field = parts[0];
    const operator = parts[1];
    let evaluatedValue;

    try {
      evaluatedValue = JSON.parse(parts.slice(2).join(" "));
    } catch (error) {
      evaluatedValue = parts.length > 2 ? parts.slice(2).join(" ") : null;
    }

    return evaluateOperation(field, operator, evaluatedValue);
  };

  // main logic
  const checks: boolean[] = [];

  if (!conditions || conditions?.length === 0 || fieldValues === null) return false;

  conditions?.forEach((condition: string) => {
    checks.push(evaluateCondition(condition));
  });

  return checks.reduce((cond1, cond2) => cond1 && cond2, true);
};

export const findLabel = (field: Field, fieldValues: { [key: string]: FieldValue }, currentStudy: string|null) => {
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
