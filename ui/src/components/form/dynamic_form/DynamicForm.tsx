import React, { useEffect, useReducer } from "react";
import { useMachine } from "@xstate/react";
import { Button, Form, List, ListContent, ListIcon, ListItem, Message } from 'semantic-ui-react'

import * as reducer from "./dependencies/reducer";
import { formStateMachine } from "./dependencies/stateMachine";
import { InputField } from "./fields/input";
import { SelectField } from "./fields/select";
import { Validator, FieldValue, DynamicFormProps, Field, ValidationError, FormReducer } from "./types";
import { getFieldValidators } from "./validation/field";
import { TextareaField } from "./fields/textarea";
import { fieldIsDisabled, findLabel} from "./utils/field";
import { isFormValid, showValidationErrors } from "./validation/form";
import { usePatientIDLabels, useStudyLabels } from "../../../hooks/useLabels";
import { useApolloClient } from "@apollo/client";
import { loadDraft, saveDraft, saveTemplate, submitForm } from "./utils/form";
import { useGetFieldData } from "../../../hooks/useGetFieldData";
import { usePatientID } from "../../layout/context/PatientIDProvider";
import { useUpdateFormOperations } from "../../layout/context/FormOperationsProvider";
import { useLabelsContext, useUpdateLabelsContext } from "../../layout/context/LabelsProvider";

