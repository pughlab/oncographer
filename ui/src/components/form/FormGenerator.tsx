import React, { useContext, useEffect, useReducer, useState } from "react"
import { Form, Divider, Header, Icon, Button } from "semantic-ui-react"
import { useMutation, useQuery, useApolloClient } from "@apollo/client"
import { useMachine } from "@xstate/react"
import * as R from 'remeda'

import { validateInputs, fieldIsDisabled, createSubmissionInput, findDisplayName, createDraftInfo, transformToDate } from './utils'
import { FindDraft, UpdateOrCreateDraft, DeleteDraft, CreateSubmission, CreateUserSubmissionConnection, FieldData, FindOrCreatePatient, FormIDFields, CreateTemplate } from "./queries/query"
import { SubmissionTable } from "./table/SubmissionTable"
import { ActiveSubmissionContext, PatientFoundContext, PatientIdentifierContext } from "../Portal"
import { zodifyField } from "./validate/validator"
import { BasicErrorMessage } from "../common/BasicErrorMessage"
import { IDField } from "./fields/id"
import { DateInputField, InputField } from "./fields/input"
import { TextAreaField } from "./fields/textarea"
import { LargeSelectField, MultipleSmallSelectField, SmallSelectField } from "./fields/select"
import { CheckboxField } from "./fields/checkbox"
import { TemplateTable } from "./table/TemplateTable"
import { useDisplayNamesContext } from "../layout/FormFactory"
import { initialState, formReducer } from "./reducer"
import { formStateMachine } from "./xstate/form"

function renderField(field, patientIdentifier, state, label, updateErrorMessages, handleFieldChange) {
  let component = <></>

  const isDisabled = field.conditionals === null
    ? false
    : fieldIsDisabled(field.conditionals, state.fields)
  const isReadonly = field.readonly ?? false
  const errorMessage = isDisabled ? null : state.errorMessages[field.name]

  switch (String(field.component).toLowerCase()) {
    case "input":
      if (field.type === "month" || field.type === "date") {
        component = <DateInputField
          key={field.name}
          field={field}
          study={patientIdentifier.study}
          label={label}
          value={state.fields[field.name]}
          isDisabled={isDisabled}
          isReadonly={isReadonly}
          errorMessage={errorMessage}
          validator={state.validators[field.name]}
          updateErrorMessage={updateErrorMessages}
          updateValue={handleFieldChange}
        />
      } else if (field.type === "textarea") {
        component = <TextAreaField
          key={field.name}
          field={field}
          study={patientIdentifier.study}
          label={label}
          value={state.fields[field.name]}
          isDisabled={isDisabled}
          isReadonly={isReadonly}
          validator={state.validators[field.name]}
          errorMessage={errorMessage}
          updateErrorMessage={updateErrorMessages}
          updateValue={handleFieldChange}
        />
      } else {
        component = <InputField
          key={field.name}
          field={field}
          study={patientIdentifier.study}
          label={label}
          value={state.fields[field.name]}
          isDisabled={isDisabled}
          isReadonly={isReadonly}
          validator={state.validators[field.name]}
          errorMessage={errorMessage}
          updateErrorMessage={updateErrorMessages}
          updateValue={handleFieldChange}
        />
      }
      break
    case "select":
      if (state.options[field.name] === undefined) break;

      if (state.options[field.name].length <= 4) {
        component = field.type.toLowerCase() !== "multiple" ? <SmallSelectField
          key={field.name}
          field={field}
          study={patientIdentifier.study}
          label={label}
          isDisabled={isDisabled}
          isReadonly={isReadonly}
          errorMessage={errorMessage}
          options={state.options[field.name]}
          validator={state.validators[field.name]}
          value={state.fields[field.name]}
          updateErrorMessage={updateErrorMessages}
          updateValue={handleFieldChange}
        /> : <MultipleSmallSelectField 
          key={field.name}
          field={field}
          study={patientIdentifier.study}
          label={label}
          isDisabled={isDisabled}
          isReadonly={isReadonly}
          errorMessage={errorMessage}
          options={state.options[field.name]}
          validator={state.validators[field.name]}
          value={state.fields[field.name]}
          updateErrorMessage={updateErrorMessages}
          updateValue={handleFieldChange}
        />
      } else {
        component = <LargeSelectField
          key={field.name}
          field={field}
          study={patientIdentifier.study}
          label={label}
          isDisabled={isDisabled}
          isReadonly={isReadonly}
          errorMessage={errorMessage}
          options={state.options[field.name]}
          validator={state.validators[field.name]}
          value={state.fields[field.name]}
          updateErrorMessage={updateErrorMessages}
          updateValue={handleFieldChange}
        />
      }
      break
    case "checkbox":
      component = <CheckboxField
        key={field.name}
        field={field}
        study={patientIdentifier.study}
        label={label}
        isDisabled={isDisabled}
        isReadonly={isReadonly}
        errorMessage={errorMessage}
        validator={state.validators[field.name]}
        value={state.fields[field.name] ?? !!field.value}
        updateErrorMessage={updateErrorMessages}
        updateValue={handleFieldChange}
        checked={field.value ?? false}
      />
      break
    default:
      break;
  }
  return component
}

