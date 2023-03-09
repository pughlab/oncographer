import { Table } from "semantic-ui-react";
import { keyToLabel } from "./utils";
import * as React from "react";

export default function TableToolDisplay({
  metadata,
  ids,
  updateGlobalFormState,
  updateUniqueIdsFormState,
}) {
  if (metadata === undefined) return <></>;

  const sortFormFieldsDataForTableTool = (form) => {
    let keyValueSortedObject = form.fields.reduce(
      (accumulatedFields, currentField) => {
        return { ...accumulatedFields, [currentField.key]: currentField.value };
      },
      {}
    );

    let referencesOfOtherFormPrimaryKeysUsedWithinCurrentForm =
      form.formReferenceKeys.reduce(
        (accumulatedFields, currentField) => ({
          ...accumulatedFields,
          ...currentField.formPrimaryIdentifierKeys,
        }),
        {}
      );

    return {
      values: keyValueSortedObject,
      references: referencesOfOtherFormPrimaryKeysUsedWithinCurrentForm,
      primaryFormIdentifier: form.formPrimaryIdentifierKeys,
    };
  };

  const sortHeadersForTableTool = (ids, form) => {

    console.log(form.fields.map((fld) => fld.key))
    return [
      ...Object.keys(ids),
      ...form.fields.map((fld) => fld.key),
    ];
  };

  const onTableToolRowClicked = (fields, keys) => {
    // regular expression to collect the dates and convert them to Date object
    const re = /\d{4}-\d{2}-\d{2}/g; // FIX ME: Make more specific to YYYY-MM-DD
    const keysOfObject = Object.keys(keys)
    // check if any of the fields is Date parsable
    // if so change it to a Date Object
    // Reason is react-Datepicker only takes null or a Date Object
    
    // TODO if the condition is not met need to fill the defaults of the given field 
    
    Object.keys(fields).forEach((key) => {
      // TODO: improve filter to find the dates fields
      // check if the value can Date parse, not a Integer/Float/Number and meets the regular expression
      if (re.exec(fields[key]) !== null) {
        fields[key] = new Date(fields[key]);
      }
    });
    
    sortedHeaders.forEach((header) =>{
      if (Object.keys(ids).includes(header) && !keysOfObject.includes(header)){
        keys[header] = ""
      }
    })

    console.log(keys, fields)
    // change the global state form
    updateGlobalFormState(fields);
    // change Unique Ids within the Form State
    updateUniqueIdsFormState((prev) => ({...prev, ...keys}));
  };

  const typeofdisplay = "connectedFormsReferencingSubmitter" in metadata[0]
      ? metadata[0].connectedFormsReferencingSubmitter
      : metadata;

  if (!typeofdisplay.length) return <></>;
  
  const sortedHeaders = sortHeadersForTableTool(ids, typeofdisplay[0]);
  let tableSize = sortedHeaders.length > 10
  return (
    <>
    {
      tableSize ? 
      <div style={{overflowX: 'auto', maxHeight: '500px'}}>
      <Table fixed selectable aria-labelledby="header" striped>

        <Table.Header  style={{ position: "sticky", top: 0, background: 0.0, opacity: 1 }}>
          <Table.Row >
            {sortedHeaders.map((p) => {
              return <Table.HeaderCell key={p}>{keyToLabel(p)}</Table.HeaderCell>;
            })}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {typeofdisplay.map((form) => {
            let { values, references, primaryFormIdentifier } =
              sortFormFieldsDataForTableTool(form);
            let sortedFields = {
              ...primaryFormIdentifier,
              ...references,
              ...values,
            };
            return (
              <Table.Row
                key={form}
                onClick={() => {
                  onTableToolRowClicked(values, {
                    ...primaryFormIdentifier,
                    ...references,
                  });
                }}
              >
                {sortedHeaders.map((fld) => {
                  let cell = sortedFields[fld];
                  const re = /\d{4}-\d{2}-\d{2}/g; // FIX ME: Make more specific to YYYY-MM-DD

                  if (re.exec(sortedFields[fld])) {
                    cell = new Date(cell);
                    cell = `${cell.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}`;
                  }
                  return <Table.Cell key={sortedFields[fld]}>{cell}</Table.Cell>;
                })}
              </Table.Row>
            );
          })}
        </Table.Body>

        </Table>
      </div>
      : 
        <Table fixed selectable aria-labelledby="header" striped>
          <Table.Header >
            <Table.Row >
              {sortedHeaders.map((p) => {
                return <Table.HeaderCell key={p}>{keyToLabel(p)}</Table.HeaderCell>;
              })}
            </Table.Row>
          </Table.Header>
  
          <Table.Body>
            {typeofdisplay.map((form) => {
              let { values, references, primaryFormIdentifier } =
                sortFormFieldsDataForTableTool(form);
              let sortedFields = {
                ...primaryFormIdentifier,
                ...references,
                ...values,
              };
              return (
                <Table.Row
                  key={form}
                  onClick={() => {
                    onTableToolRowClicked(values, {
                      ...primaryFormIdentifier,
                      ...references,
                    });
                  }}
                >
                  {sortedHeaders.map((fld) => {
                    let cell = sortedFields[fld];
                    const re = /\d{4}-\d{2}-\d{2}/g; // FIX ME: Make more specific to YYYY-MM-DD
  
                    if (re.exec(sortedFields[fld])) {
                      cell = new Date(cell);
                      cell = `${cell.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}`;
                    }
                    return <Table.Cell key={sortedFields[fld]}>{cell}</Table.Cell>;
                  })}
                </Table.Row>
              );
            })}
          </Table.Body>  
        </Table>
        }
    </>
  );
}