export const DynamicForm = ({ form, modalOperations, updateTemplates, updateSubmissions, excluded_fields = [] }: DynamicFormProps & {
  modalOperations: {
    setOpenModal: React.Dispatch<React.SetStateAction<boolean>>,
    setModalTitle: React.Dispatch<React.SetStateAction<string>>,
    setModalContent: React.Dispatch<React.SetStateAction<string>>,
    setModalError: React.Dispatch<React.SetStateAction<boolean | undefined>>,
  },
  updateTemplates: () => void,
  updateSubmissions: () => void
}) => {
  // initialise and configure reducer and state machine
  const valuesRef = React.useRef<{[key: string]: FieldValue}>({})
  const [stateReducer, dispatch] = useReducer(reducer.formReducer, reducer.initialState);
  const [state, send] = useMachine(formStateMachine, {
    actions: {
      executeClearForm,
      showValidationErrors: () => showValidationErrors(stateReducer, dispatch, valuesRef.current),
    },
    services: {
      executeSubmitForm,
      executeSaveDraft
    },
    guards: {
      isFormValid: () => isFormValid(stateReducer, dispatch, valuesRef.current),
    }
  });

  // initialize auxiliary state, context or ref variables
  const gqlClient = useApolloClient();
  const [formWasCleared, setFormWasCleared] = React.useState(false)
  const patientID = usePatientID()
  const { error: fieldsError, data: fields } = useGetFieldData(form)
  const patientIdentifierRef = React.useRef(patientID)
  const formOperations = {
    clearForm: executeClearForm,
    clearTemplateDate: () => reducer.clearTemplateDate(dispatch),
    clearSubmissionDate: () => reducer.clearSubmissionDate(dispatch),
    clearDraftId: () => reducer.clearDraftDate(dispatch),
    clearDraftDate: () => reducer.clearDraftDate(dispatch),
    updateDraftId: (draftID: string) => reducer.updateDraftId(dispatch, draftID),
    updateDraftDate: () => reducer.updateDraftDate(dispatch),
    updateSubmissionDate: () => reducer.updateSubmissionDate(dispatch),
    updateTemplateDate: () => reducer.updateTemplateDate(dispatch),
    fillForm: (values: { [key: string]: FieldValue; }) => valuesRef.current = values,
  }
  const setFormOperations = useUpdateFormOperations()
  const { setModalTitle, setModalContent, setModalError, setOpenModal } = modalOperations
  const { data: patientIDLabels } = usePatientIDLabels()
  const labels = useLabelsContext()
  const setLabels = useUpdateLabelsContext()

  function updateField(field: Field, value: FieldValue) {
    valuesRef.current[field.name] = value
    send('CHANGE')
  }

  function executeClearForm() { 
    valuesRef.current = {}
    reducer.clearForm(dispatch)
    reducer.clearDraftId(dispatch)
    reducer.clearDraftDate(dispatch)
    reducer.clearTemplateDate(dispatch)
    reducer.clearSubmissionDate(dispatch)
    setFormWasCleared(true)
    setTimeout(() => {
      setFormWasCleared(false)
    }, 0) // ugly hack to restore the form cleared flag semi-synchronously
  }

  async function executeSubmitForm() {
    try {
      await submitForm(form, valuesRef.current, stateReducer.draft.id, gqlClient, patientIdentifierRef.current, formOperations)
      updateSubmissions()
      setModalTitle('Success')
      setModalContent('The form was submitted successfully')
      setModalError(false)
      setOpenModal(true)
    } catch (error: any) {
      console.log(`Error while submitting the form: ${error.message}`)
      send({ type: 'FAILURE', title: 'Error', content: 'There was an error while submitting the form, please try again', error: true})
    }
  }

  async function executeSaveTemplate() {
    try {
      await saveTemplate(form, valuesRef.current, gqlClient, patientIdentifierRef.current, formOperations)
      setModalTitle('Success')
      setModalContent('The form was submitted successfully')
      setModalError(false)
      setOpenModal(true)
      updateTemplates()
      send('SAVED')
    } catch (error: any) {
      console.log(`Error while saving the template: ${error.message}`)
      send({ type: 'FAILED', title: 'Error', content: 'Could not save the template, please try again.', error: true })
    }
  }

  async function executeSaveDraft() {
    try {
      await saveDraft(form, valuesRef.current, stateReducer.draft.lastUpdate, gqlClient, patientIdentifierRef.current, formOperations)
    } catch (error: any) {
      console.error(`Error while saving the draft: ${error.message}`)
    }
  }

  const patientIdentifierIsNotEmpty = () => {
    return patientIdentifierRef.current.submitter_donor_id.trim() !== '' && patientIdentifierRef.current.program_id.trim() !== ''
  }

  // render control variables and effects
  const canRender = stateReducer.fieldWidgets.length > 0 && !state.matches('loading')

  React.useEffect(() => {
    setFormOperations(formOperations)
  }, [])

  useEffect(() => {
    if (Object.keys(patientIDLabels).length > 0 && Object.keys(labels).length === 0) {
      setLabels(patientIDLabels)
    }
  }, [patientIDLabels])

  React.useEffect(() => {
    if (fieldsError) {
      send('ERROR')
    }
  }, [fieldsError])

  React.useEffect(() => {
    if (fields.length > 0) {
      reducer.updateWidgets(dispatch, fields.filter((field: Field) => !excluded_fields.includes(field.name)))
      if (form.required_fields) {
        const requiredFields = patientIdentifierRef.current.study && form.required_fields ? form.required_fields[patientIdentifierRef.current.study] ?? [] : form.required_fields?.default ?? []
        reducer.updateRequiredFields(dispatch, requiredFields.filter((field: string) => !excluded_fields.includes(field)))
      }
      if (form.mutex_fields) {
        const mutexFields = patientIdentifierRef.current.study && form.mutex_fields ? form.mutex_fields[patientIdentifierRef.current.study] ?? [] : form.mutex_fields?.default ?? []
        reducer.updateExclusiveFields(dispatch, mutexFields.filter((field: string) => !excluded_fields.includes(field)))
      }
      const fieldLabels = fields.reduce((labels: any, field: any) => {
        labels[field.name] = field.label
        return labels
      }, {})
      setLabels(oldLabels => ({
        ...oldLabels,
        ...fieldLabels
      }))
      send('DONE')
    }
  }, [fields])

  React.useEffect(() => {
    if (patientIdentifierRef.current !== patientID) {
      send('CLEAR')
      patientIdentifierRef.current = patientID
      if (patientIdentifierIsNotEmpty()) {
        loadDraft(form, gqlClient, patientIdentifierRef.current, formOperations)
      }
    }
  }, [patientID])

  React.useEffect(() => {
    send('RELOAD')
  }, [patientID.study])

  // final result
  let finalComponent = <></>

  if (canRender && !state.matches('error')) {
    const idFields: Field[] = []
    const regularFields: Field[] = []

    stateReducer.fieldWidgets.forEach((field: Field) => {
      if (form.id_fields?.includes(field.name)) {
        idFields.push(field)
      } else {
        regularFields.push(field)
      }
    })

    const formName = form.label && patientID.study ? form.label[patientID.study] : form.name

    finalComponent = (
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
        { [...idFields, ...regularFields].map((field: Field) => 
            <RenderedField
              key={field.name}
              field={field}
              validators={getFieldValidators(field, stateReducer.requiredFields, stateReducer.mutexFields)}
              updateValue={updateField}
              isReset={formWasCleared}
              values={valuesRef.current}
              study={patientID.study}
              required={stateReducer.requiredFields.includes(field.name)}
              disabled={!idFields.includes(field) && fieldIsDisabled(valuesRef.current, field.enablingConditions)}
              notifyError={() => {send('INVALID')}}
            />
          )
        }
        <ActionsGroup
          send={send}
          saveTemplate={executeSaveTemplate}
          disabled={
            !patientIdentifierIsNotEmpty()
            || state.matches('failure')
            || state.matches('invalid')
          }
        />
      </Form>
    )
  } else if (state.matches('error')) {
    finalComponent = (
      <Message warning>
        <Message.Header>Something went wrong</Message.Header>
        <p>Restart the page, then try again.</p>
      </Message> 
    )
  }

  return finalComponent
};