export function FormGenerator({ formMetadata, root }) {

  // State and context variables
  const [lastTemplateUpdate, setLastTemplateUpdate] = useState(`Templates-${new Date().toUTCString()}`)
  const [lastSubmissionUpdate, setLastSubmissionUpdate] = useState(`Submissions-${new Date().toUTCString()}`)

  const { patientIdentifier } = useContext(PatientIdentifierContext)
  const { activeSubmission } = useContext(ActiveSubmissionContext)
  const { patientFound, setPatientFound } = useContext(PatientFoundContext)
  const { displayNames, setDisplayNames } = useDisplayNamesContext()

  // avoid rendering warnings when updating the display names
  const updateDisplayNames = (newDisplayNames) => {
    setTimeout(() => {
      setDisplayNames(newDisplayNames)
    }, 0)
  }

  // Save a form draft if a draft has not been saved or if it has been saved
  // more than 10 seconds ago
  const attemptSaveDraft = async () => {
    const draftInfo = createDraftInfo(formMetadata.form_id, patientIdentifier, state, isRootForm)
    const date = new Date()
    const millisecondsDifference = (state.lastDraftUpdate?.getTime() - date.getTime()) || 0
    const secondsDifference = millisecondsDifference / 1000
    // only save if the draft has never been saved
    // or 10 seconds or more have passed since the last save
    if (secondsDifference >= 10 || !state.lastDraftUpdate) {
      await updateOrCreateDraft({
        variables: { input: draftInfo },
        onCompleted: (data) => {
          updateDraftID(data.updateOrCreateDraft.draft_id)
          updateDraftDate()
        }
      })
    }
  }
  
  // Reducer variables and associated functions
  const [state, dispatch] = useReducer(formReducer, initialState)
  const { fieldWidgets } = state
  const [snapshot, send] = useMachine(formStateMachine, {
    context: {
      data: state,
      intervalId: null
    },
    actions: {
      initializeForm: initializeForm,
      executeClearForm: clearForm,
      executeSubmit: submitForm,
      saveDraft: attemptSaveDraft
    },
    services: {
      initializeForm
    }
  })

  function updateValidators(validators) {
    dispatch({
      type: 'UPDATE_VALIDATORS',
      validators: validators
    })
  }

  function updateErrorMessages(errorMessages) {
    dispatch({
      type: 'UPDATE_ERROR_MESSAGES',
      errorMessages: errorMessages
    })
  }

  function updateConditions(conditions) {
    dispatch({
      type: 'UPDATE_CONDITIONS',
      conditions: conditions
    })
  }

  function updateOptions(options) {
    dispatch({
      type: 'UPDATE_OPTIONS',
      options: options
    })
  }

  function updatePatientID(id) {
    dispatch({
      type: 'UPDATE_PATIENT_ID',
      payload: id
    })
  }

  function updateFormIDs(id) {
    dispatch({
      type: 'UPDATE_FORM_IDS',
      payload: id
    })
  }

  function updateFields(field) {
    dispatch({
      type: 'UPDATE_FIELDS',
      payload: field
    })
  }

  function updateWidgets(widgets) {
    dispatch({
      type: 'UPDATE_WIDGETS',
      payload: widgets
    })
  }

  function fillForm(payload) {
    dispatch({
      type: 'FILL_FORM',
      payload: payload
    })
    send('CHANGE')
  }

  function updateDraftDate() {
    dispatch({ type: 'UPDATE_DRAFT_DATE' })
  }

  function clearDraftDate() {
    dispatch({ type: 'CLEAR_DRAFT_DATE' })
  }

  function handleFormIDChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_FORM_IDS',
      payload: { [name]: value }
    })
  }

  async function handleFieldChange(e) {
    const { name, value } = e.target
    if (!R.equals(state.fields[name], value)) {
      dispatch({
        type: 'UPDATE_FIELDS',
        payload: { [name]: value instanceof Date || typeof value === "boolean" || isNaN(value) ? value : Number(value) }
      })
    }
  }

  function updateDraftID(payload) {
    dispatch({
      type: 'UPDATE_DRAFT_ID',
      payload: payload
    })
  }

  function clearForm() {
    dispatch({
      type: 'CLEAR_FORM'
    })
  }

  async function initializeForm()  {
    try {
      const fields = await getFields(client);
      [...fields.patientIDFields, ...fields.formFields].forEach((field) => {
        initializeField(field)
      })
      fields.formIDFields.forEach((field) => {
        updateFormIDs({
          [field.name]: ''
        })
        initializeField(field)
      })
      updateWidgets(fields)
    } catch (error: any) {
      throw error
    }
  }

  function initializeField(field: any) {
    updateValidators({
      [field.name]: zodifyField(field, patientIdentifier.study)
    })
    updateErrorMessages({
      [field.name]: null
    })
    updateDisplayNames((n) => ({ ...n, [field.name]: findDisplayName(field, patientIdentifier.study)}))
    if (field.conditionals) {
      updateConditions({
        [field.name]: field.conditionals
      })
    }
    if (String(field.component).toLowerCase() === 'select') {
      updateOptions({
        [field.name]: field.set
      })
    }
    if (field.value) {
      updateFields({
        [field.name]: field.value
      })
    } else {
      updateFields({
        [field.name]: ""
      })
    }
  }

  // Query and mutation variables.
  // Also, helper variables that depend on query results,
  // and helper functions that use these queries/mutations
  const client = useApolloClient()
  const isRootForm = formMetadata.form_id === root.form_id
  let canSubmit = isRootForm || patientFound
  const [findOrCreatePatient] = useMutation(FindOrCreatePatient)
  const [updateOrCreateDraft] = useMutation(UpdateOrCreateDraft)
  const [deleteDraft] = useMutation(DeleteDraft)
  const [createTemplate] = useMutation(CreateTemplate)
  const [createSubmission] = useMutation(CreateSubmission)
  const [createUserSubmissionConnection] = useMutation(CreateUserSubmissionConnection)

  const getFields = async (client) => {
    const patientIDFieldsPromise = client.query({
      query: FormIDFields,
      variables: {
        where: {
          form_id: root.form_id
        }
      }
    })
    const formIDFieldsPromise = client.query({
      query: FormIDFields,
      variables: {
        where: {
          form_id: formMetadata.form_id
        }
      }
    })
    const formFieldsPromise = client.query({
      query: FieldData,
      variables: {
        id: formMetadata.form_id,
        study: patientIdentifier.study
      }
    })

    const [patientIDFieldsResponse, formIDFieldsResponse, formFieldsResponse] = await Promise.all([
      patientIDFieldsPromise,
      formIDFieldsPromise,
      formFieldsPromise
    ])

    const patientIDFields = patientIDFieldsResponse.data.forms[0].fieldsConnection.edges
    const formIDFields = formIDFieldsResponse.data.forms[0].fieldsConnection.edges
    const formFields = formFieldsResponse.data.GetFormFields

    return {
      patientIDFields: patientIDFields.map((field) => field.node),
      formIDFields: formIDFields.map((field) => field.node),
      formFields: formFields
    }
  }

  // find a draft for the current form/patient combination.
  // if a draft is found, fill the form with its contents.
  const draftInfo = {
    form_id: formMetadata.form_id,
    patient_id: JSON.stringify(patientIdentifier)
  }

  const { data: _drafts } = useQuery(FindDraft, {
    variables: {
      where: draftInfo
    },
    fetchPolicy: "network-only",
    onCompleted: (data) => {

      if (data.formDrafts.length > 0) {
        const patientID = JSON.parse(data.formDrafts[0].patient_id)
        const formIDs = JSON.parse(data.formDrafts[0].secondary_ids) || {}
        const draftData = JSON.parse(data.formDrafts[0].data) // the data that is used to save the draft

        transformToDate(draftData)

        fillForm({
          fields: draftData,
          patientID: patientID,
          formIDs: formIDs
        })
      }
    }
  })

  // Component effects
  // updates the reducer's patientID every time the context patientIdentifier changes
  // and clears the form
  useEffect(() => {
    updatePatientID(patientIdentifier)
    send('CLEAR')
  }, [patientIdentifier])

  // changes the form's state so that a draft can be saved
  useEffect(() => {
    if (!snapshot.matches('loading')) {
      send('CHANGE')
    }
  }, [state.fields])

  // allows the form to be submitted if it's the root form
  // or the patient already exists
  useEffect(() => {
    canSubmit = isRootForm || patientFound
  }, [patientFound])

  useEffect(() => {
    if (snapshot.matches('validating')) {
      const formIsValid = validateInputs(state, updateErrorMessages)
      if (!formIsValid) {
        send('FAILURE')
      } else {
        send('SUCCESS')
      }
    }
  }, [snapshot.value])

  // fills the form's fields with the active submission's fields
  // that are available in this form
  useEffect(() => {
    activeSubmission?.fields?.forEach((field) => {
      if (state.formIDs.hasOwnProperty(field.key)) {
        updateFormIDs({ [field.key]: field.value})
      }
      if (state.fields.hasOwnProperty(field.key)) {
        updateFields({ [field.key]: field.value})
      }
    })
  }, [activeSubmission])

  const saveTemplate = async () => {
    const templateInfo = createDraftInfo(formMetadata.form_id, patientIdentifier, state, isRootForm)
    await createTemplate({
      variables: { input: templateInfo },
      onCompleted() {
        alert('Template saved!')
        setLastTemplateUpdate(`Templates-${new Date().toUTCString()}`)
      },
    })
  }

  // Handler for submitting the form
  function submitForm() {

    // create the submission input for the graphql mutation(s)
    // and the submission function
    const submissionInput = createSubmissionInput(formMetadata.form_id, state)

    const doSubmit = () => {
      createSubmission({
        variables: { input: submissionInput },
        onCompleted: (submission) => {
          // delete the current draft
          deleteDraft({
            variables: {
              where: {
                'draft_id': state.draft_id
              }
            },
            onCompleted: () => {
              console.log('Draft has been deleted')
              updateDraftID(null)
              clearDraftDate()
            }
          })

          // connect the new submission to the currently logged in user
          createUserSubmissionConnection({
            variables: {
              submissionID: submission.createSubmissions.submissions[0].submission_id
            }
          })
          .then(() => {
            console.log(
              'Connected user to submission '
              + submission.createSubmissions.submissions[0].submission_id
            )
          })
          .catch(() => {
            console.log('Could not connect user to submission')
          })

          // notify the user of the successful submission and force
          // the submissions table to re-render
          alert('Form submitted!')
          setLastSubmissionUpdate(`Submissions-${new Date().toUTCString()}`)
          setPatientFound(true)
          clearForm()
        }
      })
      .catch((error) => {
        alert(`There was an error when submitting the form: ${error}`)
      })
    }

    // run the mutation(s)
    if (isRootForm) {
      findOrCreatePatient({
        variables: {
          patient_id: patientIdentifier.submitter_donor_id,
          program_id: patientIdentifier.program_id,
          study: patientIdentifier.study
        }
      })
      .then(() => doSubmit())
    } else {
      doSubmit()
    }

  }

  // Rendering control variables
  if (snapshot.matches('loading')) {
    return <></>
  } else if (snapshot.matches('error')) {
    return <BasicErrorMessage />
  }

  // Render auxiliary variables
  let renderedFormIDFields = (
    // since all forms have the patient ID fields as ID fields,
    // we filter them out of the list of IDs to be rendered
    // so they are not rendered twice
    fieldWidgets.formIDFields.filter((field) =>
      !Object.keys(state.patientID).includes(field.name)
    )
  )

  // generate the column headers for the draft and submissions tables
  // and set labels for each field depending on the current study or previous submissions.
  // the label property in each field is used as a fallback
  const labels: any = {}
  const visibleFields = fieldWidgets.formFields.filter((field) => field.studies.includes(patientIdentifier.study));
  [...fieldWidgets.patientIDFields, ...renderedFormIDFields, ...visibleFields].forEach((field) => {
    labels[field.name] = displayNames[field.name] ?? field.label
  })

  // apply overrides to rendered ID fields
  const applyOverrides = () => {
    let result: any[] = []
    if (renderedFormIDFields.length > 0) {
      result = renderedFormIDFields.map((field: any) => {
        const node = { ...field }; // shallow copy field object
        if (field.override) {
          Object.keys(field.override).forEach(
            (key) => {
              node[key] = field.override[key]
              node["wasOverridden"] = true
            }
          );
        }
        return node;
      })
    }
    return result
  }
  renderedFormIDFields = applyOverrides()

  // final render
  return (
    <div key={formMetadata.form_name}>
      <Form
        size="small"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <TemplateTable
          key={`Templates-${lastTemplateUpdate}`}
          formID={formMetadata.form_id}
          patientIdentifier={patientIdentifier}
          headers={labels}
          clearForm={clearForm}
          fillForm={fillForm}
          setLastTemplateUpdate={setLastTemplateUpdate}
        />
        <SubmissionTable
          key={`Submissions-${lastSubmissionUpdate}`}
          formID={formMetadata.form_id}
          formIDKeys={renderedFormIDFields.map((field) => field.name)}
          headers={labels}
          patientIdentifier={patientIdentifier}
          clearForm={clearForm}
          fillForm={fillForm}
          setLastSubmissionUpdate={setLastSubmissionUpdate}
        />
        <br />
        { 
        state.lastDraftUpdate
        ? <>
            <span style={{float: 'right'}}>
              Patient {patientIdentifier.submitter_donor_id}: {formMetadata.form_name} form last autosaved at: {state.lastDraftUpdate.toString()}
            </span>
            <br/>
          </>
        : <></>
      }
        {
          isRootForm || renderedFormIDFields.length === 0
          ? <></> 
          : <Divider horizontal>
              <Header as="h4">
                <Icon name="id card" />
                IDs
              </Header>
            </Divider>
        }
        <Form.Group widths={"equal"}>
          {
            renderedFormIDFields.map(
              (field) => <IDField
                key={field.name}
                field={field}
                study={patientIdentifier.study}
                label={labels[field.name]}
                override={field.wasOverridden ?? false}
                validator={state.validators[field.name]}
                value={state.formIDs[field.name]}
                errorMessage={state.errorMessages[field.name]}
                updateErrorMessage={updateErrorMessages}
                updateValue={handleFormIDChange}
              />
            )
          }
        </Form.Group>
        { // render regular form fields
          visibleFields.map((field) => renderField(field, patientIdentifier, state, labels[field.name], updateErrorMessages, handleFieldChange))
        }
        <Button.Group size="large" fluid widths={3}>
          <Button
            size='large' 
            onClick={
              () => { clearForm() }
            }
            fluid
            icon='trash'
            color='red'
            content='CLEAR FORM'
          />
          <Button.Or />
          <Button content="SAVE TEMPLATE" color="black" icon="save" onClick={() => { 
              saveTemplate()
              console.log('Template has been saved')
              updateDraftDate()
            }
          }
          />
          <Button.Or />
          <Button icon="send" content="FINALIZE" color="teal"
            disabled={!(canSubmit && snapshot.matches('valid'))}
            onClick={() => {
              submitForm()
            }}
          />
        </Button.Group>
      </Form>
    </div>
  )
}
