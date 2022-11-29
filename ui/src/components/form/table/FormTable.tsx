import { Table } from "semantic-ui-react";
import { useQuery, gql } from "@apollo/client";
import React from "React"

const patientForm = gql`
query($where: SubmitterWhere, $reference: SubmitterWhere) {
  submitters(where: $where) {
    reference_primary_key(where: $reference) {
      form
      primary_keys
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
    primary_keys
    fields {
      key
      value
    }
  }
}`

const keyToLabel = (str) => str.split("_").map(val => { return val.charAt(0).toUpperCase() + val.substring(1); }).join(" ")

// **REFACTOR**
export const TableTool = ({
  form,
  searchBy,
  identifier,
}) => {
//  console.log( JSON.stringify({ ...!searchBy ? {} : {"reference" : { form: form }}, "where": { primary_keys : identifier } }))

  const { loading, data, error } = useQuery(!searchBy ? root : patientForm, {
    variables: { ...!searchBy ? {} : {"reference" : { form: form }}, "where": { primary_keys : identifier } },
    fetchPolicy: "network-only",
  });
  
  if (loading) return (<></>);
  if (error) return `Somthing has occured... ${error}`

  // console.log(data, searchBy !== 0, data.submitters[0].reference_primary_key !== undefined)
  return (
    <>
    {(searchBy !== 0 && data.submitters.length > 0 && data.submitters[0].reference_primary_key !== undefined && data.submitters[0].reference_primary_key.length > 0) &&
        <Table celled padded fixed selectable>
        <Table.Header>

          <Table.Row>
              {data.submitters[0].reference_primary_key[0].fields.map((p) => {
                    return <Table.HeaderCell>{ keyToLabel(p.key) }</Table.HeaderCell>;
                })}
          </Table.Row>
        </Table.Header>
        

        <Table.Body>
              {data.submitters[0].reference_primary_key.map((p) => {
                return (
                  <Table.Row>
                    {p.fields.map((fld) => {
                      return <Table.Cell>{fld.value}</Table.Cell>;
                    })}
                  </Table.Row>
                );
              })}       
        </Table.Body>
      </Table>
    }

    {(!searchBy && data.submitters.length > 0)  &&
    <Table celled padded fixed selectable>
      <Table.Header>
        <Table.Row>
            {data.submitters.map((p) => {
              return p.fields.map((fld) => {
                      return <Table.HeaderCell>{keyToLabel(fld.key)}</Table.HeaderCell>;
                })})}
        </Table.Row>
      </Table.Header>
      

      <Table.Body>

            {data.submitters.map((p) => {
              return (
                <Table.Row>
                  {p.fields.map((fld) => {
                    return <Table.Cell>{fld.value}</Table.Cell>;
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
