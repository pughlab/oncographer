import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import * as R from "remeda";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Form, Divider, Header, Icon, Button, Popup } from "semantic-ui-react";

import {
  constructDropdown,
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
  CreateDraft,
  FindDraft
} from "./queries/query";
import { FormTable } from "./table/FormTable";
import { DraftTable } from "./table/DraftTable";
import { LoadingSegment } from "../common/LoadingSegment";
import { BasicErrorMessage } from "../common/BasicErrorMessage";

function DraftContent({ metadata, headers, uniqueIdsFormState, patientIdentifier, setGlobalFormState, setLastDraftUpdate }) {
  // attempt to find drafts for the current form/patient combination
  const { loading: draftsLoading, error: draftsError, data: drafts } = useQuery(FindDraft, {
    variables: {
      where: { 
        form_id: metadata.form_id,
        patient_id: JSON.stringify(uniqueIdsFormState)
      } 
    },
    fetchPolicy: "network-only"
  })

  if (draftsLoading) {
    return (
    <>
    <Divider hidden />
      <Divider horizontal>
        <Header as="h4">
          <Icon name="save" />
          DRAFTS
        </Header>
      </Divider>
      <LoadingSegment />
    </>
    )
  }

  if (draftsError) {
    return <BasicErrorMessage />
  }

  return (
    <>
      <Divider hidden />
      <Divider horizontal>
        <Header as="h4">
          <Icon name="save" />
          DRAFTS
        </Header>
      </Divider>
      <DraftTable
        drafts={drafts.formDrafts}
        setLastDraftUpdate={setLastDraftUpdate}
        headers={headers}
        patientIdentifier={patientIdentifier}
        updateGlobalFormState={setGlobalFormState}
      />
    </>
  )
}

