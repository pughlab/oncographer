import React, { useMemo } from "react";
import { Form, Message } from 'semantic-ui-react'

import { DynamicFormProps, Field, ModalOperations } from "./types";
import { getFieldValidators } from "./validation/field";
import { fieldIsDisabled} from "./utils/field";
import RenderedField from "./RenderedField";
import ActionsGroup from "./ActionsGroup";
import ValidationErrorMessage from "./ValidationErrorMessage";
import { useDynamicForm } from "./hooks/useDynamicForm";
import { isValidPatientID } from "./utils/form";

export const DynamicForm = ({ form, modalOperations, updateTemplates, updateSubmissions, excluded_fields = [] }: DynamicFormProps & {
  modalOperations: ModalOperations,
  updateTemplates: () => void,
  updateSubmissions: () => void
}) => {
  const { 
    state,
    stateReducer,
    send,
    valuesRef, 
    updateField,
    executeSaveTemplate,
    patientID,
    formWasCleared,
    formWasFilled,
    formName,
    orderedFields
  } = useDynamicForm(form, modalOperations, updateTemplates, updateSubmissions, excluded_fields)

  const renderedFields = useMemo(() => {
    return orderedFields.map((field: Field) => {
      const isIdField = form.id_fields?.includes(field.name) ?? false;
      return (
        <RenderedField
          key={field.name}
          field={field}
          validators={getFieldValidators(field, stateReducer.requiredFields, stateReducer.mutexFields)}
          updateValue={updateField}
          isReset={formWasCleared}
          values={valuesRef.current}
          study={patientID.study}
          required={stateReducer.requiredFields.includes(field.name)}
          disabled={!isIdField && fieldIsDisabled(valuesRef.current, field.enablingConditions)}
          notifyError={() => { send('INVALID') }}
          updateForm={() => send('UPDATE')}
        />
      );
    });
  }, [orderedFields, stateReducer.requiredFields, stateReducer.mutexFields, patientID.study, formWasCleared, formWasFilled, form.id_fields]);

  if (stateReducer?.fieldWidgets?.length === 0 && !state.matches('loading')) return <></>;

  if (state.matches('error')) {
    return (
      <Message warning>
        <Message.Header>Something went wrong</Message.Header>
        <p>Restart the page, then try again.</p>
      </Message>
    )
  }

  return (
    <Form>
      <h2 style={{marginTop: '10px', textAlign: 'center'}}>{formName}</h2>
      {
        stateReducer.draft.lastUpdate && 
        <>
          <span style={{float: 'right'}}>
            Patient {patientID.submitter_donor_id}: {formName} form last autosaved at: {stateReducer.draft.lastUpdate.toString()}
          </span>
          <br/><br/>
        </>
      }
      {
        state.matches('invalid') && <ValidationErrorMessage reducer={stateReducer} />
      }
      {renderedFields}
      <ActionsGroup
        send={send}
        saveTemplate={executeSaveTemplate}
        disabled={state.matches('invalid') || state.matches('loading') || !isValidPatientID(patientID)}
      />
    </Form>
  )
};
