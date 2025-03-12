import {
  clearValidationErrors,
  updateValidationErrors,
} from "../dependencies/reducer";
import { Action, FieldValue, FormReducer, ValidationError } from "../types";
import { getDisabledFields, getFilledFields, isFalsy } from "../utils/field";

export function validateRequiredFields(
  reducer: FormReducer,
  values: { [key: string]: FieldValue }
) {
  const filledFields = getFilledFields(values);
  const disabledFields = getDisabledFields(reducer.fieldWidgets, values);
  const isValid = reducer.requiredFields
    ? reducer.requiredFields
        .filter((field: string) => !disabledFields.includes(field))
        .reduce(
          (acc: boolean, field: string) => acc && filledFields.includes(field),
          true
        )
    : true;
  return isValid;
}

export function validateMutexFields(
  reducer: FormReducer,
  values: { [key: string]: FieldValue }
) {
  let isValid = true;

  if (reducer.mutexFields.length > 0) {
    const filledFields = getFilledFields(values);
    const filledMutexFields: { [key: string]: FieldValue } = {};

    filledFields.forEach((field) => {
      if (reducer.mutexFields?.includes(field) && !isFalsy(values[field])) {
        filledMutexFields[field] = values[field];
      }
    });

    isValid = Object.keys(filledMutexFields).length === 1;
  }

  return isValid;
}

export function isFormValid(
  reducer: FormReducer,
  dispatch: React.Dispatch<Action>,
  values: { [key: string]: FieldValue }
) {
  const isValid = [validateRequiredFields, validateMutexFields].every((f) =>
    f(reducer, values)
  );

  if (isValid) {
    clearValidationErrors(dispatch);
  }

  return isValid;
}

export function showValidationErrors(
  reducer: FormReducer,
  dispatch: React.Dispatch<Action>,
  values: { [key: string]: FieldValue }
) {
  const errors: ValidationError[] = [];
  const filledFields = getFilledFields(values);
  const disabledFields = getDisabledFields(reducer.fieldWidgets, values);
  const requiredFields = reducer.requiredFields ?? [];
  const emptyFields: string[] = requiredFields
    .filter((field: string) => !filledFields.includes(field))
    .filter((field: string) => !disabledFields.includes(field));
  const filledMutexFields = reducer.mutexFields.filter((field: string) =>
    filledFields.includes(field)
  );

  emptyFields.forEach((field: string) => {
    errors.push({ field, type: "required" });
  });
  filledMutexFields.forEach((field: string) => {
    errors.push({ field, type: "mutex" });
  });
  updateValidationErrors(dispatch, errors);
}
