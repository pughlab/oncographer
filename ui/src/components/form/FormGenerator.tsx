import React, { useEffect, useReducer, useState } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import * as R from "remeda";
import { Form, Divider, Header, Icon, Button } from "semantic-ui-react";

import {
  ParseFormToGraphQL,
  doesFieldNotMeetAllConditions,
  getKeyValuePairs,
  parseFormFieldsToQueryContext,
  validateFormFieldInputs,
  submitterBundleQueryParse,
  sortSubmitterByFormId,
  submitterReferenceFormsRelationalCardinality,
  doesSubmitterExist
} from "./utils";
import { zodifyField } from "./validate/validator";
import {
  FieldData,
  CreateNode,
  CreateKeycloakSubmitterConnection,
  NodeGetContext,
  submitterBundle,
  doesRootExist,
  CreateDraft
} from "./queries/query";
import { FormTable } from "./table/FormTable";
import { DraftTable } from "./table/DraftTable";
import { BasicErrorMessage } from "../common/BasicErrorMessage";
import { PrimaryIDField, SecondaryIDField } from "./fields/id";
import { DateInputField, InputField } from "./fields/input";
import { TextAreaField } from "./fields/textarea";
import { LargeSelectField, SmallSelectField } from "./fields/select";

const initialState = {
  validators: {},
  errorMessages: {},
  conditions: {},
  options: {},
  primaryIDs: {},
  secondaryIDs: {},
  fields: {},
}

