import React, { useEffect, useState } from "react";
import { Form, Divider, Header, Icon, Button } from "semantic-ui-react";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import * as R from "remeda";

import {
  constructDropdown,
  ParseFormToGraphQL,
  doesFieldNotMeetAllConditions,
  getKeysValuePair,
  parseFormFieldsToQueryContext,
} from "./utils";

import { zodifiyField, ParseError } from "./validate/validator";
import {
  FieldData,
  NodeExist,
  CreateNode,
  NodeGetContext,
} from "./queries/query";

import { TableTool } from "./table/FormTable";

export function FormGenerator({ metadata, patientIdentifier }) {
  const [validationObject, setValidationObject] = useState({});
  const [errordisplay, setErrorDisplay] = useState({});
  const [globalFormState, setGlobalFormState] = useState({}); // Global State of the current form that holds all data inputs
  const [uniqueIdsFormState, setUniqueIdFormState] = useState({}); // Contains all the form States unique IDs and there inputs within the current form
  const [conditionalsFields, setConditionalsFields] = useState({});
  const [option, setOption] = useState({}); // Options of the Select Component fields **TODO: CHANGE AND STORE WITHIN BACKEND***

  const [nodeEvent, setNodeEvent] = useState("submit"); // Protocol State in which to handle the data within the form when it is submited
  // to be processed to the backend

  const [context, setContext] = useState({}); // Context holds all the information of form that hold being refrenced by
  // either the identifiers, and foreign keys

  //  is a referance to root of the form directed acyclic graph in which all forms use there primary key
  //
  const globalIdentifierKeys = metadata.identifier.filter(
    (fld) => !metadata.primary_key.map((fld) => fld.name).includes(fld.name)
  );
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

  // (Populate Form Fields GraphQL Query) that loads all field data within the form
  const {
    loading: loadFieldData,
    error: errorFields,
    data: formFields,
  } = useQuery(FieldData, {
    variables: { id: metadata.form_id },
  });

  // (Populated Sumbitter Node Exist Query)
  const [getNodeExist] = useLazyQuery(NodeExist, {
    fetchPolicy: "network-only",
  });

  // (Context GraphQL Query) given there is a foreign or an identifier
  // give inter connection context to the form allowing form to have inter
  // connected conditions
  const { data: formFieldsContext } = useQuery(NodeGetContext, {
    variables: parseFormFieldsToQueryContext(
      { globalIdentifierKeys, formReferenceKeys },
      uniqueIdsFormState
    ),
  });

  console.log( "CONTEXT:",
    JSON.stringify(
      parseFormFieldsToQueryContext(
        { globalIdentifierKeys, formReferenceKeys },
        uniqueIdsFormState
      )
    )
  );
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
      ...formReferenceKeys.map((fk) => {
        const node = { ...fk.node }; // shallow copy node object
        if (fk.override) {
          Object.keys(fk.override).forEach(
            (key) => (node[key] = fk.override[key])
          );
        }
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
      if (Object.keys(context).length > 0) setContext({});

      formFieldsContext.submitters[0].fields.forEach((fld) => {
        setContext((context) => ({
          ...context,
          [fld["key"]]: fld["value"],
        }));
      });

      formFieldsContext.submitters[0].connectedFormsReferencingSubmitter.forEach(
        (form) => {
          form.fields.forEach((fld) => {
            setContext((context) => ({
              ...context,
              [fld["key"]]: fld["value"],
            }));
          });
        }
      );
    }

    // eslint-disable-next-line
  }, [formFieldsContext]);

  const onFormComplete = async () => {
    // Validate Form
    //...
    //...
    const form = { ...uniqueIdsFormState, ...globalFormState };

    let stopPopulatingProcess: boolean = false;
    for (const key in validationObject) {
      if (
        conditionalsFields[key] &&
        doesFieldNotMeetAllConditions(
          conditionalsFields[key],
          globalFormState,
          context
        )
      ) {
        continue;
      }

      const validate = validationObject[key].safeParse(form[key]);

      if (!validate.success) {
        stopPopulatingProcess = true;
        setErrorDisplay((err) => ({
          ...err,
          [key]: ParseError(validate.error.issues),
        }));
      } else if (errordisplay[key] !== null) {
        setErrorDisplay((err) => ({ ...err, [key]: null }));
      }
    }

    console.log("1-process-stop:", stopPopulatingProcess);
    if (stopPopulatingProcess) return;

    // if there are foreign keys then need
    // to check if it is consistent

    // if there exist a fogien key
    // check with the context state (context)
    // if the form exist with in the

    // create the muation variables to populate the neo4j...

    const formCreateSchema = ParseFormToGraphQL(
      {
        ids: uniqueIdsFormState,
        fields: globalFormState,
        form_id: metadata.form_id,
      },
      {
        globalIdentifierKeys,
        formPrimaryIdentifierKeys,
        formReferenceKeys,
        formFields: formFields.PopulateForm,
      }
    );

    // console.log(JSON.stringify(formCreateSchema))

    // given if the node exist then do not populate the backend
    // alert the user in anyway...
    // const doseNodeExist = await getNodeExist({
    //   variables: {
    //     where: {
    //       form: metadata.form_id,
    //       primary_keys: formCreateSchema.primary_keys,
    //     },
    //   },
    // });

    // if (doseNodeExist.data.exist.length) {
    //   alert("Node exists");
    //   return;
    // } // do nothing

    createNode({ variables: { input: [formCreateSchema] } });

    // if (nodeEvent === "submit"){
    //   createNode({variables  : { "input" : [formCreateSchema]}})
    //   alert("submit")
    // } else {
    //   alert("Update Do Nothing... Right now");
    //   return;
    // }
  };

  console.log("context : ", context);

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
                  // const recheckValueValidation = validationObject[fld.name].safeParse(e.target.value)
                  // if (recheckValueValidation.success){
                  //  setErrorDisplay((err) =>({ ...err, [fld.name] : null}))
                  // }
                  setUniqueIdFormState((f) => ({
                    ...f,
                    [e.target.name]: e.target.value,
                  }));
                }}
                error={errordisplay[fld.name]}
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
        <TableTool
          form={metadata.form_id}
          searchForRootForm={!globalIdentifierKeys.length}
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
