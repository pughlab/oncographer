import React, { useReducer, useContext } from "react";
import { useMachine } from "@xstate/react";
import { initialState, formReducer } from "./dependencies/reducer";
import { formStateMachine } from "./dependencies/stateMachine";
import { useApolloClient } from "@apollo/client";
import { Button, Form, Header, Icon, List, ListContent, ListIcon, ListItem, Message, Modal } from 'semantic-ui-react'
import { CreateSubmission, CreateTemplate, CreateUserSubmissionConnection, DeleteDraft, FieldData, FindDraft, FormIDFields, RootForm, UpdateOrCreateDraft } from "./queries/form";
import { InputField } from "./fields/input";
import { SelectField } from "./fields/select";
import { Validator, FieldValue, DynamicFormProps, Field, FormDraft, ValidationError, DynamicFormModalProps, ModalEvent } from "./types";
import { notEmpty, number, min, max, regex, integer, date } from "./validation/validate";
import { TextareaField } from "./fields/textarea";
import { fieldIsDisabled, findLabel, isFalsy } from "./utils/field";
import { PatientIdentifierContext } from "../../Portal";
import { TemplateTable } from "../table/TemplateTable";
import { SubmissionTable } from "../table/SubmissionTable";

const renderField = ({
  field,
  validators,
  updateValue, 
  formWasCleared,
  notifyError,
  values = {},
  study = null,
  required = false,
} : {
  field: Field,
  validators: Validator[],
  updateValue: (field: any, value: FieldValue) => void,
  formWasCleared: boolean,
  notifyError: () => void|undefined,
  values: { [key: string]: FieldValue },
  study: string|null,
  required: boolean,
}) => {
  let component = <></>
  const label = findLabel(field, values, study)
  const value = values.hasOwnProperty(field.name) ? values[field.name] : ""
  switch (field.component.toLowerCase()) {
    case 'input':
      if (field.type.toLowerCase() === 'textarea') {
        component = <TextareaField
          key={field.name}
          label={label}
          value={value}
          defaultValue={""}
          field={field}
          readonly={false}
          required={required}
          disabled={fieldIsDisabled(values, field.enablingConditions)}
          validators={validators}
          onChange={updateValue}
          notifyError={notifyError}
        />
      } else {
        component = <InputField 
          key={field.name} 
          field={field}
          label={label} 
          value={value} 
          defaultValue="" 
          disabled={fieldIsDisabled(values, field.enablingConditions)}
          readonly={false}
          required={required}
          validators={validators}
          type={field.type}
          onChange={updateValue}
          notifyError={notifyError}
          formWasCleared={formWasCleared}
        />
      }
      break
    case 'select':
      component = <SelectField
        key={field.name}
        multiple={field.type === 'multiple'}
        options={field.options as string[]}
        field={field}
        label={label}
        value={value}
        defaultValue={""}
        disabled={fieldIsDisabled(values, field.enablingConditions)}
        readonly={false}
        required={required}
        validators={validators}
        onClick={updateValue}
        onChange={updateValue}
        notifyError={notifyError}
        formWasCleared={formWasCleared}
      />
      break
  }
  return component
}

