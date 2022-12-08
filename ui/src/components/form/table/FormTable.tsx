import { Table, Segment, Image, Message } from "semantic-ui-react";
import { useQuery, gql } from "@apollo/client";
import React from "react"
import logo from '../../logos/logo.png'

const getCurrentFormAssociatedToIdentifier  = gql`
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

const getRootOfFormDirectedGraphFormFields = gql`
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
  searchForRootForm,
  globalIdentifierKeys,
  formPrimaryIdentifierKeys,
  updateUniqueIdsFormState,
  updateGlobalFormState,
}) => {


  const { loading, data, error } = useQuery(searchForRootForm ? getRootOfFormDirectedGraphFormFields : getCurrentFormAssociatedToIdentifier, {
    variables: { ...searchForRootForm ? {} : {"reference" : { form: form }}, "where": { primary_keys :  searchForRootForm ? formPrimaryIdentifierKeys : globalIdentifierKeys } },
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
    <>
    <Segment loading style={{height: '100%'}}>
      <Image src={logo} centered size='medium' />
    </Segment>
    </>
  )
  }

  // checks if the query shows up empty if so do not return anythng
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

    
    let referencesOfOtherFormPrimaryKeysUsedWithinCurrentForm =  form.reference_foreign_key.reduce(
      (accumulatedFields, currentField) => ({...accumulatedFields, ...currentField.primary_keys}), {}
      )
    
    return { values : keyValueSortedObject, references :  referencesOfOtherFormPrimaryKeysUsedWithinCurrentForm, primaryFormIdentifier : form.primary_keys}
  }

  const onTableToolRowClicked = (fields, keys) => {
    
    // regular expression to collect the dates and convert them to Date object
    const re = /\d{4}-\d{2}-\d{2}/g // FIX ME: Make more specific to YYYY-MM-DD

    // check if any of the fields is Date parsable 
    // if so change it to a Date Object
    // Reason is react-Datepicker only takes null or a Date Object
    Object.keys(fields).forEach((key)=>{
      // console.log(!isNaN(Date.parse(fields[key])) && isNaN(+fields[key]) && re.exec(fields[key]) !== null)
      // TODO: improve filter to find the dates fields
      // check if the value can Date parse, not a Integer/Float/Number and meets the regular expression
      if(re.exec(fields[key]) !== null){
        fields[key] = new Date(fields[key])
      }

    })

    // change the global state form
    updateGlobalFormState(fields)
    // change Unique Ids within the Form State
    updateUniqueIdsFormState(keys)

  }

  return (
    <>
    {(searchForRootForm === false && data.submitters[0].reference_primary_key !== undefined && data.submitters[0].reference_primary_key.length > 0 ) &&
        <Table fixed selectable aria-labelledby="header">
        <Table.Header>
          <Table.Row>
              {sortHeadersForTableTool(data.submitters[0].reference_primary_key[0]).map((p) => {
                    return <Table.HeaderCell>{ keyToLabel(p) }</Table.HeaderCell>;
                })}
          </Table.Row>
        </Table.Header>
        
        {/* FIX ME WHEN THE FIELD IS A DATE DISPLAY ONLY YYYY-MMM */}
        <Table.Body>
              {data.submitters[0].reference_primary_key.map((form) => {
                let {values , references, primaryFormIdentifier} = sortFormFieldsDataForTableTool(form)
                let sortedFields = {...primaryFormIdentifier, ...references, ...values}
                return (
                  <Table.Row onClick={() => {
                    onTableToolRowClicked(values, {...primaryFormIdentifier, ...references})
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

    {searchForRootForm === true  &&
    <Table fixed selectable aria-labelledby="header">
      <Table.Header>
        <Table.Row>
            {sortHeadersForTableTool(data.submitters[0]).map((p) => {
                      return <Table.HeaderCell>{keyToLabel(p)}</Table.HeaderCell>;
                })}
        </Table.Row>
      </Table.Header>
      

      {/* FIX ME WHEN THE FIELD IS A DATE DISPLAY ONLY YYYY-MMM */}
      <Table.Body>
            {data.submitters.map((p) => {
              let {values , references, primaryFormIdentifier} = sortFormFieldsDataForTableTool(p)
              let sortedFields = {...primaryFormIdentifier, ...references, ...values}
              return (
                <Table.Row onClick={() => {
                  onTableToolRowClicked(values, {...primaryFormIdentifier, ...references})
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
