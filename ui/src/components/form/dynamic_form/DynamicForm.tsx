import React, { useReducer } from "react";
import { useMachine } from "@xstate/react";
import { initialState, formReducer, updateWidgets, updateRequiredFields, updateExclusiveFields, fillForm, updateDraftId, clearForm, clearDraftId, clearDraftDate, clearTemplateDate, clearSubmissionDate, updateDraftDate, updateTemplateDate, updateSubmissionDate } from "./dependencies/reducer";
import { formStateMachine } from "./dependencies/stateMachine";
import { useApolloClient } from "@apollo/client";
import { Button, Form, Header, Icon, List, ListContent, ListIcon, ListItem, Message, Modal } from 'semantic-ui-react'
import { CreateSubmission, CreateTemplate, CreateUserSubmissionConnection, DeleteDraft, FieldData, FindDraft, FindOrCreatePatient, FormIDFields, RootForm, UpdateOrCreateDraft } from "./queries/form";
import { InputField } from "./fields/input";
import { SelectField } from "./fields/select";
import { Validator, FieldValue, DynamicFormProps, Field, ValidationError, DynamicFormModalProps, ModalEvent } from "./types";
import { getFieldValidators } from "./validation/field";
import { TextareaField } from "./fields/textarea";
import { fieldIsDisabled, findLabel, getFilledFields } from "./utils/field";
import { TemplateTable } from "../table/TemplateTable";
import { SubmissionTable } from "../table/SubmissionTable";
import { isFormValid, showValidationErrors } from "./validation/form";
import { usePatientID } from "../../layout/context";

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
  const [state, send] = useMachine(formStateMachine, {
    actions: {
      executeClearForm,
      showModal,
      showValidationErrors: () => showValidationErrors(reducer, dispatch),
    },
    services: {
      initializeForm,
      saveDraft,
      executeSubmitForm: submitForm,
    },
    guards: {
      isFormValid: () => isFormValid(reducer, dispatch),
    }
  });
  // initialise auxiliary state, context or ref variables
  const [formWasCleared, setFormWasCleared] = React.useState(false)
  const [openModal, setOpenModal] = React.useState(false)
  const [modalTitle, setModalTitle] = React.useState('')
  const [modalContent, setModalContent] = React.useState('')
  const [modalError, setModalError] = React.useState<boolean|undefined>(false)
  const [reloadSubmissions, setReloadSubmissions] = React.useState(false)
  const patientID = usePatientID()
  const patientIdentifierRef = React.useRef(patientID)
  const valuesRef = React.useRef<{[key: string]: FieldValue}>({})

  function updateField(field: Field, value: FieldValue) {
    // updateFieldValue(dispatch, field, value)
    valuesRef.current[field.name] = value
    send('CHANGE')
  }

  // query for field data
  const gqlClient = useApolloClient();
  const getFieldData = async () => {
    const fields: any[] = []
    const rootQuery = await gqlClient.query({
      query: RootForm,
      variables: {
        study: patientIdentifierRef.current.study
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
          study: patientID.study,
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

    updateWidgets(dispatch, fields.filter((field: Field) => !excluded_fields.includes(field.name)))
    if (form.required_fields) {
      const requiredFields = patientIdentifierRef.current.study && form.required_fields ? form.required_fields[patientIdentifierRef.current.study] ?? [] : form.required_fields?.default ?? []
      updateRequiredFields(dispatch, requiredFields.filter((field: string) => !excluded_fields.includes(field)))
    }
    if (form.mutex_fields) {
      const mutexFields = patientIdentifierRef.current.study && form.mutex_fields ? form.mutex_fields[patientIdentifierRef.current.study] ?? [] : form.mutex_fields?.default ?? []
      updateExclusiveFields(dispatch, mutexFields.filter((field: string) => !excluded_fields.includes(field)))
    }
  };

  const loadDraft = async () => {
    const draftInfo = {
      form_id: form.formID,
      patient_id: JSON.stringify(patientIdentifierRef.current)
    }
    const draftQuery = await gqlClient.query({
      query: FindDraft,
      variables: {
        where: draftInfo
      }
    })
    const data = draftQuery.data?.formDrafts || []

    if(data.length > 0) {
      fillForm(dispatch, JSON.parse(data[0].data))
      updateDraftId(dispatch, data[0].draft_id)
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
    clearForm(dispatch)
    clearDraftId(dispatch)
    clearDraftDate(dispatch)
    clearTemplateDate(dispatch)
    clearSubmissionDate(dispatch)
    setFormWasCleared(true)
    setTimeout(() => {
      setFormWasCleared(false)
    }, 0) // ugly hack to restore the form cleared flag semi-synchronously
  }

  async function saveDraft() {
    const date = new Date()
    const millisecondsDifference = (date.getTime() - reducer.lastDraftUpdate?.getTime()) || 0
    const secondsDifference = millisecondsDifference / 1000
    try {
      if (secondsDifference >= 10 || !reducer.lastDraftUpdate) {
        const { data: draft } = await gqlClient.mutate({
          mutation: UpdateOrCreateDraft,
          variables: {
            input: {
              form_id: form.formID,
              data: JSON.stringify(getFilledFields(reducer.fieldValues)),
              patient_id: JSON.stringify(patientIdentifierRef.current)
            }
          }
        })
        updateDraftId(dispatch, draft.updateOrCreateDraft.draft_id)
        updateDraftDate(dispatch)
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
            data: JSON.stringify(getFilledFields(reducer.fieldValues)),
            patient_id: JSON.stringify(patientIdentifierRef.current)
          }
        }
      })
      updateTemplateDate(dispatch)
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

  const patientIdentifierIsNotEmpty = () => {
    return patientIdentifierRef.current.submitter_donor_id.trim() !== '' && patientIdentifierRef.current.program_id.trim() !== ''
  }

  async function submitForm() {
    const createSubmissionInput = () => {
      const valuesToSubmit = getFilledFields(reducer.fieldValues)

      return {
        form_id: form.formID,
        patient: {
          connect: {
            where: {
              node: {
                patient_id: patientIdentifierRef.current.submitter_donor_id,
                program_id: patientIdentifierRef.current.program_id,
                study: patientIdentifierRef.current.study
              }
            }
          }
        },
        fields: {
          create: Object.keys(valuesToSubmit).map(
            function(key: string) {
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
      const patientMutation = await gqlClient.mutate({
        mutation: FindOrCreatePatient,
        variables: {
          patient_id: patientIdentifierRef.current.submitter_donor_id,
          program_id: patientIdentifierRef.current.program_id,
          study: patientIdentifierRef.current.study
        }
      })
      if (patientMutation.data?.findOrCreatePatient) { // submit only if patient was successfully found or created
        const submissionQuery = await gqlClient.mutate({
          mutation: CreateSubmission,
          variables: {
            input: createSubmissionInput()
          }
        })
  
        const submissionID: string = submissionQuery.data.createSubmissions.submissions[0].submission_id
        const postCreateMutations: { mutation: Promise<any>, label: string }[] = []
        postCreateMutations.push({
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
        postCreateMutations.push({
          label: 'ConnectUser',
          mutation: gqlClient.mutate({
            mutation: CreateUserSubmissionConnection,
            variables: {
              submissionID
            }
          })
        })
        const postCreateResults = await Promise.allSettled(postCreateMutations.map(({ mutation }) => mutation))
        postCreateResults.forEach((result, index) => {
          const { label } = postCreateMutations[index]
          if (result.status === 'fulfilled') {
            if (label === 'ConnectUser') {
              console.log(`Connected user to submission ${submissionID}`)
            } else {
              clearDraftId(dispatch)
              clearDraftDate(dispatch)
              console.log('Draft has been deleted')
            }
          } else if (label === 'ConnectUser') {
            console.log('Could not connect user to submission')
          }
        })
        updateSubmissionDate(dispatch)
        setModalTitle('Success')
        setModalContent('The form has been submitted!')
        setModalError(false)
        setOpenModal(true)
        forceReloadSubmissions()
        console.log('Form submitted!')
      }
    } catch (error: any) {
      console.log(`Error while submitting the form: ${error.message}`)
      send({ type: 'FAILURE', title: 'Error', content: 'There was an error while submitting the form, please try again', error: true})
    }
  }

  // render control variables and effects
  const canRender = reducer.fieldWidgets.length > 0 && !state.matches('loading')

  React.useEffect(() => {
    if (patientIdentifierRef.current !== patientID) {
      send('CLEAR')
      if (patientIdentifierIsNotEmpty()) {
        loadDraft()
      }
      patientIdentifierRef.current = patientID
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
    const labels: {[key: string]: string} = {}

    reducer.fieldWidgets.forEach((field: Field) => {
      if (form.id_fields?.includes(field.name)) {
        idFields.push(field)
      } else {
        regularFields.push(field)
      }
      labels[field.name] = findLabel(field, reducer.fieldValues, patientIdentifierRef.current.study)
    })

    finalComponent = (
      <>
        <TemplateTable
          key={`Templates-${reducer.lastTemplateUpdate}`}
          formID={form.formID}
          patientIdentifier={patientID}
          headers={labels}
          clearForm={executeClearForm}
          fillForm={(values: any) => fillForm(dispatch, values)}
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
          patientIdentifier={patientID}
          clearForm={executeClearForm}
          fillForm={(values: any) => fillForm(dispatch, values)}
          reload={reloadSubmissions}
          setLastSubmissionUpdate={updateSubmissionDate}
          setOpenModal={setOpenModal}
          setModalTitle={setModalTitle}
          setModalContent={setModalContent}
          setModalError={setModalError}
        />
        <Form>
          <h2 style={{marginTop: '10px', textAlign: 'center'}}>{form.label && patientID.study ? form.label[patientID.study]: form.name}</h2>
          {
            reducer.lastDraftUpdate && 
            <>
              <span style={{float: 'right'}}>
                Patient {patientID.submitter_donor_id}: {form.name} form last autosaved at: {reducer.lastDraftUpdate.toString()}
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
                validators: getFieldValidators(field, reducer.requiredFields, reducer.mutexFields),
                updateValue: updateField,
                formWasCleared,
                values: reducer.fieldValues,
                study: patientID.study,
                required: reducer.requiredFields.includes(field.name),
                notifyError: () => { send('INVALID') }
              })
            ))
          }
          { regularFields.map((field: Field) => (
              renderField({
                field: field,
                validators: getFieldValidators(field, reducer.requiredFields, reducer.mutexFields),
                // updateValue: updateField,
                updateValue: updateField,
                formWasCleared,
                values: reducer.fieldValues,
                study: patientID.study,
                required: reducer.requiredFields.includes(field.name),
                notifyError: () => { send('INVALID') }
              })
            ))
          }
          <ActionsGroup
            send={send}
            saveTemplate={saveTemplate}
            disabled={
              !patientIdentifierIsNotEmpty()
              || state.matches('failure')
              || state.matches('invalid')
            }
          />
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
