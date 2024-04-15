import React, { useContext, useEffect, useReducer, useState } from "react"
import { Form, Divider, Header, Icon, Button } from "semantic-ui-react"
import { useMutation, useQuery } from "@apollo/client"

import { validateInputs, doesFieldNotMeetAllConditions, createSubmissionInput, findDisplayName, getParentForm } from './utils'
import { FindDraft, UpdateOrCreateDraft, DeleteDraft, CreateSubmission, CreateUserSubmissionConnection, FieldData, FindOrCreatePatient, FormIDFields } from "./queries/query"
import { SubmissionTable } from "./table/SubmissionTable"
import { ActiveSubmissionContext, PatientFoundContext, PatientIdentifierContext } from "../Portal"
import { zodifyField } from "./validate/validator"
import { BasicErrorMessage } from "../common/BasicErrorMessage"
import { IDField } from "./fields/id"
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
  draftID: null
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
    case 'UPDATE_DRAFT_ID':
      return {
        ...state,
        draftID: action.payload
      }
    case 'CLEAR_FORM':
      return {
        ...state,
        formIDs: {},
        fields: {},
        draftID: null
      }
    default:
      return state
  }
}

// helper functions
function transformData(data: any, re: RegExp) {
  Object.keys(data).forEach((key) => {
    const isDate = re.test(data[key])
    if (isDate) {
      data[key] = new Date(data[key])
    } else if (data[key] === "") {
      data[key] = null
    }
  })
}

function formatDraftDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ampm = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ')[2]
  const timeZone = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ')[3]

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${ampm} ${timeZone}`
}

export function FormGenerator({ formMetadata, root }) {

  // State and context variables
  const [lastDraftUpdate, setLastDraftUpdate] = useState("")
  const [lastSubmissionUpdate, setLastSubmissionUpdate] = useState(`Submissions-${new Date().toUTCString()}`)
  const [draftModified, setDraftModified] = useState(false)

  const { patientIdentifier } = useContext(PatientIdentifierContext)
  const { activeSubmission } = useContext(ActiveSubmissionContext)
  const { patientFound, setPatientFound } = useContext(PatientFoundContext)

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

  function handleFormIDChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_FORM_IDS',
      payload: { [name]: value }
    })
    setDraftModified(true)
  }

  function handleFieldChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_FIELDS',
      payload: { [name]: value instanceof Date || isNaN(value) ? value : Number(value) }
    })
    setDraftModified(true)
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
    setDraftModified(false)
  }

  // Query and mutation variables.
  // Also, helper variables that depend on query results,
  // and helper functions that use these queries/mutations
  const isRootForm = formMetadata.form_id === root.form_id
  let canSubmit = isRootForm || patientFound
  const [findOrCreatePatient] = useMutation(FindOrCreatePatient)
  const [updateOrCreateDraft] = useMutation(UpdateOrCreateDraft)
  const [deleteDraft] = useMutation(DeleteDraft)
  const [createSubmission] = useMutation(CreateSubmission)
  const [createUserSubmissionConnection] = useMutation(CreateUserSubmissionConnection)
  const { data: patientIDFields } = useQuery(FormIDFields, {
    variables: {
      where: {
        form_id: root.form_id
      }
    },
    onCompleted: (data) => {
      data.forms[0].fieldsConnection.edges.map((field) => {
        updateValidators({
          [field.node.name]: zodifyField(field.node, patientIdentifier.study)
        })
        updateErrorMessages({
          [field.node.name]: null
        })
      })
    }
  })
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
            [field.node.name]: zodifyField(field.node, patientIdentifier.study)
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
      id: formMetadata.form_id,
      study: patientIdentifier.study
    },
    onCompleted: (data) => {
      data.GetFormFields.map((field) => {
        updateValidators({
          [field.name]: zodifyField(field, patientIdentifier.study)
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
      // regex to determine a date in the YYYY-MM-DD format
      // It will also match anything after the YYYY-MM-DD match,
      // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
      const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m

      if (data.formDrafts.length > 0) {
        const patientID = JSON.parse(data.formDrafts[0].patient_id)
        const formIDs = JSON.parse(data.formDrafts[0].secondary_ids) || {}
        const draftData = JSON.parse(data.formDrafts[0].data) // the data that is used to save the draft

        transformData(draftData, re)

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
  useEffect(() => {
    updatePatientID(patientIdentifier)
    clearForm()
  }, [patientIdentifier])

  // allows the form to be submitted if it's the root form
  // or the patient already exists
  useEffect(() => {
    canSubmit = isRootForm || patientFound
  }, [patientFound])

  // sets the interval for saving drafts
  useEffect(() => {
    const seconds = 10 // save the drafts every ten seconds (10 * 1000 milliseconds)
    const validPatient = !!patientIdentifier.submitter_donor_id && !!patientIdentifier.program_id
    const draftSaveInterval = draftModified && validPatient
    ? setInterval(() => {
        saveDraft()
        setDraftModified(false)
        setLastDraftUpdate(formatDraftDate(new Date()))
      }, seconds * 1000)
    : null

    return () => {
      if (draftSaveInterval) {
        clearInterval(draftSaveInterval)
      }
    }
  }, [draftModified])

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
    await updateOrCreateDraft({
      variables: { input: draftInfo },
      onCompleted: (data) => {
        updateDraftID(data.updateOrCreateDraft.draft_id)
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
              setDraftModified(false)
              updateDraftID(null)
              setLastDraftUpdate("")
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
  const formIsLoading = formIDFieldsLoading || formFieldsLoading

  const formQueriesError = formIDFieldsError ?? formFieldsError

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
  // and set labels for each field depending on the current study or previous submissions.
  // the label property in each field is used as a fallback
  const parentForm = getParentForm(root, formMetadata)
  const tableHeaders: any = {}
  const labels: any = {}
  const visibleFields = formFields.GetFormFields.filter((field) => field.studies.includes(patientIdentifier.study))
  patientIDFields.forms[0].fieldsConnection.edges.forEach((field) => {
    labels[field.node?.name] = findDisplayName(field.node, patientIdentifier.study, activeSubmission, parentForm)
    tableHeaders[field.node.name] = labels[field.node.name] ?? field.node.label
  })
  renderedFormIDFields.forEach((field) => {
    labels[field.node.name] = findDisplayName(field.node, patientIdentifier.study, activeSubmission, parentForm)
    tableHeaders[field.node.name] = labels[field.node.name] ?? field.node.label
  })
  visibleFields.forEach((field) => {
    labels[field.name] = findDisplayName(field, patientIdentifier.study, activeSubmission, parentForm)
    tableHeaders[field.name] = labels[field.name] ?? field.label
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
      { 
        lastDraftUpdate !== "" 
        ? <>
            <span style={{float: 'right'}}>
              Patient {patientIdentifier.submitter_donor_id}: {formMetadata.form_name} form last autosaved at: {lastDraftUpdate}
            </span>
            <br/>
          </>
        : <></>
      }
      <Form
        size="small"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
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
        <SubmissionTable
          key={`Submissions-${lastSubmissionUpdate}`}
          formID={formMetadata.form_id}
          formIDKeys={renderedFormIDFields.map((field) => field.name)}
          headers={tableHeaders}
          patientIdentifier={patientIdentifier}
          fillForm={fillForm}
        />
        { // render regular form fields
          visibleFields.map((field) => {
            let component = <></>

            const isDisabled = field.conditionals === null
              ? false
              : doesFieldNotMeetAllConditions(field.conditionals, state.fields)
            const isReadonly = field.readonly ?? false
            const errorMessage = isDisabled ? null : state.errorMessages[field.name]

            switch (String(field.component).toLowerCase()) {
              case "input":
                if (field.type === "month") {
                  component = <DateInputField
                    key={field.name}
                    field={field}
                    study={patientIdentifier.study}
                    label={labels[field.name]}
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
                    label={labels[field.name]}
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
                    label={labels[field.name]}
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
                  component = <SmallSelectField
                    key={field.name}
                    field={field}
                    study={patientIdentifier.study}
                    label={labels[field.name]}
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
                    label={labels[field.name]}
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
              default:
                break;
            }
            return component
          })
        }
        <Button.Group size="large" fluid>
        <Button content="SAVE DRAFT" color="black" icon="save" onClick={() => { 
            saveDraft()
            setDraftModified(false)
            setLastDraftUpdate(formatDraftDate(new Date()))
          }
        } />
          <Button.Or />
          <Button icon="send" size="huge" content="FINALIZE" color="teal"
            disabled={!canSubmit}
            onClick={() => {
              submitForm()
            }}
          />
        </Button.Group>
      </Form>
    </div>
  )
}
