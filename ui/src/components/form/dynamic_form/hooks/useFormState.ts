import { useReducer, useRef, useState, useMemo, useEffect, useCallback } from "react";
import * as reducer from "../dependencies/reducer";
import { FieldValue, Field } from "../types";

export const useFormState = () => {
  const valuesRef = useRef<{ [key: string]: FieldValue }>({});
  const draftSavedRef = useRef(true);
  const [stateReducer, dispatch] = useReducer(reducer.formReducer, reducer.initialState);

  const [formWasCleared, setFormWasCleared] = useState(false);
  const [formWasFilled, setFormWasFilled] = useState(false);

  const formOperations = useMemo(() => ({
    clearForm: () => setFormWasCleared(true),
    clearTemplateDate: () => reducer.clearTemplateDate(dispatch),
    clearSubmissionDate: () => reducer.clearSubmissionDate(dispatch),
    clearDraftId: () => reducer.clearDraftDate(dispatch),
    clearDraftDate: () => reducer.clearDraftDate(dispatch),
    updateDraftId: (draftID: string) => reducer.updateDraftId(dispatch, draftID),
    updateDraftDate: () => reducer.updateDraftDate(dispatch),
    updateSubmissionDate: () => reducer.updateSubmissionDate(dispatch),
    updateTemplateDate: () => reducer.updateTemplateDate(dispatch),
    fillForm: (values: { [key: string]: FieldValue; }) => {
      valuesRef.current = { ...values };
      setFormWasFilled(true);
    },
  }), []);

  const updateField = useCallback((field: Field, value: FieldValue) => {
    valuesRef.current[field.name] = value;
    draftSavedRef.current = false;
  }, []);

  useEffect(() => {
    if (formWasCleared) {
      valuesRef.current = {};
      reducer.clearForm(dispatch);
      reducer.clearDraftId(dispatch);
      reducer.clearDraftDate(dispatch);
      reducer.clearTemplateDate(dispatch);
      reducer.clearSubmissionDate(dispatch);
      setFormWasCleared(false);
    }
  }, [formWasCleared]);

  useEffect(() => {
    if (formWasFilled) {
      setFormWasFilled(false);
    }
  }, [formWasFilled]);

  return {
    stateReducer,
    dispatch,
    valuesRef,
    draftSavedRef,
    formOperations,
    updateField,
    formWasCleared,
    setFormWasCleared,
    formWasFilled
  };
};