function RenderedField({
  field,
  validators,
  updateValue, 
  isReset,
  notifyError,
  values = {},
  study = null,
  required = false,
  disabled = false
} : {
  field: Field,
  validators: Validator[],
  updateValue: (field: any, value: FieldValue) => void,
  isReset: boolean,
  notifyError: () => void|undefined,
  values: { [key: string]: FieldValue },
  study: string|null,
  required: boolean,
  disabled: boolean
}) {
  let component = <></>
  const label = findLabel(field, values, study)
  const value = values.hasOwnProperty(field.name) ? values[field.name] : ""

  switch (field.component.toLowerCase()) {
    case 'input':
      if (field.type.toLowerCase() === 'textarea') {
        component = <TextareaField
          label={label}
          value={value as string}
          defaultValue={""}
          field={field}
          readonly={false}
          required={required}
          disabled={disabled}
          validators={validators}
          onChange={updateValue}
          notifyError={notifyError}
          isReset={isReset}
        />
      } else {
        component = <InputField 
          field={field}
          label={label} 
          value={value} 
          defaultValue="" 
          disabled={disabled}
          readonly={false}
          required={required}
          validators={validators}
          type={field.type}
          onChange={updateValue}
          notifyError={notifyError}
          isReset={isReset}
        />
      }
      break
    case 'select':
      component = <SelectField
        multiple={field.type === 'multiple'}
        options={field.options as string[]}
        field={field}
        label={label}
        value={value}
        defaultValue={""}
        disabled={disabled}
        readonly={false}
        required={required}
        validators={validators}
        onClick={updateValue}
        onChange={updateValue}
        notifyError={notifyError}
        isReset={isReset}
      />
      break
  }
  return component
}

function ActionsGroup(
  {disabled, send, saveTemplate}
  : Readonly<{disabled:boolean, send: (value: string) => void, saveTemplate: () => void}>)
{
  return (
    <Button.Group size="large" fluid widths={3}>
      <Button
        size='large' 
        onClick={ () => send('CLEAR') }
        fluid
        icon='trash'
        color='red'
        content='CLEAR FORM'
      />
      <Button.Or />
      <Button 
        content="SAVE TEMPLATE"
        color="black"
        icon="save"
        onClick={() => { saveTemplate() }
      }
      />
      <Button.Or />
      <Button icon="send" content="FINALIZE" color="teal"
        disabled={disabled}
        onClick={() => { send('SUBMIT') }}
      />
    </Button.Group>
  )
}

function ValidationErrorMessage({ reducer }: Readonly<{ reducer: FormReducer }>) {
  const labels = useStudyLabels()
  return (
    <Message negative>
      <Message.Header>Form has errors, please review:</Message.Header>
      <List>
        {
          reducer.validationErrors
          .filter((error: ValidationError) => error.type === 'required')
          .map((error: ValidationError) => (
              <ListItem key={`error-${error.field}`}>
                <ListIcon name="exclamation" />
                <ListContent>{`${labels[error.field]} is required`}</ListContent>
              </ListItem>
            )
          )
        }
        {
          reducer.mutexFields.length > 0 && 
          <ListItem key="error-mutex">
            <ListIcon name="exclamation" />
            <ListContent>{
              "Only one of " + reducer.validationErrors
              .filter((error: ValidationError) => error.type === 'mutex')
              .map((error: ValidationError) => error.field)
              .map((field: string) => labels[field])
              .join(', ') + " is needed"  
            }</ListContent>
          </ListItem>
        }
      </List>
    </Message>
  )
}
