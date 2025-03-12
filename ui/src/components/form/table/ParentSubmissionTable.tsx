import React from "react";
import { LoadingSegment } from "../../common/LoadingSegment";
import {
  Divider,
  Header,
  Table,
  Icon,
  List,
  Accordion,
} from "semantic-ui-react";
import * as R from 'remeda';

import { toDateString, toTitle } from "../../utils";
import { BasicErrorMessage } from "../../common/BasicErrorMessage";

import { usePatientIDLabels, useStudyLabels } from "../../../hooks/useLabels";
import { useActiveSubmission, useUpdateActiveSubmission } from "../../layout/context/ActiveSubmissionProvider";
import { useParentSubmissions } from "../../../hooks/useSubmissions";

export function ParentSubmissionTable({
  formID,
}: Readonly<{ formID: string }>) {
  const [active, setActive] = React.useState(true);
  const activeSubmission = useActiveSubmission()
  const setActiveSubmission = useUpdateActiveSubmission()
  const labels = useStudyLabels()
  const { data: patientIDLabels } = usePatientIDLabels()
  const { loading, error, data: parentSubmissions } = useParentSubmissions(formID)
  const [sortingColumn, setSortingColumn] = React.useState<string>('')
    const [sortingDirection, setSortingDirection] = React.useState<'ascending'|'descending'|undefined>(undefined)

  if (loading) {
    return <LoadingSegment />;
  }

  if (error) {
    return <BasicErrorMessage />;
  }

  if (parentSubmissions.length === 0) {
    return <></>;
  }

  function sortHeaders(unsortedHeaders: { [key: string]: any }) {
    const { submitter_donor_id, program_id, ...other } = unsortedHeaders

    const sortedObject = {
      submitter_donor_id,
      program_id,
      ...other
    }

    return sortedObject
  }

  function getValueForSorting(rowData: { fields: { key: string, value: string }[] }, columnName: string) {
    const row: any = rowData.fields.reduce((acc, field) => ({ ...acc, [field.key]: field.value }), {})
    if (row[columnName].startsWith('{')) {
      try {
        const data = JSON.parse(row[columnName])
        return data.hasOwnProperty('value') ? data['value'] : data
      } catch (_error){
        return row[columnName]
      }
    }
    return row[columnName]
  }

  // regex to determine a date in the YYYY-MM-DD format
  // It will also match anything after the YYYY-MM-DD match,
  // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date
  const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m;

  // set names for the fields as table headers
  const excludedHeaders = ["id", "patient_id", "study"]; // prevent these fields from showing on the table
  const mostCompleteSubmission = [...parentSubmissions].sort((a: any, b:any) => b.fields.length - a.fields.length)[0]
  const headers: any = {};
  Object.keys(patientIDLabels).forEach((key: string) => {
    headers[key] = labels[key] ?? toTitle(key, "_")
  })
  mostCompleteSubmission.fields.forEach((field: {key: string, value: string}) => {
    if (!(field.key.startsWith('comments') || excludedHeaders.includes(field.key))) {
      headers[field.key] = labels[field.key] ?? toTitle(field.key, "_")
    }
  })

  const sortedHeaders = sortHeaders(headers)
  const sortedSubmissions = sortingColumn ? R.sortBy(parentSubmissions, [(submission: any) => getValueForSorting(submission, sortingColumn), sortingDirection === 'ascending' ? "asc" : "desc"]) : parentSubmissions

  return (
    <>
      <Divider hidden />
      <Accordion>
        <Accordion.Title active={active} onClick={() => setActive(!active)}>
          <Icon name="dropdown" />
          <Divider horizontal style={{ display: "inline-block" }}>
            <Header as="h4">
              <Icon name="folder open" />
              PARENT SUBMISSIONS
            </Header>
          </Divider>
        </Accordion.Title>
        <Accordion.Content active={active}>
          <div
            style={{
              overflowX: "auto",
              maxHeight: "500px",
              resize: "vertical",
            }}
          >
            <Table fixed selectable aria-labelledby="header" striped sortable>
              <Table.Header>
                <Table.Row>
                  {Object.values(sortedHeaders).map((header: any) => {
                    return (
                      <Table.HeaderCell
                        key={header}
                        sorted={ sortingColumn === header ? sortingDirection : undefined }
                        onClick={() => {
                          setSortingColumn(header.toLowerCase().replaceAll(' ', '_'))
                          setSortingDirection((prev) => prev === 'ascending' ? 'descending' : 'ascending')
                        }}
                      >
                          {header}
                        </Table.HeaderCell>
                    );
                  })}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sortedSubmissions.map((submission: any) => {
                  const row: any = {};
                  const isActive: boolean = activeSubmission === submission;
                  submission.fields.forEach((field: any) => {
                    row[field["key"]] = field["value"];
                  });
                  Object.keys(submission.patient).forEach((key) => {
                    row[key] = submission.patient[key];
                  });
                  return (
                    <Table.Row
                      key={submission.submission_id}
                      onClick={() => {
                        setActiveSubmission(submission);
                      }}
                      active={isActive}
                    >
                      {Object.keys(headers).map((field) => {
                        let value = row.hasOwnProperty(field) ? row[field] : "";

                        const isDate = re.test(value);

                        if (isDate) {
                          value = toDateString(value);
                        } else if (Array.isArray(value)) {
                          value = (
                            <List>
                              {value.map((item) => (
                                <List.Item key={item}>{item}</List.Item>
                              ))}
                            </List>
                          );
                        }

                        return (
                          <Table.Cell
                            key={`${submission.submission_id}-${field}-${value}`}
                          >
                            {value}
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        </Accordion.Content>
      </Accordion>
    </>
  );
}
