import React, { useCallback } from "react";
import { useApolloClient } from "@apollo/client";
import { submitForm, saveDraft, saveTemplate } from "../utils/form";
import { ModalOperations, DynamicFormProps } from "../types";

interface UseFormPersistenceProps {
  form: DynamicFormProps['form'];
  valuesRef: React.MutableRefObject<any>;
  draftSavedRef: React.MutableRefObject<boolean>;
  stateReducer: any;
  patientID: any;
  formOperations: any;
  modalOperations: ModalOperations;
  updateSubmissions: () => void;
  updateTemplates: () => void;
  sendRef: React.MutableRefObject<any>;
}

export const useFormPersistence = ({
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
}: UseFormPersistenceProps) => {
  const gqlClient = useApolloClient();
  const { setModalTitle, setModalContent, setModalError, setOpenModal } = modalOperations;

  const patientIdentifierIsNotEmpty = useCallback(() => {
    return patientID.submitter_donor_id.trim() !== '' && patientID.program_id.trim() !== '';
  }, [patientID.submitter_donor_id, patientID.program_id]);

  const executeSubmitForm = useCallback(async () => {
    try {
      await submitForm(form, valuesRef.current, stateReducer.draft.id, gqlClient, patientID, formOperations);
      draftSavedRef.current = true;
      updateSubmissions();
      setModalTitle('Success');
      setModalContent('The form was submitted successfully');
      setModalError(false);
      setOpenModal(true);
    } catch (error: any) {
      console.log(`Error while submitting the form: ${error.message}`);
      sendRef.current?.({ type: 'FAILURE', title: 'Error', content: 'There was an error while submitting the form, please try again', error: true });
    }
  }, [form, stateReducer.draft.id, gqlClient, patientID, formOperations, updateSubmissions, setModalTitle, setModalContent, setModalError, setOpenModal, sendRef]);

  const executeSaveDraft = useCallback(async () => {
    try {
      if (!draftSavedRef.current && patientIdentifierIsNotEmpty()) {
        await saveDraft(form, valuesRef.current, stateReducer.draft.lastUpdate, gqlClient, patientID, formOperations);
        draftSavedRef.current = true;
      }
    } catch (error: any) {
      console.error(`Error while saving the draft: ${error.message}`);
    }
  }, [patientIdentifierIsNotEmpty, form, stateReducer.draft.lastUpdate, gqlClient, patientID, formOperations]);

  const executeSaveTemplate = useCallback(async () => {
    try {
      await saveTemplate(form, valuesRef.current, gqlClient, patientID, formOperations);
      draftSavedRef.current = true;
      setModalTitle('Success');
      setModalContent('Template successfully saved');
      setModalError(false);
      setOpenModal(true);
      updateTemplates();
      sendRef.current?.('SAVED');
    } catch (error: any) {
      console.log(`Error while saving the template: ${error.message}`);
      sendRef.current?.({ type: 'FAILED', title: 'Error', content: 'Could not save the template, please try again.', error: true });
    }
  }, [form, gqlClient, patientID, formOperations, setModalTitle, setModalContent, setModalError, setOpenModal, updateTemplates, sendRef]);

  return {
    gqlClient,
    patientIdentifierIsNotEmpty,
    executeSubmitForm,
    executeSaveDraft,
    executeSaveTemplate
  };
};