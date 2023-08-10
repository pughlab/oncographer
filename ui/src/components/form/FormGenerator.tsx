import React, { useContext, useEffect, useReducer, useState } from "react"
import { Form, Divider, Header, Icon, Button } from "semantic-ui-react"
import { useMutation, useQuery } from "@apollo/client"

import { validateInputs, doesFieldNotMeetAllConditions, createSubmissionInput } from './utils'
import { CreateDraft, CreateSubmission, CreateUserSubmissionConnection, FieldData, FormIDFields, RootForm } from "./queries/query"
import { SubmissionTable } from "./table/SubmissionTable"
import { DraftTable } from "./table/DraftTable"
import { PatientIdentifierContext } from "../Portal"
import { zodifyField } from "./validate/validator"
import { BasicErrorMessage } from "../common/BasicErrorMessage"
import { PrimaryIDField, SecondaryIDField } from "./fields/id"
import { DateInputField, InputField } from "./fields/input"
import { TextAreaField } from "./fields/textarea"
import { LargeSelectField, SmallSelectField } from "./fields/select"

const initialState = {
  validators: {},
  errorMessages: {},
  conditions: {},
  options: {},
  patientID: {},
  formIDs: {},
  fields: {},
}

const formReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_VALIDATORS':
      return {
        ...state,
        validators: {
          ...state.validators,
          ...action.validators
        }
      }
    case 'UPDATE_ERROR_MESSAGES':
      return {
        ...state,
        errorMessages: {
          ...state.errorMessages,
          ...action.errorMessages
        }
      }
    case 'UPDATE_CONDITIONS':
      return {
        ...state,
        conditions: {
          ...state.conditions,
          ...action.conditions
        }
      }
    case 'UPDATE_OPTIONS':
      return {
        ...state,
        options: {
          ...state.options,
          ...action.options
        }
      }
    case 'UPDATE_PATIENT_ID':
      return {
        ...state,
        patientID: {
          ...state.patientID,
          ...action.payload
        }
      }
    case 'UPDATE_FORM_IDS':
      return {
        ...state,
        formIDs: {
          ...state.formIDs,
          ...action.payload
        }
      }
    case 'UPDATE_FIELDS':
      return {
        ...state,
        fields: {
          ...state.fields,
          ...action.payload
        }
      }
    case 'FILL_FORM':
      return {
        ...state,
        patientID: {
          ...state.patientID,
          ...action.payload.patientID
        },
        formIDs: {
          ...state.formIDs,
          ...action.payload.formIDs
        },
        fields: {
          ...state.fields,
          ...action.payload.fields
        }
      }
    default:
      return state
  }
}

