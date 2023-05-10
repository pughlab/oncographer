import { List, Table } from "semantic-ui-react";
import { toTitle } from "./utils";
import * as React from "react";

function TableContents({ headers, forms, sortFields, onRowClicked }) {
  return (
    <>
      <Table.Header style={{ position: "sticky", top: 0, background: 0.0, opacity: 1 }}>
        <Table.Row >
          {headers.map((p: String) => {
            return <Table.HeaderCell key={p}>{toTitle(p, '_')}</Table.HeaderCell>;
          })}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {forms.map((form) => {
          let { values, references, primaryFormIdentifier } =
            sortFields(form);
          let sortedFields = {
            ...primaryFormIdentifier,
            ...references,
            ...values,
          };
          return (
            <Table.Row
              key={form}
              onClick={() => {
                onRowClicked(values, {
                  ...primaryFormIdentifier,
                  ...references,
                });
              }}
            >
              {headers.map((header) => {
                let cell = sortedFields[header];
                const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m

                if (re.test(sortedFields[header])) {
                  cell = new Date(cell);
                  cell = `${cell.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}`;
                } else if (Array.isArray(cell)){
                  cell = <List>{cell.map((value) => <List.Item key={value}>{value}</List.Item>)}</List>
                }
                return <Table.Cell key={sortedFields[header]}>{cell}</Table.Cell>;
              })}
            </Table.Row>
          );
        })}
      </Table.Body>
    </>
  )
}

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

    return [
      ...Object.keys(ids),
      ...form.fields.map((field) => field.key),
    ];
  };

  const onTableToolRowClicked = (fields, keys) => {
    // regular expression to collect the dates and convert them to Date object
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m
    // check if any of the fields is Date parsable
    // if so change it to a Date Object
    // Reason is react-Datepicker only takes null or a Date Object
    
    // TODO if the condition is not met need to fill the defaults of the given field 
    
    Object.keys(fields).forEach((key) => {
      // TODO: improve filter to find the dates fields
      // check if the value can Date parse, not a Integer/Float/Number and meets the regular expression
      if (re.test(fields[key])) {
        fields[key] = new Date(fields[key]);
      }
    });
    
    sortedHeaders.forEach((header) =>{
      if (Object.keys(ids).includes(header) && !Object.keys(keys).includes(header)){
        keys[header] = ""
      }
    })

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
  let bigTable = sortedHeaders.length > 10
  return (
    <Table fixed selectable aria-labelledby="header" striped>
    {
      bigTable ?
        <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>
          <TableContents 
            forms={typeofdisplay}
            headers={sortedHeaders}
            onRowClicked={onTableToolRowClicked}
            sortFields={sortFormFieldsDataForTableTool}
          />
        </div>
      : 
        <TableContents 
          forms={typeofdisplay}
          headers={sortedHeaders}
          onRowClicked={onTableToolRowClicked}
          sortFields={sortFormFieldsDataForTableTool}
        />
    }
    </Table>
  );
}
