import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useLazyQuery, LazyQueryExecFunction, OperationVariables} from "@apollo/client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Form, Divider, Header, Icon, Button } from "semantic-ui-react";


import * as R from "remeda";

import {
  constructDropdown,
  ParseFormToGraphQL,
  doesFieldNotMeetAllConditions,
  getKeysValuePair,
  parseFormFieldsToQueryContext,
  validateFormFieldInputs,
  submitterBundleQueryParse,
  sortSubmitterByFormId,
  submitterReferenceFormsRelationalCardinality,
  doesSumbitterExist
} from "./utils";
import { zodifiyField } from "./validate/validator";
import {
  FieldData,
  CreateNode,
  NodeGetContext,
  submitterBundle,
  doesRootExist
} from "./queries/query";

import { FormTable } from "./table/FormTable";

export function FormGenerator({ metadata, patientIdentifier }) {

  const relationalCardinalityToRoot = metadata.form_relationship_cardinality
  const [validationObject, setValidationObject] = useState({});
  const [errordisplay, setErrorDisplay] = useState({});
  const [globalFormState, setGlobalFormState] = useState({}); // Global State of the current form that holds all data inputs
  const [uniqueIdsFormState, setUniqueIdFormState] = useState({}); // Contains all the form States unique IDs and there inputs within the current form
  const [conditionalsFields, setConditionalsFields] = useState({});
  const [option, setOption] = useState({}); // Options of the Select Component fields **TODO: CHANGE AND STORE WITHIN BACKEND***
  const [coherentConnections, setConnetion] = useState(false); // all references keys that are being used exist
  const [nodeEvent, setNodeEvent] = useState("pending"); // Protocol State in which to handle the data within the form when it is submited
  // to be processed to the backend
  const [context, setContext] = useState({}); // Context holds all the information of form that hold being refrenced by
  // either the identifiers, and foreign keys
  

  //  Is a referance to root of the form directed acyclic graph in which all forms use there primary key
  const globalIdentifierKeys = metadata.identifier.filter(
    (fld) => !metadata.primary_key.map((fld) => fld.name).includes(fld.name)
  );

  const isRootForm = !globalIdentifierKeys.length;

  // primary identifier of the current form. This allows us to be able to identify the node that will
  // the backend later on
  // formPrimaryIdentifierKeys
  const formPrimaryIdentifierKeys = metadata.primary_key.filter(
    (field) =>
      !globalIdentifierKeys
        .map((fld) => JSON.stringify(fld))
        .includes(JSON.stringify(field))
  );

  // foreign identifier of the current form. This is the identifier that connects to other existing forms and there
  // primary identifier
  const formReferenceKeys = metadata.foreign_key.edges;
  const [formReferenceKeysUUID, setUUID] = useState({});
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

  // TESTING------------------------------
  // console.log(JSON.stringify(parseFormFieldsToQueryContext(
  //   { globalIdentifierKeys, formReferenceKeys },
  //   uniqueIdsFormState
  // )))

  const [createNode] = useMutation(CreateNode);

  

  // On First Component Render
  // make sure all states are wiped from
  // any changes like for example a change from
  // one form to another.
  useEffect(() => {
    setValidationObject({});
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

    setValidationObject({
      ...R.mapToObj(ids, (field) => [field.name, zodifiyField(field)]),
    });


    // eslint-disable-next-line
  }, [metadata, patientIdentifier]);

  useEffect(() => {
    if (!formReferenceKeys.length) return;
    // this conceptual works if all keys within each form are diffrent
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
        if (uniqueIdsFormState[rk.node.name] === "") return false
        return true
      });
      
      const numberOfFilledRefrenceFormID = sortSubmitterByFormId(uniqueIdsFormState, filledReferenceFormFields)

      formFieldsContext.submitters[0].fields.forEach((fld) => {
        
        setContext((context) => ({
          ...context,
          [fld["key"]]: fld["value"],
        }));
      });

      
      formFieldsContext.submitters[0].connectedFormsReferencingSubmitter.forEach(
        (form) => {
          setUUID((uuids) => ({...uuids, [form.form] : form.uuid}))
          
          form.fields.forEach((fld) => {
            setContext((context) => ({
              ...context,
              [fld["key"]]: fld["value"],
            }));
          });
        }
      );

      // context connection are coherent
      setConnetion(numberOfFilledRefrenceFormID.length === formFieldsContext.submitters[0].connectedFormsReferencingSubmitter.length)
    }

    // eslint-disable-next-line
  }, [formFieldsContext]);



  const onFormComplete = async () => {
    
    // Validate Current Form Data 
    const isValid = validateFormFieldInputs(uniqueIdsFormState,globalFormState,conditionalsFields,context,validationObject,errordisplay,setErrorDisplay)
    if (isValid || (formReferenceKeys.length > 0 && !coherentConnections)){
      alert(isValid ? `The are some unvalid fields` : `The references you enter do not make sense`) 
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
      //   YES: connection meet there relationship cardinality of it's refereces
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


    if (!isRootForm){

      if (formPrimaryIdentifierKeys.length > 0 && doesSumbitterExist(received.data.root[0].connectedFormsReferencingSubmitterAggregate.count)) {
        alert("This already exists")
        return}  // **COMMENT OUT**

      const formCountToRoot = received.data.CurrentRelationalCardinalityOfFormToRoot[0].connectedFormsReferencingSubmitterAggregate.count;
      if ( relationalCardinalityToRoot !== null && formCountToRoot >= relationalCardinalityToRoot ) {
        alert("There exsit to many forms under this root")
        return;
      }
    
      // INFO NEEDED TO COMPUTE IF IT MEETS CARDINALITY
      // - data of all reference forms filled
      // - there cardinality for each form
      
      if (formReferenceKeys.length > 0){ // there exist no refrence keys
        const referenceForms = received.data.RefrencesConnectionOfRoot[0] 
        const referenceFormRelationalCardinality = submitterReferenceFormsRelationalCardinality(formReferenceKeys) // 
        let currentForm = "";
        for (let i = 0; i < referenceForms.connectedFormsReferencingSubmitter.length; i++){
          currentForm = referenceForms.connectedFormsReferencingSubmitter[i].form;
          if (referenceFormRelationalCardinality[currentForm] === undefined) continue; // there is no constraints on there relational cardinality

          // there exist a constraints e.g the form referenced has a limited time it can be referenced by this form 
          if (referenceForms.connectedFormsReferencingSubmitter[i].connectedFormsReferencingSubmitterAggregate.count >= referenceFormRelationalCardinality[currentForm]) {
            alert(`It has already exceeded realtional cardinality of ${currentForm}`)
            return
          }
        }
      } 
    } else {
      if (doesSumbitterExist(received.data.root.length)) {
        alert("This already exists")
        return}  // **COMMENT OUT**
    }

    const internalFormMetadata = {
      form_id: metadata.form_id,   // ID to distinguish between all forms
      ids    : uniqueIdsFormState, // unique set of identifiers to distinguish submitters from eachother
      fields : globalFormState,    // fields submitted by the submitter
      context: context,            // contextual information provided by referenced forms
      uuids : formReferenceKeysUUID
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
    createNode({ variables: { input: [formCreateSchema] } });
  };

  // when data is recived then update global form state and as well populate the option necessary
  // for the select components
  useEffect(() => {
    if (formFields !== undefined) {
      // populate form other fields
      if (Object.keys(globalFormState).length > 0) {
        setGlobalFormState({});
        setOption({});
        setErrorDisplay({});
        setConditionalsFields({});
      }

      formFields.PopulateForm.forEach((field) => {
        if (field.conditionals) {
          setConditionalsFields((cond) => ({
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

        setGlobalFormState((fld) => ({
          ...fld,
          [field.name]: field.value,
        }));

        setValidationObject((fld) => ({
          ...fld,
          [field.name]: zodifiyField(field),
        }));
      });
    }
    // eslint-disable-next-line
  }, [formFields, patientIdentifier]);

  //  do not return anything to the DOM if the data is not loaded
  if (loadFieldData) return <></>;
  else if (errorFields)
    return `Somthing went wrong within the backend ${errorFields}`;

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
            <Form.Input
              name={fld.name}
              value={uniqueIdsFormState[fld.name]}
              type={fld.type}
              label={fld.label}
              placeholder={fld.placeholder}
              onChange={(e) => {
                const recheckValueValidation = validationObject[
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
          ))}
        </Form.Group>

        <Form.Group widths={"equal"}>
          {formPrimaryIdentifierKeys.map((fld) => (
            <Form.Input
              name={fld.name}
              value={uniqueIdsFormState[fld.name]}
              type={fld.type}
              label={fld.label}
              placeholder={fld.placeholder}
              onChange={(e) => {
                const recheckValueValidation = validationObject[
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
          ))}
        </Form.Group>

        <Form.Group widths={"equal"}>
          {formReferenceKeys.map((fld) => {
            return (
              <Form.Input
                name={fld.node.name}
                value={uniqueIdsFormState[fld.node.name]}
                type={fld.node.type}
                label={fld.node.label}
                placeholder={fld.node.placeholder}
                onChange={(e) => {
                  const recheckValueValidation = validationObject[fld.node.name].safeParse(e.target.value)
                  if (recheckValueValidation.success){
                   setErrorDisplay((err) =>({ ...err, [fld.node.name] : null}))
                  }
                  setUniqueIdFormState((f) => ({
                    ...f,
                    [e.target.name]: e.target.value,
                  }));
                }}
                error={errordisplay[fld.node.name]}
              />
            );
          })}
        </Form.Group>
        <Divider hidden />
        <Divider horizontal>
          <Header as="h4">
            <Icon name="folder open" />
            DATA
          </Header>
        </Divider>
        <FormTable
          form={metadata.form_id}
          searchForRootForm={isRootForm}
          globalIdentifierKeys={getKeysValuePair(
            globalIdentifierKeys.map((id) => id.name),
            uniqueIdsFormState
          )}
          formPrimaryIdentifierKeys={getKeysValuePair(
            formPrimaryIdentifierKeys.map((pk) => pk.name),
            uniqueIdsFormState
          )}
          updateUniqueIdsFormState={setUniqueIdFormState}
          updateGlobalFormState={setGlobalFormState}
        />

        {option &&
          formFields.PopulateForm.map((fld) => {
            var comp = <></>;

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
                      <label>{fld.label}</label>
                      <DatePicker
                        selected={globalFormState[fld.name]}
                        placeholderText={fld.placeholder}
                        onChange={(date) => {
                          const recheckValueValidation = validationObject[
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
                } else {
                  comp = (
                    <Form.Input
                      name={fld.name}
                      value={globalFormState[fld.name]}
                      type={fld.type}
                      label={fld.label}
                      placeholder={fld.placeholder}
                      onChange={(e) => {
                        let value = ["number", "integer"].includes(
                          fld.type.toLowerCase()
                        )
                          ? +e.target.value
                          : e.target.value;
                        value = Number.isNaN(value) ? fld.value : value;

                        const recheckValueValidation =
                          validationObject[fld.name].safeParse(value);
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
                      disabled={disabled}
                      error={displayError}
                    />
                  );
                }
                break;
              case "Select":
                // check of the option is undefined under the field name if so do not populate the selects ...
                if (option[fld.name] === undefined) break;

                if (option[fld.name].length <= 4) {
                  comp = (
                    <Form.Field disabled={disabled} error={displayError}>
                      <label>{fld.label}</label>
                      <Form.Group widths={option[fld.name].length}>
                        {R.map(option[fld.name], (selectOption) => {
                          const isActive =
                            globalFormState[fld.name] === selectOption.value;
                          return (
                            <Form.Button
                              fluid
                              basic={!isActive}
                              active={isActive}
                              color={isActive ? "teal" : undefined}
                              onClick={(e) => {
                                const recheckValueValidation = validationObject[
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
                    <Form.Select
                      key={fld.name}
                      search
                      name={fld.name}
                      value={globalFormState[fld.name]}
                      multiple={fld.type === "mutiple"}
                      placeholder={fld.placeholder}
                      label={fld.label}
                      options={option[fld.name]}
                      onChange={(e, { name, value }) => {
                        const recheckValueValidation =
                          validationObject[name].safeParse(value);
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
                      disabled={disabled}
                      error={errordisplay[fld.name]}
                    />
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
            icon="send"
            size="huge"
            content="SUBMIT"
            color="teal"
            onClick={() => {
              // setNodeEvent("submit");
              // setNodeEvent("submit");
              onFormComplete();
            }}
          ></Button>
          <Button.Or />
          <Button
            icon="sync alternate"
            content="UPDATE"
            color="black"
            style={{ backgroundColor: "#01859d" }}
            disabled
            onClick={() => {
              setNodeEvent("update");
              // context(uniqueIdsFormState)
            }}
          ></Button>
        </Button.Group>
      </Form>
    </div>
  );
}