const DynamicFormModal: React.FC<DynamicFormModalProps> = ({ open, onClose, title, content, error = false }) => {
  return (
    <Modal open={open} onClose={onClose} closeIcon>
      <Header icon>
        <Icon name={error ? "times circle" : "check circle"} color={error ? "red" : "green"}/>
        {title}
      </Header>
      <Modal.Content>
        <p>{content}</p>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose} color="teal">
          <Icon name="close" /> Close
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export const DynamicForm = ({ form, excluded_fields = [] }: DynamicFormProps) => {
  // initialise and configure reducer and state machine
  const [reducer, dispatch] = useReducer(formReducer, initialState);
  const { patientIdentifier } = useContext(PatientIdentifierContext)

  function updateFieldValue(field: Field, value: FieldValue) {
    dispatch({
      type: "UPDATE_FIELD_VALUES",
      payload: {
        [field.name]: value
      }
    })
    send('CHANGE')
  }

  function fillForm(values: unknown) {
    dispatch({
      type: "FILL_FORM",
      payload: values
    })
  }

  function clearForm() {
    dispatch({
      type: "CLEAR_FORM"
    })
  }

  function updateDraftId(draftId: string) {
    dispatch({
      type: "UPDATE_DRAFT_ID",
      payload: draftId
    })
  }

  function clearDraftId() {
    dispatch({
      type: "UPDATE_DRAFT_ID",
      payload: null
    })
  }

  function updateDraftDate() {
    dispatch({
      type: "UPDATE_DRAFT_DATE"
    })
  }

  function clearDraftDate() {
    dispatch({
      type: "CLEAR_DRAFT_DATE"
    })
  }

  function updateDraft(draft: FormDraft) {
    dispatch({
      type: "UPDATE_DRAFT",
      payload: draft
    })
  }

  function clearDraft() {
    dispatch({
      type: "UPDATE_DRAFT",
      payload: null
    })
  }

  function updateTemplateDate() {
    dispatch({
      type: "UPDATE_TEMPLATE_DATE"
    })
  }

  function clearTemplateDate() {
    dispatch({
      type: "CLEAR_TEMPLATE_DATE"
    })
  }

  function updateSubmissionDate() {
    dispatch({
      type: "UPDATE_SUBMISSION_DATE"
    })
  }

  function clearSubmissionDate() {
    dispatch({
      type: "CLEAR_SUBMISSION_DATE"
    })
  }

  function updateWidgets(widgets: Field[]) {
    dispatch({
      type: "UPDATE_WIDGETS",
      payload: widgets
    })
  }

  function updateExclusiveFields(fieldNames: string[]) {
    dispatch({
      type: "UPDATE_EXCLUSIVE_FIELDS",
      payload: fieldNames
    })
  }

  function updateRequiredFields(fieldNames: string[]) {
    dispatch({
      type: "UPDATE_REQUIRED_FIELDS",
      payload: fieldNames
    })
  }

  function updateValidationErrors(errors: ValidationError[]) {
    dispatch({
      type: "UPDATE_VALIDATION_ERRORS",
      payload: errors
    })
  }

  const [state, send] = useMachine(formStateMachine, {
    actions: {
      executeClearForm,
      storeDraft,
      showModal,
      showValidationErrors,
    },
    services: {
      initializeForm,
      saveDraft,
      executeSubmitForm: submitForm,
    },
    guards: {
      isFormValid,
    }
  });

  // initialise auxiliary state or ref variables
  const [formWasCleared, setFormWasCleared] = React.useState(false)
  const [openModal, setOpenModal] = React.useState(false)
  const [modalTitle, setModalTitle] = React.useState('')
  const [modalContent, setModalContent] = React.useState('')
  const [modalError, setModalError] = React.useState<boolean|undefined>(false)
  const [reloadSubmissions, setReloadSubmissions] = React.useState(false)

  // query for field data
  const gqlClient = useApolloClient();
  const getFieldData = async () => {
    const fields: any[] = []
    const rootQuery = await gqlClient.query({
      query: RootForm,
      variables: {
        study: patientIdentifier.study
      }
    })
    const root = rootQuery.data.GetRootForm
    const isRootForm = root.formID === form.formID
    const fieldQueries: { query: Promise<any>, label: string }[] = []
    fieldQueries.push({
      query: gqlClient.query({
        query: FormIDFields,
        variables: {
          where: {
            formID: root.formID,
          },
        }
      }),
      label: 'FormIDFields'
    })
    if (!isRootForm) {
      fieldQueries.push({
        query: gqlClient.query({
          query: FormIDFields,
          variables: {
            where: {
              formID: form.formID,
            },
          },
        }),
        label: 'FormIDFields'
      })
    }
    fieldQueries.push({
      query: gqlClient.query({
        query: FieldData,
        variables: {
          id: form.formID,
          study: patientIdentifier.study,
        },
      }),
      label: 'FieldData'
    })

    // run the queries and save the results as field widgets
    const fieldResults = await Promise.allSettled(fieldQueries.map(({ query }) => query));
    fieldResults.forEach((result, index) => {
      const { label } = fieldQueries[index]
      if (result.status === 'fulfilled') {
        if (label === 'FormIDFields') {
          result.value.data.forms[0].fieldsConnection.edges.forEach((field: any) => {
            fields.push(field.node)
          })
        } else if (label === 'FieldData') {
          result.value.data.GetFormFields.forEach((field: any) => {
            fields.push(field)
          })
        }
      } else if (result.status === 'rejected') {
        console.log(`Query failed. Reason is ${result.reason}`)
      }
    })

    updateWidgets(fields.filter((field: Field) => !excluded_fields.includes(field.name)))
    if (form.required_fields) {
      const requiredFields = patientIdentifier.study && form.required_fields ? form.required_fields[patientIdentifier.study] : form.required_fields?.default ?? []
      updateRequiredFields(requiredFields.filter((field: string) => !excluded_fields.includes(field)))
    }
    if (form.mutex_fields) {
      const mutexFields = patientIdentifier.study && form.mutex_fields ? form.mutex_fields[patientIdentifier.study] : form.mutex_fields?.default ?? []
      updateExclusiveFields(mutexFields.filter((field: string) => !excluded_fields.includes(field)))
    }
  };

  const loadDraft = async () => {
    const draftInfo = {
      form_id: form.formID,
      patient_id: JSON.stringify(patientIdentifier)
    }
    const draftQuery = await gqlClient.query({
      query: FindDraft,
      variables: {
        where: draftInfo
      }
    })
    const data = draftQuery.data?.formDrafts || []

    if(data.length > 0) {
      fillForm(JSON.parse(data[0].data))
      updateDraftId(data[0].draft_id)
    }
  }
  
  async function initializeForm() {
    try {
      await getFieldData()
    } catch (error: any) {
      console.log(`Could not initialize the form: ${error.message}`)
      console.log(error.stack)
    }
  }

  function executeClearForm() { 
    clearForm()
    clearDraftId()
    clearDraft()
    clearDraftDate()
    clearTemplateDate()
    clearSubmissionDate()
    setFormWasCleared(true)
    setTimeout(() => {
      setFormWasCleared(false)
    }, 0) // ugly hack to restore the form cleared flag semi-synchronously
  }

  function storeDraft() {
    updateDraft({
      form_id: form.formID,
      data: JSON.stringify(reducer.fieldValues),
      patient_id: JSON.stringify(patientIdentifier)
    })
    console.log('Draft updated')
  }

  async function saveDraft() {
    const date = new Date()
    const millisecondsDifference = (date.getTime() - reducer.lastDraftUpdate?.getTime()) || 0
    const secondsDifference = millisecondsDifference / 1000
    try {
      if (reducer.draft && (secondsDifference >= 10 || !reducer.lastDraftUpdate)) {
        const { data: draft } = await gqlClient.mutate({
          mutation: UpdateOrCreateDraft,
          variables: { input: reducer.draft }
        })
        updateDraftId(draft.updateOrCreateDraft.draft_id)
        updateDraftDate()
        console.log('Draft saved')
      }
    } catch (error: any) {
      console.log(`Error while saving draft: ${error.message}`)
    }
  }

  async function saveTemplate() {
    try {
      await gqlClient.mutate({
        mutation: CreateTemplate,
        variables: { 
          input: {
            form_id: form.formID,
            data: JSON.stringify(reducer.fieldValues),
            patient_id: JSON.stringify(patientIdentifier)
          }
        }
      })
      updateTemplateDate()
      console.log('Template saved')
      setModalTitle('Success')
      setModalContent('The template has been saved.')
      setModalError(false)
      setOpenModal(true)
      send('SAVED')
    } catch (error: any) {
      console.log(`Error while saving the template: ${error.message}`)
      send({ type: 'FAILED', title: 'Error', content: 'Could not save the template, please try again.', error: true })
    }
  }

  function showModal(_context: any, event: ModalEvent) {
    setModalTitle(event.title)
    setModalContent(event.content)
    setModalError(event.error)
    setOpenModal(true)
  }

  function forceReloadSubmissions() {
    setReloadSubmissions((prev: boolean) => !prev)
  }

  // create separate handlers for validating and submitting the form
  // the validator here is for the form as a whole, fields will have their own validation logic
  const getFieldValidators = (field: Field) => {
    const validators: Validator[] = []

    if (reducer.requiredFields.includes(field.name) && !reducer.mutexFields.includes(field.name)) {
      validators.push(notEmpty)
    }
    
    if (field.type.toLowerCase() === 'number' || field.type.toLowerCase() === 'integer') {
      validators.push(number)
    }

    if (field.type.toLowerCase() === 'integer') {
      validators.push(integer)
    }

    if (field.minValue) {
      validators.push(min(field.minValue))
    }

    if (field.maxValue) {
      validators.push(max(field.maxValue))
    }

    if (field.regex) {
      validators.push(regex(new RegExp(field.regex), "This value is invalid"))
    }

    if (field.type.toLowerCase() === 'date' || field.type.toLowerCase() === 'month') {
      validators.push(date)
    }

    return validators
  }

  const patientIdentifierIsNotEmpty = () => {
    return patientIdentifier.submitter_donor_id.trim() !== '' && patientIdentifier.program_id.trim() !== ''
  }

  const getFilledFields = () => {
    return Object.keys(reducer.fieldValues)
      .filter((field) => !isFalsy(reducer.fieldValues[field]))
  }

  const getDisabledFields = () => {
    const disabledFields: string[] = []
    reducer.fieldWidgets.forEach((field: Field) => {
      if (fieldIsDisabled(reducer.fieldValues, field.enablingConditions)) {
        disabledFields.push(field.name)
      }
    })
    return disabledFields
  }

  const validateRequiredFields = () => {
    const filledFields = getFilledFields()
    const disabledFields = getDisabledFields()
    const isValid = reducer.requiredFields 
      ? reducer.requiredFields.filter((field: string) => !disabledFields.includes(field))
        .reduce(
          (acc: boolean, field: string) => acc && filledFields.includes(field),
          true
        )
      : true
    return isValid
  }

  const validateMutexFields = () => {
    let isValid = true

    if (reducer.mutexFields.length > 0) {
      const filledFields = getFilledFields()
      const filledMutexFields: {[key:string]: string} = {}

      filledFields.forEach((field) => {
        if (reducer.mutexFields?.includes(field) && !isFalsy(reducer.fieldValues[field])) {
          filledMutexFields[field] = reducer.fieldValues[field]
        }
      })

      isValid = Object.keys(filledMutexFields).length === 1
    }

    return isValid
  }

  function isFormValid() {
    const isValid = [validateRequiredFields, validateMutexFields].every((f) => f())

    if (isValid) {
      updateValidationErrors([])
    }

    return isValid
  }

  function showValidationErrors() {
    const errors: ValidationError[] = []
    const filledFields = getFilledFields()
    const disabledFields = getDisabledFields()
    const emptyFields: string[] = reducer.requiredFields
      .filter((field: string) => !filledFields.includes(field))
      .filter((field: string) => !disabledFields.includes(field))
    const filledMutexFields = reducer.mutexFields.filter((field: string) => filledFields.includes(field))

    emptyFields.forEach((field: string) => {
      errors.push({ field, type: 'required'})
    })
    filledMutexFields.forEach((field: string) => {
      errors.push({ field, type: 'mutex'})
    })
    updateValidationErrors(errors)
  }

  async function submitForm() {
    const createSubmissionInput = () => {
      const valuesToSubmit = Object.keys(reducer.fieldValues).reduce((newObj: {[key: string]: FieldValue}, key: string) => {
        const value = reducer.fieldValues[key]

        if(!isFalsy(value)) {
          newObj[key] = value
        }

        return newObj
      }, {})

      return {
        form_id: form.formID,
        patient: {
          connect: {
            where: {
              node: {
                patient_id: patientIdentifier.submitter_donor_id,
                program_id: patientIdentifier.program_id,
                study: patientIdentifier.study
              }
            }
          }
        },
        fields: {
          create: Object.keys(valuesToSubmit).map(
            function(key) {
              return {
                node: {
                  key: key,
                  value: valuesToSubmit[key]
                }
              }
            }
          )
        }
      }
    }

    try {
      const submissionQuery = await gqlClient.mutate({
        mutation: CreateSubmission,
        variables: {
          input: createSubmissionInput()
        }
      })

      const submissionID: string = submissionQuery.data.createSubmissions.submissions[0].submission_id
      const cleanupMutations: { mutation: Promise<any>, label: string }[] = []
      cleanupMutations.push({
        mutation: gqlClient.mutate({
          mutation: DeleteDraft,
          variables: {
            where: {
              draft_id: reducer.draftID
            }
          }
        }),
        label: 'DeleteDraft'
      })
      cleanupMutations.push({
        label: 'ConnectUser',
        mutation: gqlClient.mutate({
          mutation: CreateUserSubmissionConnection,
          variables: {
            submissionID
          }
        })
      })
      const cleanupResults = await Promise.allSettled(cleanupMutations.map(({ mutation }) => mutation))
      cleanupResults.forEach((result, index) => {
        const { label } = cleanupMutations[index]
        if (result.status === 'fulfilled') {
          if (label === 'ConnectUser') {
            console.log(`Connected user to submission ${submissionID}`)
          } else {
            clearDraftId()
            clearDraftDate()
            clearDraft()
            console.log('Draft has been deleted')
          }
        } else if (label === 'ConnectUser') {
          console.log('Could not connect user to submission')
        }
      })
      updateSubmissionDate()
      setModalTitle('Success')
      setModalContent('The form has been submitted!')
      setModalError(false)
      setOpenModal(true)
      forceReloadSubmissions()
      console.log('Form submitted!')
    } catch (error: any) {
      console.log(`Error while submitting the form: ${error.message}`)
      send({ type: 'FAILURE', title: 'Error', content: 'There was an error while submitting the form, please try again', error: true})
    }
  }

  // render control variables and effects
  const canRender = reducer.fieldWidgets.length > 0 && !state.matches('loading')

  console.log(state.value)

  React.useEffect(() => {
    send('CLEAR')
    if (patientIdentifierIsNotEmpty()) {
      loadDraft()
    }
  }, [patientIdentifier])

  // final result
  let finalComponent = <></>

  if (canRender && !state.matches('error')) {
    const idFields: Field[] = []
    const regularFields: Field[] = []
    const labels: {[key: string]: string} = {}

    reducer.fieldWidgets.forEach((field: Field) => {
      if (form.id_fields?.includes(field.name)) {
        idFields.push(field)
      } else {
        regularFields.push(field)
      }
      labels[field.name] = findLabel(field, reducer.fieldValues, patientIdentifier.study)
    })

    finalComponent = (
      <>
        <TemplateTable
          key={`Templates-${reducer.lastTemplateUpdate}`}
          formID={form.formID}
          patientIdentifier={patientIdentifier}
          headers={labels}
          clearForm={clearForm}
          fillForm={fillForm}
          setLastTemplateUpdate={updateTemplateDate}
          setOpenModal={setOpenModal}
          setModalTitle={setModalTitle}
          setModalContent={setModalContent}
          setModalError={setModalError}
        />
        <SubmissionTable
          key={reducer.lastSubmissionUpdate ?? new Date()}
          formID={form.formID}
          headers={labels}
          patientIdentifier={patientIdentifier}
          clearForm={clearForm}
          fillForm={fillForm}
          reload={reloadSubmissions}
          setLastSubmissionUpdate={updateSubmissionDate}
          setOpenModal={setOpenModal}
          setModalTitle={setModalTitle}
          setModalContent={setModalContent}
          setModalError={setModalError}
        />
        <Form>
          <h2 style={{marginTop: '10px', textAlign: 'center'}}>{form.label && patientIdentifier.study ? form.label[patientIdentifier.study]: form.name}</h2>
          {
            reducer.lastDraftUpdate && 
            <>
              <span style={{float: 'right'}}>
                Patient {patientIdentifier.submitter_donor_id}: {form.name} form last autosaved at: {reducer.lastDraftUpdate.toString()}
              </span>
              <br/>
            </>
          }
          {
            state.matches('invalid') && (
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
          { idFields.map((field: Field) => (
              renderField({
                field: field,
                validators: getFieldValidators(field),
                updateValue: updateFieldValue,
                formWasCleared,
                values: reducer.fieldValues,
                study: patientIdentifier.study,
                required: reducer.requiredFields.includes(field.name),
                notifyError: () => { send('INVALID') }
              })
            ))
          }
          { regularFields.map((field: Field) => (
              renderField({
                field: field,
                validators: getFieldValidators(field),
                updateValue: updateFieldValue,
                formWasCleared,
                values: reducer.fieldValues,
                study: patientIdentifier.study,
                required: reducer.requiredFields.includes(field.name),
                notifyError: () => { send('INVALID') }
              })
            ))
          }
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
            <Button content="SAVE TEMPLATE" color="black" icon="save" onClick={() => { 
                saveTemplate()
              }
            }
            />
            <Button.Or />
            <Button icon="send" content="FINALIZE" color="teal"
              disabled={!patientIdentifierIsNotEmpty() || state.matches('failure') || state.matches('invalid')}
              onClick={() => { send('SUBMIT') }}
            />
          </Button.Group> 
        </Form>
        <DynamicFormModal 
          open={openModal} 
          onClose={() => {
            setOpenModal(false)
            send('CANCEL')
          }}
          title={modalTitle}
          content={modalContent}
          error={modalError}
        />
      </>
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
