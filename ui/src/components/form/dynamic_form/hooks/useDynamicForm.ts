import React, { useEffect, useMemo, useRef } from "react";
import { useMachine } from "@xstate/react";

import { formStateMachine } from "../dependencies/stateMachine";
import { Field, DynamicFormProps, ModalOperations } from "../types";
import { showValidationErrors, isFormValid } from "../validation/form";
import { loadDraft } from "../utils/form";

import { usePatientID } from "../../../layout/context/PatientIDProvider";
import { usePatientIDLabels } from "../../../../hooks/useLabels";
import { useUpdateFormOperations } from "../../../layout/context/FormOperationsProvider";
import { useLabelsContext, useUpdateLabelsContext } from "../../../layout/context/LabelsProvider";

import { useFormState } from "./useFormState";
import { useFormInitialization } from "./useFormInitialization";
import { useFormPersistence } from "./useFormPersistence";

export const useDynamicForm = (
  form: DynamicFormProps['form'], 
  modalOperations: ModalOperations, 
  updateTemplates: () => void, 
  updateSubmissions: () => void, 
  excluded_fields: string[]
) => {
  const patientID = usePatientID();
  const setFormOperations = useUpdateFormOperations();
  const { data: patientIDLabels } = usePatientIDLabels();
  const labels = useLabelsContext();
  const setLabels = useUpdateLabelsContext();
  const sendRef = useRef<any>(null);

  const {
    stateReducer,
    dispatch,
    valuesRef,
    draftSavedRef,
    formOperations,
    updateField,
    formWasCleared,
    formWasFilled
  } = useFormState();

  const {
    gqlClient,
    patientIdentifierIsNotEmpty,
    executeSubmitForm,
    executeSaveDraft,
    executeSaveTemplate
  } = useFormPersistence({
    form, 
    valuesRef, 
    draftSavedRef, 
    stateReducer, 
    patientID, 
    formOperations, 
    modalOperations, 
    updateSubmissions, 
    updateTemplates,
    sendRef
  });

  const machineOptions = useMemo(() => ({
    actions: {
      executeClearForm: () => formOperations.clearForm(),
      showValidationErrors: () => showValidationErrors(stateReducer, dispatch, valuesRef.current),
    },
    services: {
      executeSubmitForm,
      executeSaveDraft,
    },
    guards: {
      isFormValid: () => isFormValid(stateReducer, dispatch, valuesRef.current),
      canSave: () => !draftSavedRef.current && patientIdentifierIsNotEmpty()
    }
  }), [executeSubmitForm, executeSaveDraft, patientIdentifierIsNotEmpty, stateReducer, dispatch, formOperations, valuesRef]);

  const [state, send] = useMachine(formStateMachine, machineOptions);

  useEffect(() => { sendRef.current = send; }, [send]);

  useFormInitialization(form, patientID, excluded_fields, dispatch, send);

  React.useEffect(() => {
    setFormOperations(formOperations);
  }, [formOperations, setFormOperations]);

  useEffect(() => {
    if (Object.keys(patientIDLabels).length > 0 && Object.keys(labels).length === 0) {
      setLabels(patientIDLabels);
    }
  }, [patientIDLabels, labels, setLabels]);

  React.useEffect(() => {
      send('CLEAR');
      if (patientIdentifierIsNotEmpty()) {
        loadDraft(form, gqlClient, patientID, formOperations);
      }
  }, [patientID, patientIdentifierIsNotEmpty, form, gqlClient, formOperations, send]);

  React.useEffect(() => {
    send('RELOAD');
  }, [patientID.study, send]);

  const orderedFields = useMemo(() => {
    const idFields: Field[] = [];
    const regularFields: Field[] = [];
    
    stateReducer.fieldWidgets.forEach((field: Field) => {
      if (form.id_fields?.includes(field.name)) {
        idFields.push(field);
      } else {
        regularFields.push(field);
      }
    });
    return [...idFields, ...regularFields];
  }, [stateReducer.fieldWidgets, form.id_fields]);

  const formName = useMemo(() => {
    if (form.label) {
      return form.label[patientID.study] ?? form.label["default"];
    }
    return form.name;
  }, [form.label, form.name, patientID.study]);

  return {
    state,
    stateReducer,
    dispatch,
    send,
    valuesRef,
    patientID,
    updateField,
    executeSaveTemplate,
    formWasCleared,
    formWasFilled,
    formName,
    orderedFields
  };
};