export function FormGenerator({ metadata, patientIdentifier, setPatientIdentifier }) {
  
  const relationalCardinalityToRoot = metadata.form_relationship_cardinality
  const [validators, setValidators] = useState({}); // validators for each field
  const [errordisplay, setErrorDisplay] = useState({}); // error messages for each field
  const [globalFormState, setGlobalFormState] = useState({}); // Global State of the current form that holds all data inputs
  const [uniqueIdsFormState, setUniqueIdFormState] = useState({}); // Contains all the form States unique IDs and their inputs within the current form
  const [conditionalFields, setConditionalFields] = useState({});
  const [option, setOption] = useState({}); // Options of the Select Component fields **TODO: CHANGE AND STORE WITHIN BACKEND***
  const [coherentConnections, setConnection] = useState(false); // all references keys that are being used exist
  const [context, setContext] = useState({}); // Context holds all the information of form that hold being referenced by
  // either the identifiers, and foreign keys
  const [formReferenceKeysUUID, setUUID] = useState({});
  const [lastDraftUpdate, setLastDraftUpdate] = useState(new Date().toUTCString())
  const [lastSubmission, setLastSubmission] = useState(new Date().toUTCString())
  const [createDraft] = useMutation(CreateDraft)
  const [createNode] = useMutation(CreateNode);
  const [createKeycloakSubmitterConnection] = useMutation(CreateKeycloakSubmitterConnection)

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
        .map((fld) => JSON.stringify(fld))
        .includes(JSON.stringify(field))
  );

  // foreign identifier of the current form. 
  // This is the identifier that connects to other existing forms and their primary identifier
  const formReferenceKeys = metadata.foreign_keyConnection.edges;
  // console.log("FORM REFERENCE KEYS:")
  // console.log(formReferenceKeys)

  // (Populate Form Fields GraphQL Query) that loads all field data within the form
  const {
    loading: loadFieldData,
    error: errorFields,
    data: formFields,
  } = useQuery(FieldData, {
    variables: { id: metadata.form_id },
  });

  // (Populated Sumbitter Node Exist Query)
  const [getSubmitterConstraints] = useLazyQuery(submitterBundle, {
    fetchPolicy: "network-only",
  });

  const [getRootIfExist] = useLazyQuery(doesRootExist, {
    fetchPolicy: "network-only",
  });

  // (Context GraphQL Query) given if there is a reference or an identifier
  const { data: formFieldsContext } = useQuery(NodeGetContext, {
    variables: parseFormFieldsToQueryContext(
      { globalIdentifierKeys, formReferenceKeys },
      uniqueIdsFormState
    ),
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

  // const getValidators = () => {
  //   const fields = getIdFields()

  //   let validators = {}
  //   // let validators = R.mapToObj(fields, (field) => [field.name, zodifyField(field)])

  //   if (formFields !== undefined) {
  //     formFields.PopulateForm.forEach((field) => {
  //       validators[field.name] = zodifyField(field)
  //     })
  //   }

  //   return validators
  // }

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

  const saveDraft = () => {
    const draftInfo = {
      'form_id': String(metadata.form_id), 
      'patient_id': JSON.stringify(uniqueIdsFormState),
      'data': JSON.stringify(globalFormState),
    }
    createDraft({ 
      variables: { input: draftInfo },
      onCompleted: () => {
        alert("Draft saved")
        setLastDraftUpdate(new Date().toUTCString())
      }
    })
  }

  // on form change (previously was written as "first component render")
  // make sure all states are wiped from
  // any changes like for example a change from
  // one form to another.
  useEffect(() => {
    setValidators({})
    setUniqueIdFormState({});
    setGlobalFormState({});

    // populate form foreign keys, primary keys, globalIdentifierKeys
    const ids = [
      ...globalIdentifierKeys,
      ...formPrimaryIdentifierKeys,
      ...formReferenceKeys.map((fk : any) => {
        const node = { ...fk.node }; // shallow copy node object
        if (fk.override) {
          Object.keys(fk.override).forEach(
            (key) => (node[key] = fk.override[key])
          );
        }
        // --Testing---------
        // console.log(node)
        return node;
      }),
    ];

    setUniqueIdFormState({
      ...R.mapToObj(ids, (field) => [field.name, field.value]),
      submitter_donor_id: patientIdentifier.submitter_donor_id,
      program_id: patientIdentifier.program_id,
    });

    setValidators({
      ...R.mapToObj(ids, (field) => [field.name, zodifyField(field)]),
    });
  
  }, [metadata, patientIdentifier]); // tracking metadata here will reset any foreign key IDs in subsequent forms (maybe needs to re-visited if we do "sticky" foreign keys across forms)

  useEffect(() => {
    if (!formReferenceKeys.length) return;
    // this concept works if all keys within each form are different
    // fixes that might be done at a later time

    // NOTE (For Later...):
    // - assign context to form it comes from to be able deal with forms
    //   that might contain the same field name
    if (
      typeof formFieldsContext === "object" &&
      formFieldsContext.submitters.length > 0
    ) {
      if (Object.keys(context).length > 0) {
        setContext({});
        setUUID({})
      }

      // filter out all non filled Reference Fields

      const filledReferenceFormFields = formReferenceKeys.filter(rk => {
        return uniqueIdsFormState[rk.node.name] !== ""
      });

      const numberOfFilledReferenceFormID = sortSubmitterByFormId(uniqueIdsFormState, filledReferenceFormFields)

      formFieldsContext.submitters[0].fields.forEach((fld) => {

        setContext((context) => ({
          ...context,
          [fld["key"]]: fld["value"],
        }));
      });


      formFieldsContext.submitters[0].connectedFormsReferencingSubmitter.forEach(
        (form) => {
          setUUID((uuids) => ({ ...uuids, [form.form]: form.uuid }))

          form.fields.forEach((fld) => {
            setContext((context) => ({
              ...context,
              [fld["key"]]: fld["value"],
            }));
          });
        }
      );

      // context connection are coherent
      setConnection(numberOfFilledReferenceFormID.length === formFieldsContext.submitters[0].connectedFormsReferencingSubmitter.length)
    }
    // eslint-disable-next-line
  }, [formFieldsContext]);

  const onFormComplete = async () => {

    // Validate Current Form Data 
    const isValid = validateFormFieldInputs(uniqueIdsFormState, globalFormState, conditionalFields, context, validators, errordisplay, setErrorDisplay)
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
        ...submitterBundleQueryParse(formPrimaryIdentifierKeys, globalIdentifierKeys, formReferenceKeys, uniqueIdsFormState, metadata.form_id, isRootForm)
      },
    })

    // --TESTING-----------------------------------
    // console.log("RECEIVED", received.data)

    // --TESTING-----------------------------------
    // console.log("REFERENCE", formReferenceKeys)

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
      // - there cardinality for each form

      if (formReferenceKeys.length > 0) { // there exist no reference keys
        const referenceForms = received.data.ReferencesConnectionOfRoot[0]
        const referenceFormRelationalCardinality = submitterReferenceFormsRelationalCardinality(formReferenceKeys) // 
        let currentForm = "";
        for (let submitter of referenceForms.connectedFormsReferencingSubmitter) {
          currentForm = submitter.form;
          if (referenceFormRelationalCardinality[currentForm] === undefined) continue; // there is no constraints on there relational cardinality

          // there exist a constraints e.g the form referenced has a limited time it can be referenced by this form 
          if (submitter.connectedFormsReferencingSubmitterAggregate.count >= referenceFormRelationalCardinality[currentForm]) {
            alert(`It has already exceeded realtional cardinality of ${currentForm}`)
            return
          }
        }
      }
    } else {
      if (doesSubmitterExist(received.data.root.length)) {
        alert("This already exists")
        return
      }  // **COMMENT OUT**
    }

    const internalFormMetadata = {
      form_id: metadata.form_id,   // ID to distinguish between all forms
      ids: uniqueIdsFormState, // unique set of identifiers to distinguish submitters from eachother
      fields: globalFormState,    // fields submitted by the submitter
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

    // --TESTING-----------------------------------
    console.log(formCreateSchema)

    // all checks are completed now just need to mutate the backend
    createNode({
      variables: { input: [formCreateSchema] },
      onCompleted: (submitter) => {
        createKeycloakSubmitterConnection({ variables: { submitterID: submitter.createSubmitters.submitters[0].uuid } })
        console.log(submitter.createSubmitters.submitters[0].uuid)
        console.log("completed keycloak connection to submitter!")

        setLastSubmission(new Date().toUTCString())
        setPatientIdentifier({ submitter_donor_id: uniqueIdsFormState['submitter_donor_id'], program_id: uniqueIdsFormState['program_id'] })

        alert("Form submitted!")
      }
    });

  };

  // when data is received then update global form state and as well populate the option necessary
  // for the select components
  useEffect(() => {
    if (formFields !== undefined) {
      
      // populate form other fields
      if (Object.keys(globalFormState).length > 0) {
        setGlobalFormState({});
        setOption({});
        setErrorDisplay({});
        setConditionalFields({});
      }

      formFields.PopulateForm.forEach((field) => {
        if (field.conditionals) {
          setConditionalFields((cond) => ({
            ...cond,
            [`${field.name}`]: field.conditionals,
          }));
        }

        if (field.component === "Select") {
          setOption((opt) => ({
            ...opt,
            ...{ [`${field.name}`]: constructDropdown(field.set) },
          }));
        }

        setErrorDisplay((err) => ({
          ...err,
          [`${field.name}`]: null,
        }));

        setValidators((fld) => ({
          ...fld,
          [field.name]: zodifyField(field),
        }));
      });
    }
  }, [formFields, patientIdentifier]);

  //  do not return anything to the DOM if the data is not loaded
  if (loadFieldData) return <></>;
  else if (errorFields)
    return <BasicErrorMessage/>;

  return (
    <div
      key={metadata.form_name}
      style={{ paddingLeft: "60px", paddingRight: "60px" }}
    >
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
          {globalIdentifierKeys.map((fld) => (
            <Form.Field key={fld.name}>
              <div>
                <Popup
                    trigger={<span style={ fld.required ? { color: 'red'} : {display: 'none'}  }>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                  />
                <label style={{ marginRight: '5px' }}>{fld.label}</label>
                <Popup
                  trigger={<Icon name='help circle' />}
                  content={fld.description}
                  position='top center'
                  inverted
                />
              </div>
              <Form.Input
                name={fld.name}
                value={uniqueIdsFormState[fld.name]}
                type={fld.type}
                placeholder={fld.placeholder}
                onChange={(e) => {
                  const recheckValueValidation = validators[
                    fld.name
                  ].safeParse(e.target.value);
                  if (recheckValueValidation.success) {
                    setErrorDisplay((err) => ({ ...err, [fld.name]: null }));
                  }
                  setUniqueIdFormState((f) => ({
                    ...f,
                    [e.target.name]: e.target.value,
                  }));
                }}
                error={errordisplay[fld.name]}
              />
            </Form.Field>
          ))}
        </Form.Group>

        <Form.Group widths={"equal"}>
          {formPrimaryIdentifierKeys.map((fld) => (
            <Form.Field key={fld.name}>
              <div>
                <Popup
                    trigger={<span style={ fld.required ? { color: 'red'} : {display: 'none'}}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                  />
                <label style={{ marginRight: '5px' }}>{fld.label}</label>
                <Popup
                  trigger={<Icon name='help circle' />}
                  content={fld.description}
                  position='top center'
                  inverted
                />
              </div>
              <Form.Input
                name={fld.name}
                value={uniqueIdsFormState[fld.name]}
                type={fld.type}
                // label={fld.label}
                placeholder={fld.placeholder}
                onChange={(e) => {
                  const recheckValueValidation = validators[
                    fld.name
                  ].safeParse(e.target.value);
                  if (recheckValueValidation.success) {
                    setErrorDisplay((err) => ({ ...err, [fld.name]: null }));
                  }
                  setUniqueIdFormState((f) => ({
                    ...f,
                    [e.target.name]: e.target.value,
                  }));
                }}
                error={errordisplay[fld.name]}
              />
            </Form.Field>
          ))}
        </Form.Group>

        <Form.Group widths={"equal"}>
          {formReferenceKeys.map((fld) => {
            return (
              <Form.Field key={fld.node.name}>
                <div>
                  <Popup
                    trigger={<span style={ fld.node.required && fld.override == null ? { color: 'red'} : {display: 'none'}}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                  />
                  <label style={{ marginRight: '5px' }}>{fld.node.label}</label>
                  <Popup
                    trigger={<Icon name='help circle' />}
                    content={fld.node.description}
                    position='top center'
                    inverted
                  />
                </div>
                <Form.Input
                  name={fld.node.name}
                  value={uniqueIdsFormState[fld.node.name]}
                  type={fld.node.type}
                  // label={fld.node.label}
                  placeholder={fld.node.placeholder}
                  onChange={(e) => {
                    const recheckValueValidation = validators[fld.node.name].safeParse(e.target.value)
                    if (recheckValueValidation.success) {
                      setErrorDisplay((err) => ({ ...err, [fld.node.name]: null }))
                    }
                    setUniqueIdFormState((f) => ({
                      ...f,
                      [e.target.name]: e.target.value,
                    }));
                  }}
                  error={errordisplay[fld.node.name]}
                />
              </Form.Field>
            );
          })}
        </Form.Group>
        <DraftContent
          key={lastDraftUpdate} // this state variable gets updated whenever the drafts change
          metadata={metadata}
          headers={getTableHeaders()}
          uniqueIdsFormState={uniqueIdsFormState}
          patientIdentifier={patientIdentifier}
          setGlobalFormState={setGlobalFormState}
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
          key={lastSubmission} // this state variable gets updated when the form is submitted
          form={metadata.form_id}
          searchForRootForm={isRootForm}
          globalIdentifierKeys={getKeyValuePairs(
            globalIdentifierKeys.map((id) => id.name),
            uniqueIdsFormState
          )}
          formPrimaryIdentifierKeys={getKeyValuePairs(
            formPrimaryIdentifierKeys.map((pk) => pk.name),
            uniqueIdsFormState
          )}
          identifierKeys={uniqueIdsFormState}
          updateUniqueIdsFormState={setUniqueIdFormState}
          updateGlobalFormState={setGlobalFormState}
        />

        {option &&
          formFields.PopulateForm.map((fld) => {
            let comp = <></>;

            const disabled =
              fld.conditionals === null
                ? false
                : doesFieldNotMeetAllConditions(
                  fld.conditionals,
                  globalFormState,
                  context
                );
            const displayError = disabled ? null : errordisplay[fld.name];
            // add new components here - e.g. if for >5 then Button Select and also change field type in Neo4j for that field
            switch (fld.component) {
              case "Input":
                if (fld.type === "month") {
                  comp = (
                    <Form.Field disabled={disabled} error={displayError}>
                      <div>
                        <Popup
                          trigger={<span style={ fld.required && !disabled ? { color: 'red'} : {display: 'none'}}>* </span>}
                          content={"Required field."}
                          position='top center'
                          inverted
                        />
                        <label style={{ marginRight: '5px' }}>{fld.label}</label>
                        <Popup
                          trigger={!disabled && <Icon name='help circle' />}
                          content={fld.description}
                          position='top center'
                          inverted
                        />
                      </div>
                      <DatePicker
                        selected={globalFormState[fld.name]}
                        placeholderText={fld.placeholder}
                        onChange={(date) => {
                          const recheckValueValidation = validators[
                            fld.name
                          ].safeParse(date === null ? date : new Date(date));
                          if (recheckValueValidation.success) {
                            setErrorDisplay((err) => ({
                              ...err,
                              [fld.name]: null,
                            }));
                          }
                          setGlobalFormState((f) => ({
                            ...f,
                            [fld.name]: date === null ? date : new Date(date),
                          }));
                        }}
                        dateFormat="MM/yyyy"
                        isClearable
                        showMonthYearPicker
                        showFullMonthYearPicker
                        showFourColumnMonthYearPicker
                      />
                    </Form.Field>
                  );
                } else if (fld.type === "textarea") {
                  comp = (
                    <Form.Field disabled={disabled} error={displayError}>
                      <div>
                        <Popup
                          trigger={<span style={ fld.required && !disabled ? { color: 'red'} : {display: 'none'}}>* </span>}
                          content={"Required field."}
                          position='top center'
                          inverted
                        />
                        <label style={{ marginRight: '5px' }}>{fld.label}</label>
                        <Popup
                          trigger={!disabled && <Icon name='help circle' />}
                          content={fld.description}
                          position='top center'
                          inverted
                        />
                      </div>
                      <Form.TextArea
                        name={fld.name}
                        rows={4}
                        value={globalFormState[fld.name]}
                        // type={fld.type}
                        // label={fld.label}
                        placeholder={fld.placeholder}
                        onChange={(e) => {
                          let value = ["number", "integer"].includes(
                            fld.type.toLowerCase()
                          )
                            ? +e.target.value
                            : e.target.value;
                          value = Number.isNaN(value) ? fld.value : value;                          
                          const recheckValueValidation =
                            validators[fld.name].safeParse(value);
                          if (recheckValueValidation.success) {
                            setErrorDisplay((err) => ({
                              ...err,
                              [fld.name]: null,
                            }));
                          }
                          setGlobalFormState((f) => ({
                            ...f,
                            [e.target.name]: value,
                          }));
                        }}
                        // disabled={disabled}
                        error={displayError}
                      />
                    </Form.Field>
                  );
                } else {
                  comp = (
                    <Form.Field disabled={disabled} error={displayError}>
                      <div>
                        <Popup
                          trigger={<span style={ fld.required && !disabled ? { color: 'red'} : {display: 'none'}}>* </span>}
                          content={"Required field."}
                          position='top center'
                          inverted
                        />
                        <label style={{ marginRight: '5px' }}>{fld.label}</label>
                        <Popup
                          trigger={!disabled && <Icon name='help circle' />}
                          content={fld.description}
                          position='top center'
                          inverted
                        />
                      </div>
                      <Form.Input
                        name={fld.name}
                        value={globalFormState[fld.name]}
                        type={fld.type}
                        // label={fld.label}
                        placeholder={fld.placeholder}
                        onChange={(e) => {
                          let value = ["number", "integer"].includes(
                            fld.type.toLowerCase()
                          )
                            ? +e.target.value
                            : e.target.value;
                          value = Number.isNaN(value) ? fld.value : value;

                          const recheckValueValidation =
                            validators[fld.name].safeParse(value);
                          if (recheckValueValidation.success) {
                            setErrorDisplay((err) => ({
                              ...err,
                              [fld.name]: null,
                            }));
                          }
                          setGlobalFormState((f) => ({
                            ...f,
                            [e.target.name]: value,
                          }));
                        }}
                        // disabled={disabled}
                        error={displayError}
                      />
                    </Form.Field>
                  );
                }
                break;
              case "Select":
                // check if the option is undefined under the field name if so do not populate the selects ...
                if (option[fld.name] === undefined) break;

                if (option[fld.name].length <= 4) {
                  comp = (
                    <Form.Field disabled={disabled} error={displayError}>
                      <div>
                        <Popup
                          trigger={<span style={ fld.required && !disabled ? { color: 'red'} : {display: 'none'}}>* </span>}
                          content={"Required field."}
                          position='top center'
                          inverted
                        />
                        <label style={{ marginRight: '5px' }}>{fld.label}</label>
                        <Popup
                          trigger={!disabled && <Icon name='help circle' />}
                          content={fld.description}
                          position='top center'
                          inverted
                        />
                      </div>
                      <Form.Group widths={option[fld.name].length}>
                        {R.map(option[fld.name], (selectOption) => {
                          const isActive =
                            globalFormState[fld.name] === selectOption.value;
                          return (
                            <Form.Button
                              fluid
                              key={selectOption.value}
                              basic={!isActive}
                              active={isActive}
                              color={isActive ? "teal" : undefined}
                              onClick={(_e) => {
                                const recheckValueValidation = validators[
                                  fld.name
                                ].safeParse(selectOption.value);
                                if (recheckValueValidation.success) {
                                  setErrorDisplay((err) => ({
                                    ...err,
                                    [fld.name]: null,
                                  }));
                                }
                                setGlobalFormState((fields) => ({
                                  ...fields,
                                  ...{ [fld.name]: selectOption.value },
                                }));
                              }}
                              error={displayError}
                            >
                              {selectOption.text}
                            </Form.Button>
                          );
                        })}
                      </Form.Group>
                    </Form.Field>
                  );
                } else {
                  comp = (
                    <Form.Field disabled={disabled} error={displayError}>
                      <div>
                        <Popup
                          trigger={<span style={ fld.required && !disabled ? { color: 'red'} : {display: 'none'}}>* </span>}
                          content={"Required field."}
                          position='top center'
                          inverted
                        />
                        <label style={{ marginRight: '5px' }}>{fld.label}</label>
                        <Popup
                          trigger={!disabled && <Icon name='help circle' />}
                          content={fld.description}
                          position='top center'
                          inverted
                        />
                      </div>
                      <Form.Select
                        key={fld.name}
                        search
                        name={fld.name}
                        value={fld.type === "mutiple" && globalFormState[fld.name] === "" ? [] : globalFormState[fld.name]}
                        multiple={fld.type === "mutiple"}
                        placeholder={fld.placeholder}
                        // label={fld.label}
                        options={option[fld.name]}
                        onChange={(e, { name, value }) => {
                          const recheckValueValidation =
                            validators[name].safeParse(value);
                          if (recheckValueValidation.success) {
                            setErrorDisplay((err) => ({
                              ...err,
                              [fld.name]: null,
                            }));
                          }
                          setGlobalFormState((fields) => ({
                            ...fields,
                            ...{ [name]: value },
                          }));
                        }}
                        clearable
                        // disabled={disabled}
                        error={errordisplay[fld.name]}
                      />
                    </Form.Field>
                  );
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
          {/* <Button.Or />
          <Button
            inverted
            icon="trash"
            content="CLEAR FORMS"
            color="red"
            onClick={() => { setPatientIdentifier({ submitter_donor_id: '', program_id: '' }) }}
          ></Button> */}
        </Button.Group>
      </Form>
    </div>
  );
}