export function FormGenerator({ formMetadata }) {

  // State and context variables
  const [lastDraftUpdate, setLastDraftUpdate] = useState(`Drafts-${new Date().toUTCString()}`)
  const [lastSubmissionUpdate, setLastSubmissionUpdate] = useState(`Submissions-${new Date().toUTCString()}`)
  const { patientIdentifier } = useContext(PatientIdentifierContext)

  // Reducer variables and associated functions
  const [state, dispatch] = useReducer(formReducer, initialState)
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

  function fillForm(payload) {
    dispatch({
      type: 'FILL_FORM',
      payload: payload
    })
  }

  function handlePatientIDChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_PATIENT_ID',
      payload: { [name]: value }
    })
  }

  function handleFormIDChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_FORM_IDS',
      payload: { [name]: value }
    })
  }

  function handleFieldChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_FIELDS',
      payload: { [name]: value }
    })
  }

  // Query and mutation variables.
  // Also, helper variables that depend on query results,
  // and helper functions that use these queries/mutations
  const [createDraft] = useMutation(CreateDraft)
  const [createSubmission] = useMutation(CreateSubmission)
  const [createUserSubmissionConnection] = useMutation(CreateUserSubmissionConnection)
  const { loading: rootFormLoading, error: rootFormError, data: rootForm } = useQuery(RootForm)
  const {
    loading: patientIDFieldsLoading,
    error: patientIDFieldsError,
    data: patientIDFields
  } = useQuery(FormIDFields, {
    variables: {
      where: {
        form_id: rootForm.GetRootForm.form_id
      }
    }
  })
  const isRootForm = formMetadata.form_id === rootForm.GetRootForm.form_id
  const {
    loading: formIDFieldsLoading,
    error: formIDFieldsError,
    data: formIDFields
  } = useQuery(FormIDFields, {
    variables: {
      where: {
        form_id: formMetadata.form_id
      }
    },
    onCompleted: (data) => {
      if (!isRootForm) {
        data.forms[0].fieldsConnection.edges.map((field) => {
          updateFormIDs({
            [field.node.name]: ''
          })
          updateValidators({
            [field.node.name]: zodifyField(field.node)
          })
          updateErrorMessages({
            [field.node.name]: null
          })
        })
      }
    }
  })
  const {
    loading: formFieldsLoading,
    error: formFieldsError,
    data: formFields
  } = useQuery(FieldData, {
    variables: {
      id: formMetadata.form_id
    },
    onCompleted: (data) => {
      data.GetFormFields.map((field) => {
        updateValidators({
          [field.name]: zodifyField(field)
        })
        updateErrorMessages({
          [field.name]: null
        })
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
      })
    }
  })

  // Component effects
  // updates the reducer's patientID every time the context patientIdentifier changes
  useEffect(() => {
    updatePatientID(patientIdentifier)
  }, [patientIdentifier])

  // Event handlers
  // Handler for saving a form draft
  const saveDraft = async () => {
    const draftInfo: any = {
      'form_id': String(formMetadata.form_id),
      'patient_id': JSON.stringify(patientIdentifier),
      'data': JSON.stringify(state.fields)
    }
    const formIDKeys = Object.keys(state.formIDs)
    if (formIDKeys.length > 0 && !isRootForm) {
      const formIDs = formIDKeys
        .filter((id) =>
          !Object.keys(state.patientID).includes(id)
        )
        .reduce((obj, key) => {
          return Object.assign(obj, { [key]: state.formIDs[key] })
        }, {})
      draftInfo['secondary_ids'] = JSON.stringify(formIDs)
    }
    await createDraft({
      variables: { input: draftInfo },
      onCompleted: () => {
        alert('Draft saved')
        setLastDraftUpdate(`Drafts-${new Date().toUTCString()}`)
      }
    })
  }

  // Handler for submitting the form
  const submitForm = () => {
    // validate fields, exit if validation fails
    const formIsValid = validateInputs(state, updateErrorMessages)
    if (!formIsValid) {
      alert(`There are some invalid fields! Please address the fields marked in red and re-submit.`)
      return
    }

    // create the submission input for the graphql mutation(s)
    const submissionInput = createSubmissionInput(formMetadata.form_id, state)
    console.log(submissionInput)

    // run the mutation(s)
    createSubmission({
      variables: { input: submissionInput },
      onCompleted: (submission) => {
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

        setLastSubmissionUpdate(`Submissions-${new Date().toUTCString()}`)
        alert('Form submitted!')
      }
    })
      .catch((error) => {
        alert(`There was an error when submitting the form: ${error}`)
      })

  }

  // Rendering control variables
  const formIsLoading = (
    rootFormLoading
    || patientIDFieldsLoading
    || formIDFieldsLoading
    || formFieldsLoading
  )

  const formQueriesError = (
    rootFormError
    ?? patientIDFieldsError
    ?? formIDFieldsError
    ?? formFieldsError
  )

  if (formIsLoading) {
    return <></>
  } else if (formQueriesError) {
    return <BasicErrorMessage />
  }

  // Render auxiliary variables
  let renderedFormIDFields = (
    // since all forms have the patient ID fields as ID fields,
    // we filter them out of the list of IDs to be rendered
    // so they are not rendered twice
    formIDFields.forms[0].fieldsConnection.edges.filter((field) =>
      !Object.keys(state.patientID).includes(field.node.name)
    )
  )

  // generate the column headers for the draft and submissions tables
  const tableHeaders: any = {}
  patientIDFields.forms[0].fieldsConnection.edges.forEach((field) => {
    tableHeaders[field.node.name] = field.node.label
  })
  renderedFormIDFields.forEach((field) => {
    tableHeaders[field.node.name] = field.node.label
  })
  formFields.GetFormFields.forEach((field) => {
    tableHeaders[field.name] = field.label
  })

  // apply overrides to rendered ID fields
  const applyOverrides = () => {
    let result: any[] = []
    if (renderedFormIDFields.length > 0) {
      result = renderedFormIDFields.map((field: any) => {
        const node = { ...field.node }; // shallow copy node object
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
    <div key={formMetadata.form_name} style={{ paddingLeft: "60px", paddingRight: "60px" }}>
      <Form
        size="small"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <Divider horizontal>
          <Header as="h4">
            <Icon name="id card" />
            IDs
          </Header>
        </Divider>
        <Form.Group widths={"equal"}>
          {
            patientIDFields.forms[0].fieldsConnection.edges.map((field) => <PrimaryIDField
              key={field.node.name}
              field={field}
              validator={state.validators[field.node.name]}
              value={state.patientID[field.node.name] ?? ''}
              errorMessage={state.errorMessages[field.node.name]}
              updateErrorMessage={updateErrorMessages}
              updateValue={handlePatientIDChange}
            />)
          }
        </Form.Group>
        <Form.Group widths={"equal"}>
          {
            renderedFormIDFields.map(
              (field) => <SecondaryIDField
                key={field.name}
                field={field}
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
        <DraftTable
          key={`Drafts-${lastDraftUpdate}`}
          formID={formMetadata.form_id}
          headers={tableHeaders}
          patientIdentifier={patientIdentifier}
          fillForm={fillForm}
          setLastDraftUpdate={setLastDraftUpdate}
        />
        <SubmissionTable
          key={`Submissions-${lastSubmissionUpdate}`}
          formID={formMetadata.form_id}
          formIDKeys={renderedFormIDFields.map((field) => field.name)}
          headers={tableHeaders}
          patientIdentifier={patientIdentifier}
          fillForm={fillForm}
        />
        { // render regular form fields
          formFields.GetFormFields.map((field) => {
            let component = <></>

            const isDisabled = field.conditionals === null
              ? false
              : doesFieldNotMeetAllConditions(field.conditionals, state.fields)
            const errorMessage = isDisabled ? null : state.errorMessages[field.name]

            switch (String(field.component).toLowerCase()) {
              case "input":
                if (field.type === "month") {
                  component = <DateInputField
                    field={field}
                    value={state.fields[field.name]}
                    isDisabled={isDisabled}
                    errorMessage={errorMessage}
                    validator={state.validators[field.name]}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                } else if (field.type === "textarea") {
                  component = <TextAreaField
                    field={field}
                    value={state.fields[field.name]}
                    isDisabled={isDisabled}
                    validator={state.validators[field.name]}
                    errorMessage={errorMessage}
                    updateErrorMessage={updateErrorMessages}
                    updateValue={handleFieldChange}
                  />
                } else {
                  component = <InputField
                    field={field}
                    value={state.fields[field.name]}
                    isDisabled={isDisabled}
                    validator={state.validators[field.name]}
                    errorMessage={errorMessage}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                }
                break
              case "select":
                if (state.options[field.name] === undefined) break;

                if (state.options[field.name].length <= 4) {
                  component = <SmallSelectField
                    field={field}
                    isDisabled={isDisabled}
                    errorMessage={errorMessage}
                    options={state.options[field.name]}
                    validator={state.validators[field.name]}
                    value={state.fields[field.name]}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                } else {
                  component = <LargeSelectField
                    field={field}
                    isDisabled={isDisabled}
                    errorMessage={errorMessage}
                    options={state.options[field.name]}
                    validator={state.validators[field.name]}
                    value={state.fields[field.name]}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                }
                break
              default:
                break;
            }
            return component
          })
        }
        <Button.Group size="large" fluid>
          <Button content="SAVE DRAFT" color="black" icon="save" onClick={() => { saveDraft() }} />
          <Button.Or />
          <Button icon="send" size="huge" content="SUBMIT" color="teal"
            onClick={() => {
              submitForm()
            }}
          />
        </Button.Group>
      </Form>
    </div>
  )
}