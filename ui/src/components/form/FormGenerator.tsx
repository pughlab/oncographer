import React, { useEffect, useState } from "react";
import { Form } from "semantic-ui-react";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import { z } from "zod";

import {
  FieldData,
  NodeExist,
  constructDropdown,
  ParseFormToGraphQL,
  doesNotMeetAllConditions,
  getKeysValuePair,
  parseFormIDCTX,
  NodeGetCTX
} from "./utils.js";

import { TableTool } from "./table/FormTable";

export function FormGenerator({ metadata }) {
  // const formRef                               = useRef();
  const [globalFormState, setGlobalFormState] = useState({});
  const [validationObject, setValidationObject] = useState({});
  const [uids, setUuids] = useState({});
  const [option, setOption] = useState({});
  const [nodeEvent, setNodeEvent] = useState("submit");
  const [ctx, setCTX] = useState({})
  const identifier = metadata.identifier.filter(
    (fld) => !metadata.primary_key.map((fld) => fld.name).includes(fld.name)
  );
  const primaryKeys = metadata.primary_key.filter(
    (field) =>
      !identifier
        .map((fld) => JSON.stringify(fld))
        .includes(JSON.stringify(field))
  );
  const foreignKeys = metadata.foreign_key.edges;

  const {
    loading: loadFieldData,
    error: errorFields,
    data: formFields,
  } = useQuery(FieldData, {
    variables: { id: metadata.form_id },
  });


  const [getNodeExist, { loading, error }] = useLazyQuery(NodeExist, {
    fetchPolicy: "network-only",
  });

  // const [CreateNode] = useMutation();

  useEffect(() => {
    setUuids({});
    setGlobalFormState({});
    setValidationObject({})
    setOption({})

    // populate form foreign keys, primary keys, identifier
    const ids = [
      ...identifier,
      ...primaryKeys,
      ...foreignKeys.map((fk) => fk.node),
    ];
    ids.map((field) =>
      setUuids((id) => ({
        ...id,
        [field.name]: field.value,
      }))
    );

    // eslint-disable-next-line
  }, []);

    const {
      data: FormFieldsCTX,
    } = useQuery(NodeGetCTX, {
      variables: parseFormIDCTX({identifier, foreignKeys}, uids),
    });

  
  useEffect(() => {

    // this conceptual works if all keys within each form are diffrent
    // fixes that might be done at a later time
    // NOTE (For Later...): 
    // - assign ctx to form it comes from to be able deal with forms
    //   that might contain the same field name
    if (typeof FormFieldsCTX === "object" && FormFieldsCTX.ctx.length > 0){
      if (Object.keys(ctx).length > 0) setCTX({});
      FormFieldsCTX.ctx[0].fields.forEach((fld) => {
        console.log({[fld["key"]] : fld["value"],})
        setCTX((ctx) => ({
          ...ctx,
          [fld["key"]] : fld["value"],
        }))
      })

     FormFieldsCTX.ctx[0].references.forEach((form) => {
        form.fields.forEach((fld)=> {  
          console.log({[fld["key"]] : fld["value"],})
          setCTX((ctx) => ({
            ...ctx,
            [fld["key"]] : fld["value"],
          }))
        })
      })


    }
  },[FormFieldsCTX])

  const onFormComplete = async (event) => {
    // Validate Form
    //...
    //...
    // if there are foreign keys then need
    // to check if it is consistent

    const formCreateSchema = ParseFormToGraphQL(
        { ids: uids, fields: globalFormState, form_id: metadata.form_id },
        {
          identifier,
          primaryKeys,
          foreignKeys,
          formFields: formFields.PopulateForm,
        });

    console.log(formCreateSchema)

    // given if the node exist then do not populate the backend
    // alert the user in anyway...
    const doseNodeExist = await getNodeExist({
      variables: {
        where: {
          form: metadata.form_id,
          primary_keys: formCreateSchema.primary_keys,
        },
      },
    });

    if (doseNodeExist.data.exist.length) {
      alert("Node exists");
      return;
    } // do nothing
  }


  useEffect(() => {
    if (formFields !== undefined) {

      // populate form other fields
      formFields.PopulateForm.forEach((field) => {
        
        if (field.component === "Select") {
          setOption((opt) => ({
            ...opt,
            ...{ [`${field.name}`]: constructDropdown(field.set) },
          }));
        }
        
        setGlobalFormState((fld) => ({
          ...fld,
          [field.name]: field.value,
        }));

        

        setValidationObject((fld) => (z.object({
          ...fld,
          [field.name] : null,
        })))

      });
    }
    // eslint-disable-next-line
  }, [formFields]);

  if (loadFieldData) return <></>;
  if (errorFields) return `Somthing went wrong within the backend ${errorFields}`;
  
  return (
    <div
      key={metadata.form_name}
      style={{ paddingLeft: "60px", paddingRight: "60px" }}
    >
      <Form
        size="small"
        onSubmit={(event) => {
          setNodeEvent("submit");
          onFormComplete(event);
        }}
      >
        <Form.Group widths={"equal"}>
          {identifier.map((fld) => (
            <Form.Input
            name={fld.name}
            value={uids[fld.name]}
            type={fld.type}
            label={fld.label}
            placeholder={fld.placeholder}
            onChange={(e) => {setUuids((f) => ({...f, [e.target.name] : e.target.value}))}}
          />
          ))}
        </Form.Group>

        <Form.Group widths={"equal"}>
          {primaryKeys.map((fld) => (
            <Form.Input
            name={fld.name}
            value={uids[fld.name]}
            type={fld.type}
            label={fld.label}
            placeholder={fld.placeholder}
            onChange={(e) => {setUuids((f) => ({...f, [e.target.name] : e.target.value}))}}
          />
          ))}
        </Form.Group>

        <TableTool form={metadata.form_id}
                   searchBy={identifier.length}
                   identifier={getKeysValuePair(identifier.length ? identifier.map(id => id.name) : primaryKeys.map(pk => pk.name), uids)}/>

        <Form.Group widths={"equal"}>
          {foreignKeys.map((fld) => {
           return ( <Form.Input
            name={fld.node.name}
            value={uids[fld.node.name]}
            type={fld.node.type}
            label={fld.node.label}
            placeholder={fld.node.placeholder}
            onChange={(e) => {setUuids((f) => ({...f, [e.target.name] : e.target.value}))}}
          />)
          })}
        </Form.Group>

        {option && formFields.PopulateForm.map((fld) => {
          var comp = <></>;

          switch (fld.component) {
            case "Input":
              comp = (
                <Form.Input
                name={fld.name}
                value={globalFormState[fld.name]}
                type={fld.type}
                label={fld.label}
                placeholder={fld.placeholder}
                onChange={(e) => {setGlobalFormState((f) => ({...f, [e.target.name] : e.target.value}))}}
                disabled={fld.conditionals === null ? false : doesNotMeetAllConditions(fld.conditionals, globalFormState, ctx)}
              />
              );
              break;
            case "Select":
            
              if (option[fld.name] === undefined) break; 
              
            
              // console.log( globalFormState[Object.keys(fld.filter)[0]] === "" ? option[fld.name] : option.map(value => fld.filter[Object.keys(fld.filter)[0]][globalFormState[Object.keys(fld.filter)[0]]].includes(value.text)))
              comp = (
                <Form.Select
                key={fld.name}
                search={option[fld.name].length > 8}
                name={fld.name}
                value={setGlobalFormState[fld.name]}
                multiple={fld.type === "mutiple"}
                placeholder={fld.placeholder}
                label={fld.label}
                options={option[fld.name]} 
                onChange={(e, { name, value }) => setGlobalFormState((feilds) => ({ ...feilds, ...{ [name]: value } }))}
                clearable
                disabled={fld.conditionals === null ? false : doesNotMeetAllConditions(fld.conditionals, globalFormState, ctx)}
              />
              );
              break;
            default:
              break;
          }
          return comp;
        })}

        <Form.Group size="small" widths={"two"}>
          <Form.Button
            content="Submit"
            color="blue"
            onClick={() => {
              setNodeEvent("submit");
            }}
          ></Form.Button>
          <Form.Button
            content="Update"
            color="blue"
            onClick={() => {
              setNodeEvent("update");
            }}
          ></Form.Button>
        </Form.Group>
      </Form>
    </div>
  );
}