const formReducer = (state, action) => {
  switch(action.type) {
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
    case 'UPDATE_PRIMARY_IDS':
      return {
        ...state,
        primaryIDs: {
          ...state.primaryIDs,
          ...action.payload
        }
      }
      case 'UPDATE_SECONDARY_IDS':
        return {
          ...state,
          secondaryIDs: {
            ...state.secondaryIDs,
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
          primaryIDs: {
            ...state.primaryIDs,
            ...action.payload.IDs.filter((id) => Object.keys(state.primaryIDs).includes(id))
          },
          secondaryIDs: {
            ...state.secondaryIDs,
            ...action.payload.IDs.filter((id) => Object.keys(state.secondaryIDs).includes(id))
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

export function FormGenerator({ metadata, patientIdentifier, setPatientIdentifier }) {
  
  const relationalCardinalityToRoot = metadata.form_relationship_cardinality
  const [coherentConnections, setConnection] = useState(false); // all references keys that are being used exist
  const [context, setContext] = useState({}); // Context holds all the information of form that hold being referenced by
  // either the identifiers, and foreign keys
  const [formReferenceKeysUUID, setUUID] = useState({});
  const [lastDraftUpdate, setLastDraftUpdate] = useState(new Date().toUTCString())
  const [lastSubmission, setLastSubmission] = useState(new Date().toUTCString())
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [createDraft] = useMutation(CreateDraft)
  const [createNode] = useMutation(CreateNode);
  const [createKeycloakSubmitterConnection] = useMutation(CreateKeycloakSubmitterConnection)

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

  function updatePrimaryIDs(ids) {
    dispatch({
      type: 'UPDATE_PRIMARY_IDS',
      payload: ids
    })
  }

  function fillForm(payload) {
    dispatch({
      type: 'FILL_FORM',
      payload: payload
    })
  }

  function handlePrimaryIDChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_PRIMARY_IDS',
      payload : { [name]: value }
    })
  }

  function handleSecondaryIDChange(e) {
    const { name, value } = e.target
    dispatch({
      type: 'UPDATE_SECONDARY_IDS',
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

  //  Is a reference to root of the form directed acyclic graph in which all forms use their primary key
  const globalIdentifierKeys = metadata.identifier.filter(
    (field) => !metadata.primary_key.map((field) => field.name).includes(field.name)
  );

  const isRootForm = globalIdentifierKeys.length === 0;

  // primary identifier of the current form. This allows us to be able to identify the node that will
  // the backend later on
  // formPrimaryIdentifierKeys
  const formPrimaryIdentifierKeys = metadata.primary_key.filter(
    (field) =>
      !globalIdentifierKeys
        .map((key) => JSON.stringify(key))
        .includes(JSON.stringify(field))
  );

  // foreign identifier of the current form. 
  // This is the identifier that connects to other existing forms and their primary identifier
  const formReferenceKeys = metadata.foreign_keyConnection.edges;

  // (Populate Form Fields GraphQL Query) that loads all field data within the form
  const {
    loading: loadFieldData,
    error: errorFields,
    data: formFields,
  } = useQuery(FieldData, {
    variables: { id: metadata.form_id },
  });

  // (Context GraphQL Query) given if there is a reference or an identifier
  const { loading: formFieldsContextLoading, data: formFieldsContext } = useQuery(NodeGetContext, {
    variables: parseFormFieldsToQueryContext(
      { globalIdentifierKeys, formReferenceKeys },
      {
        ...state.primaryIDs,
        ...state.secondaryIDs
      }
    ),
  });

  // (Populated Sumbitter Node Exist Query)
  const [getSubmitterConstraints] = useLazyQuery(submitterBundle, {
    fetchPolicy: "network-only",
  });

  const [getRootIfExist] = useLazyQuery(doesRootExist, {
    fetchPolicy: "network-only",
  });

  const getIdFields = () => {
    return [
      ...globalIdentifierKeys,
      ...formPrimaryIdentifierKeys,
      ...formReferenceKeys.map((fk: any) => {
        const node = { ...fk.node }; // shallow copy node object
        if (fk.override) {
          Object.keys(fk.override).forEach(
            (key) => (node[key] = fk.override[key])
          );
        }
        return node;
      }),
    ]
  }

  const getTableHeaders = () => {
    const idFields = getIdFields()

    let headers = R.mapToObj(idFields, (field) => [field.name, field.label])

    if (formFields !== undefined) {
      formFields.PopulateForm.forEach((field) => {
        headers[field.name] = field.label
      })
    }
    return headers
  }

  const saveDraft = async () => {
    const draftInfo: any = {
      'form_id': String(metadata.form_id), 
      'patient_id': JSON.stringify(patientIdentifier),
      'data': JSON.stringify(state.fields),
    }
    if (Object.keys(state.secondaryIDs).length > 0) {
      draftInfo['secondary_ids'] = JSON.stringify(state.secondaryIDs)
    }
    await createDraft({ 
      variables: { input: draftInfo },
      onCompleted: () => {
        alert("Draft saved")
        setLastDraftUpdate(`Drafts-${new Date().toUTCString()}`)
      }
    })
  }

  useEffect(() => {
    updatePrimaryIDs(patientIdentifier)
  }, [patientIdentifier])

  useEffect(() => {
    console.log("Form fields effect ran!")
    console.log([formFields, formFieldsContext])
    if (!loadFieldData && !formFieldsContextLoading && !errorFields) {
      const ids = getIdFields()

      updateValidators({
        ...R.mapToObj(ids, (field) => [field.name, zodifyField(field)]),
      })
      
      formFields.PopulateForm.forEach((field) => {
        if (field.conditionals) {
          updateConditions({
            [`${field.name}`]: field.conditionals,
          })
        }

        if (field.component === "Select") {
          updateOptions({
            [`${field.name}`]: field.set
          })
        }

        updateErrorMessages({
          [`${field.name}`]: null
        })

        updateValidators({
          [field.name]: zodifyField(field),
        });
      });
    }

    if (
      typeof formFieldsContext === "object" 
      && formFieldsContext.submitters.length > 0
    ) {
      // filter out all non filled Reference Fields
      const filledReferenceFormFields = formReferenceKeys.filter(rk => {
        return { ...state.primaryIDs, ...state.secondaryIDs }[rk.node.name] !== ""
      });

      const numberOfFilledReferenceFormID = sortSubmitterByFormId({ ...state.primaryIDs, ...state.secondaryIDs }, filledReferenceFormFields)

      formFieldsContext.submitters[0].fields.forEach((field) => {
        setContext((context) => ({
          ...context,
          [field["key"]]: field["value"],
        }));
      });

      formFieldsContext.submitters[0].connectedFormsReferencingSubmitter.forEach(
        (form) => {
          setUUID((uuids) => ({ ...uuids, [form.form]: form.uuid }))

          form.fields.forEach((field) => {
            setContext((context) => ({
              ...context,
              [field["key"]]: field["value"],
            }));
          });
        }
      );

      // context connection are coherent
      setConnection(numberOfFilledReferenceFormID.length === formFieldsContext.submitters[0].connectedFormsReferencingSubmitter.length)
    }
  }, [formFields, formFieldsContext])

  const onFormComplete = async () => {

    // Validate Current Form Data 
    const isValid = validateFormFieldInputs(
      { ...state.primaryIDs, ...state.secondaryIDs },
      state.fields,
      state.conditions,
      context,
      state.validators,
      state.errorMessages,
      updateErrorMessages
    )
    if (isValid || (formReferenceKeys.length > 0 && !coherentConnections)) {
      alert(isValid ? `There are some invalid fields! Please address the fields marked in red and re-submit.` : `The reference IDs you entered are not correct!`)
      return;
    }


    // Currently know:
    // - connection to all possible references are coherent mean they connect to the root
    // - all fields are vaild
    // Need To Know:
    // - does this submitted form already exist
    // - Is it NOT a Root
    // - Does if have a relationship cardinality
    //   YES: connection meet the relationship cardinality of it root
    //   NO : continue
    // - Does it have references
    //   YES: connection meet their relationship cardinality of its references
    //   NO : continue

    let submitterConnectionQuery = isRootForm ? getRootIfExist : getSubmitterConstraints
    const received = await submitterConnectionQuery({
      variables: {
        ...submitterBundleQueryParse(formPrimaryIdentifierKeys, globalIdentifierKeys, formReferenceKeys, { ...state.primaryIDs, ...state.secondaryIDs }, metadata.form_id, isRootForm)
      },
    })

    // UPDATE: need to implment a override in the case of update
    // if the submitter submits a form that exist then exit the function


    if (!isRootForm) {

      if (formPrimaryIdentifierKeys.length > 0 && doesSubmitterExist(received.data.root[0].connectedFormsReferencingSubmitterAggregate.count)) {
        alert("This already exists")
        return
      }  // **COMMENT OUT**

      const formCountToRoot = received.data.CurrentRelationalCardinalityOfFormToRoot[0].connectedFormsReferencingSubmitterAggregate.count;
      if (relationalCardinalityToRoot !== null && formCountToRoot >= relationalCardinalityToRoot) {
        alert("There exsit to many forms under this root")
        return;
      }

      // INFO NEEDED TO COMPUTE IF IT MEETS CARDINALITY
      // - data of all reference forms filled
      // - the cardinality for each form

      if (formReferenceKeys.length > 0) { // there exist no reference keys
        const referenceForms = received.data.ReferencesConnectionOfRoot[0]
        const referenceFormRelationalCardinality = submitterReferenceFormsRelationalCardinality(formReferenceKeys) // 
        let currentForm = "";
        for (let submitter of referenceForms.connectedFormsReferencingSubmitter) {
          currentForm = submitter.form;
          if (referenceFormRelationalCardinality[currentForm] === undefined) continue; // there are no constraints on their relational cardinality

          // there exist a constraints e.g the form referenced has a limited time it can be referenced by this form 
          if (submitter.connectedFormsReferencingSubmitterAggregate.count >= referenceFormRelationalCardinality[currentForm]) {
            alert(`It has already exceeded realtional cardinality of ${currentForm}`)
            return
          }
        }
      }
    } else if (doesSubmitterExist(received.data.root.length)) {
      alert("This already exists")
      return
    }  // **COMMENT OUT**

    const internalFormMetadata = {
      form_id: metadata.form_id,   // ID to distinguish between all forms
      ids: { ...state.primaryIDs, ...state.secondaryIDs }, // unique set of identifiers to distinguish submitters from eachother
      fields: state.fields,    // fields submitted by the submitter
      context: context,            // contextual information provided by referenced forms
      uuids: formReferenceKeysUUID
    };

    const identifierKeys = {
      globalIdentifierKeys,       // global ID's that uniquely identifier the root 
      formPrimaryIdentifierKeys,  // form ID's that uniquely identifier form of the global ID
      formReferenceKeys,          // referenced forms ID's
      formFieldsMetadata: formFields.PopulateForm,
    };

    const formCreateSchema = ParseFormToGraphQL(internalFormMetadata, identifierKeys);

    // all checks are completed now just need to mutate the backend
    createNode({
      variables: { input: [formCreateSchema] },
      onCompleted: (submitter) => {
        createKeycloakSubmitterConnection({ variables: { submitterID: submitter.createSubmitters.submitters[0].uuid } })
        .then(() => {
          console.log(submitter.createSubmitters.submitters[0].uuid)
          console.log("completed keycloak connection to submitter!")
        })
        .catch(() => {
          console.log("Could not complete keycloak connection to submitter.")
        })

        setLastSubmission(`Submissions-${new Date().toUTCString()}`)
        setPatientIdentifier({ submitter_donor_id: state.primaryIDs['submitter_donor_id'], program_id: state.primaryIDs['program_id'] })

        alert("Form submitted!")
      }
    })
    .catch((error) => {
      alert(`There was an error when submitting the form: ${error}`)
    });

  };

  //  do not return anything to the DOM if the data is not loaded
  if (loadFieldData || formFieldsContextLoading) { 
    return <></> 
  } else if (errorFields) {
    return <BasicErrorMessage/>;
  }

  return (
    <div key={metadata.form_name} style={{ paddingLeft: "60px", paddingRight: "60px" }}>
      <Form
        size="small"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Divider horizontal>
          <Header as="h4">
            <Icon name="id card" />
            IDs
          </Header>
        </Divider>
        <Form.Group widths={"equal"}>
          {globalIdentifierKeys.map((field) => <PrimaryIDField
            key={field.name}
            field={field}
            validator={state.validators[field.name]}
            value={state.primaryIDs[field.name]}
            errorMessage={state.errorMessages[field.name]}
            updateErrorMessage={updateErrorMessages}
            updateValue={handlePrimaryIDChange}
          />)}
        </Form.Group>

        <Form.Group widths={"equal"}>
          {formPrimaryIdentifierKeys.map((field) => <PrimaryIDField
            key={field.name}
            field={field}
            validator={state.validators[field.name]}
            value={state.primaryIDs[field.name]}
            errorMessage={state.errorMessages[field.name]}
            updateErrorMessage={updateErrorMessages}
            updateValue={handlePrimaryIDChange}
          />)}
        </Form.Group>
        <Form.Group widths={"equal"}>
          {formReferenceKeys.map((field) => <SecondaryIDField 
            key={field.node.name}
            field={field}
            validator={state.validators[field.node.name]}
            value={state.secondaryIDs[field.node.name]}
            errorMessage={state.errorMessages[field.node.name]}
            updateErrorMessage={updateErrorMessages}
            updateValue={handleSecondaryIDChange}
          />)}
        </Form.Group>
        <DraftTable
          key={`Drafts-${lastDraftUpdate}`} // this state variable gets updated whenever the drafts change
          metadata={metadata}
          headers={getTableHeaders}
          patientIdentifier={patientIdentifier}
          fillForm={fillForm}
          setLastDraftUpdate={setLastDraftUpdate}
        /> 
        <Divider hidden />
        <Divider horizontal>
          <Header as="h4">
            <Icon name="send" />
            SUBMISSIONS
          </Header>
        </Divider>
        <FormTable
          key={`Submissions-${lastSubmission}`} // this state variable gets updated when the form is submitted
          form={metadata.form_id}
          searchForRootForm={isRootForm}
          globalIdentifierKeys={getKeyValuePairs(
            globalIdentifierKeys.map((id) => id.name),
            { ...state.primaryIDs, ...state.secondaryIDs }
          )}
          formPrimaryIdentifierKeys={getKeyValuePairs(
            formPrimaryIdentifierKeys.map((pk) => pk.name),
            { ...state.primaryIDs, ...state.secondaryIDs }
          )}
          identifierKeys={{ ...state.primaryIDs, ...state.secondaryIDs }}
          fillForm={fillForm}
        />

        {state.options &&
          formFields.PopulateForm.map((field) => {
            let comp = <></>;

            const disabled =
              field.conditionals === null
                ? false
                : doesFieldNotMeetAllConditions(
                  field.conditionals,
                  state.fields,
                  context
                );
            const displayError = disabled ? null : state.errorMessages[field.name];
            // add new components here - e.g. if for >5 then Button Select and also change field type in Neo4j for that field
            switch (field.component) {
              case "Input":
                if (field.type === "month") {
                  comp = <DateInputField
                    field={field}
                    value={state.fields[field.name]}
                    isDisabled={disabled}
                    errorMessage={displayError}
                    validator={state.validators[field.name]}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                } else if (field.type === "textarea") {
                  comp = <TextAreaField 
                    field={field}
                    value={state.fields[field.name]}
                    isDisabled={disabled}
                    validator={state.validators[field.name]}
                    errorMessage={displayError}
                    updateErrorMessage={updateErrorMessages}
                    updateValue={handleFieldChange}
                  />
                } else {
                  comp = <InputField
                    field={field}
                    value={state.fields[field.name]}
                    isDisabled={disabled}
                    validator={state.validators[field.name]}
                    errorMessage={displayError}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                }
                break;
              case "Select":
                // check if the option is undefined under the field name if so do not populate the selects ...
                if (state.options[field.name] === undefined) break;

                if (state.options[field.name].length <= 4) {
                  comp = <SmallSelectField 
                    field={field}
                    isDisabled={disabled}
                    errorMessage={displayError}
                    options={state.options[field.name]}
                    validator={state.validators[field.name]}
                    value={state.fields[field.name]}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                } else {
                  comp = <LargeSelectField 
                    field={field}
                    isDisabled={disabled}
                    errorMessage={displayError}
                    options={state.options[field.name]}
                    validator={state.validators[field.name]}
                    value={state.fields[field.name]}
                    updateErrorMessage={updateErrorMessages}
                    updateGlobalState={handleFieldChange}
                  />
                }
                break;
              default:
                break;
            }
            return comp;
          })}

        <Button.Group size="large" fluid>
          <Button 
            content="SAVE DRAFT"
            color="black"
            icon="save"
            onClick={
              () => {
                saveDraft()
              }
            }
          />
          <Button.Or />
          <Button
            icon="send"
            size="huge"
            content="SUBMIT"
            color="teal"
            onClick={() => {
              onFormComplete();
            }}
          ></Button>
        </Button.Group>
      </Form>
    </div>
  );
}
