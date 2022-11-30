import { Table, Segment, Image, Message } from "semantic-ui-react";
import { useQuery, gql } from "@apollo/client";
import React from "React"
import logo from '../../logos/logo.png'
import "./table.css"

const patientForm = gql`
query($where: SubmitterWhere, $reference: SubmitterWhere) {
  submitters(where: $where) {
    reference_primary_key(where: $reference) {
      form
      uuid
      primary_keys
      reference_foreign_key {
        primary_keys
      }
      fields {
        key
        value
      }
    } 
  }
}`;

const root = gql`
query($where: SubmitterWhere) {
  submitters(where: $where) {
    form
    uuid
    reference_foreign_key {
      primary_keys
    }
    primary_keys
    fields {
      key
      value
    }
    
  }
}`

const keyToLabel = (str) => str.split("_").map(val => { return val.charAt(0).toUpperCase() + val.substring(1); }).join(" ")

// **REFACTOR**
// THIS NEEDS TO REFACTORED
export const TableTool = ({
  form,
  searchBy,
  identifier,
  primaryKeys,
  updateUniqueIdsFormState,
  updateGlobalFormState,
}) => {

  console.log("SEARCH BY")
  console.log(searchBy)
  const { loading, data, error } = useQuery(searchBy ? root : patientForm, {
    variables: { ...searchBy ? {} : {"reference" : { form: form }}, "where": { primary_keys :  searchBy ? primaryKeys : identifier } },
    fetchPolicy: "network-only",
  });

  // if (loading || data.submitters.length === 0) return (<></>);
  // if (error) return `Somthing has occured... ${error}`

  if (loading ) {
    return (
    <>
    <Segment loading style={{height: '100%'}}>
      <Image src={logo} centered size='medium' />
    </Segment>
    </>
  )
  }

  console.log(data)
  if (data.submitters.length === 0) return (<></>);


  if (error) {
    return (
  <>
  <Message warning>
  <Message.Header>Something went wrong</Message.Header>
    <p>Restart the page, then try again.</p>
  </Message>
  </> 
  )
  }

  const sortHeadersForTableTool = (form) => {
    let reference = form.reference_foreign_key.reduce(
      (accumulatedFields, currentField) => ({...accumulatedFields, ...currentField.primary_keys}), {}
      )
    
    return [...Object.keys(form.primary_keys), ...Object.keys(reference), ...form.fields.map(fld => fld.key)]
  }

  const sortFormFieldsDataForTableTool = (form) => {
    let keyValueSortedObject = form.fields.reduce(
        (accumulatedFields, currentField) => ({...accumulatedFields, [currentField.key] : currentField.value }), {})

    
    let referencesOfOtherFormPrimaryKeysUsedWithinTheCurrentForm =  form.reference_foreign_key.reduce(
      (accumulatedFields, currentField) => ({...accumulatedFields, ...currentField.primary_keys}), {}
      )
    
    return { values : keyValueSortedObject, references :  referencesOfOtherFormPrimaryKeysUsedWithinTheCurrentForm, primaryFormIdentifier : form.primary_keys}
  }

  const onClickRow = (fields, keys) => {
    // change the global state form
    updateGlobalFormState(fields)
    // change Unique Ids within the Form State
    updateUniqueIdsFormState(keys)

  }


console.log(data)

  return (
    <>
    {(searchBy === false && data.submitters[0].reference_primary_key !== undefined && data.submitters[0].reference_primary_key.length > 0 ) &&
        <Table fixed selectable aria-labelledby="header">
        <Table.Header>
          <Table.Row>
              {sortHeadersForTableTool(data.submitters[0].reference_primary_key[0]).map((p) => {
                    return <Table.HeaderCell>{ keyToLabel(p) }</Table.HeaderCell>;
                })}
          </Table.Row>
        </Table.Header>
        

        <Table.Body>
              {data.submitters[0].reference_primary_key.map((form) => {
                let {values , references, primaryFormIdentifier} = sortFormFieldsDataForTableTool(form)
                let sortedFields = {...primaryFormIdentifier, ...references, ...values}
                return (
                  <Table.Row onClick={() => {
                      onClickRow(values, {...primaryFormIdentifier, ...references})
                  }}>
                    {sortHeadersForTableTool(data.submitters[0].reference_primary_key[0]).map((fld) => {
                      return <Table.Cell>{sortedFields[fld]}</Table.Cell>;
                    })}
                  </Table.Row>
                );
              })}       
        </Table.Body>
      </Table>
    }

    {searchBy === true  &&
    <Table fixed selectable aria-labelledby="header">
      <Table.Header>
        <Table.Row>
            {sortHeadersForTableTool(data.submitters[0]).map((p) => {
                      return <Table.HeaderCell>{keyToLabel(p)}</Table.HeaderCell>;
                })}
        </Table.Row>
      </Table.Header>
      

      <Table.Body>
            {data.submitters.map((p) => {
              let {values , references, primaryFormIdentifier} = sortFormFieldsDataForTableTool(p)
              let sortedFields = {...primaryFormIdentifier, ...references, ...values}
              return (
                <Table.Row onClick={() => {
                  onClickRow(values, {...primaryFormIdentifier, ...references})
                }}>
                  {sortHeadersForTableTool(data.submitters[0]).map((fld) => {
                    return <Table.Cell>{sortedFields[fld]}</Table.Cell>;
                  })}
                </Table.Row>
              );
            })}
      </Table.Body>
    </Table>
    }
    </>
  );
};
