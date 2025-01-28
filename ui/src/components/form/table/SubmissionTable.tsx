import React, { useEffect, useState } from "react";
import { LoadingSegment } from "../../common/LoadingSegment";
import {
  Divider,
  Header,
  Table,
  Icon,
  List,
  Button,
  Accordion,
} from "semantic-ui-react";
import { gql, useMutation, useQuery } from "@apollo/client";
import * as R from 'remeda';

import { toTitle, toDateString } from "../../utils";
import { DeleteSubmission } from "../dynamic_form/queries/form";
import { BasicErrorMessage } from "../../common/BasicErrorMessage";
import { useSubmissions } from "../../../hooks/useSubmissions";
import { useFormOperations } from "../../layout/context/FormOperationsProvider";
import { useLabelsContext } from "../../layout/context/LabelsProvider";
import { usePatientID } from "../../layout/context/PatientIDProvider";
import { useUpdateActiveSubmission } from "../../layout/context/ActiveSubmissionProvider";
import { usePatientIDLabels } from "../../../hooks/useLabels";

export function SubmissionTable({
  formID,
  submissionUpdates,
  modalOperations
} : any) {
  const [active, setActive] = React.useState(true);
  const { loading, error, data, refetch } = useSubmissions(formID);

  useEffect(() => {
    refetch()
  }, [submissionUpdates])

  if (loading) {
    return <LoadingSegment />;
  }

  if (error) {
    return <BasicErrorMessage />;
  }

  if (data.submissions.length === 0) return <></>;

  return (
    <>
      <Divider hidden />
      <Accordion>
        <Accordion.Title active={active} onClick={() => setActive(!active)}>
          <Icon name="dropdown" />
          <Divider horizontal style={{ display: "inline-block" }}>
            <Header as="h4">
              <Icon name="send" />
              SUBMISSIONS
            </Header>
          </Divider>
        </Accordion.Title>
        <Accordion.Content active={active}>
          <SubmissionTableContents
            submissions={data.submissions}
            refetch={refetch}
            modalOperations={modalOperations}
          />
        </Accordion.Content>
      </Accordion>
    </>
  );
}

const SubmissionTableContents = ({
  submissions,
  refetch,
  modalOperations
}: any) => {
  // storage for the table's contents
  let rows: any[] = [];

  const headers: any = {}
  const labels = useLabelsContext()
  const { study } = usePatientID()
  const { data: patientIDLabels } = usePatientIDLabels()
  const setActiveSubmission = useUpdateActiveSubmission();
  const { updateSubmissionDate, clearForm, fillForm } = useFormOperations()
  const [deleteSubmission] = useMutation(DeleteSubmission);
  const { setModalTitle, setModalContent, setModalError, setOpenModal } = modalOperations
  const { data } = useQuery(gql`
    query {
      isAdmin
    }
  `);
  const [sortingColumn, setSortingColumn] = useState<string>('')
  const [sortingDirection, setSortingDirection] = useState<'ascending'|'descending'|undefined>(undefined)

  if (!(updateSubmissionDate && clearForm && fillForm)) {
    return <></>
  }

  const doDelete = (submissionID: string) => {
    deleteSubmission({
      variables: {
        where: {
          submission_id: submissionID,
        },
      },
      onCompleted: () => {
        refetch();
        console.log("Submission deleted");
        updateSubmissionDate();
        setModalTitle("Success");
        setModalContent("The submission was deleted.");
        setModalError(false);
        setOpenModal(true);
      },
      onError: () => {
        console.log("Submission not deleted");
        setModalTitle("Error");
        setModalContent(
          "There was an error while deleting the submission, please try again."
        );
        setModalError(true);
        setOpenModal(true);
      },
    });
  };

  function sortHeaders(unsortedHeaders: { [key: string]: any }) {
    const { submitter_donor_id, program_id, ...other } = unsortedHeaders

    const sortedObject = {
      submitter_donor_id,
      program_id,
      ...other
    }

    return sortedObject
  }

  function getValueForSorting(rowData: {[key: string]: string}, columnName: string) {
    if (rowData[columnName].startsWith('{')) {
      try {
        const data = JSON.parse(rowData[columnName])
        return data.hasOwnProperty('value') ? data['value'] : data
      } catch (_error){
        return rowData[columnName]
      }
    }
    return rowData[columnName]
  }

  const excluded_headers = ['id', 'patient_id', 'study']
  const mostCompleteSubmission = submissions.sort((a: any, b:any) => b.fields.length - a.fields.length)[0]
  Object.keys(patientIDLabels).forEach((key: string) => {
      headers[key] = labels[key] ?? toTitle(key, "_")
    })
  mostCompleteSubmission.fields.forEach((field: {key: string, value: string}) => {
    if (!(field.key.startsWith('comments') || excluded_headers.includes(field.key))) {
      headers[field.key] = labels[field.key] ?? toTitle(field.key, '_')
    }
  })

  const sortedHeaders = sortHeaders(headers)

  // fill the table's row data from the submission data
  submissions.forEach((submission: any) => {
    const row: any = {};
    row.id = submission.submission_id;
    Object.keys(submission.patient)
      .filter((key) => key !== "__typename")
      .forEach((key) => {
        row[key] = submission.patient[key];
      });
    submission.fields
      .filter((field: any) => field.key !== "__typename")
      .forEach((field: any) => {
        row[field["key"]] = field["value"];
      });
    rows.push(row);
  });

  const sortedRows = sortingColumn ? R.sortBy(rows, [row => getValueForSorting(row, sortingColumn), sortingDirection === 'ascending' ? "asc" : "desc"]) : rows

  // regex to determine a date in the YYYY-MM-DD format
  // It will also match anything after the YYYY-MM-DD match,
  // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date
  const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m;

  return data ? (
    <div style={{ overflowX: "auto", maxHeight: "500px", resize: "vertical" }}>
      <Table
        fixed
        selectable
        aria-labelledby="header"
        striped
        key={rows.length}
        sortable
      >
        <Table.Header>
          <Table.Row>
            {Object.values(sortedHeaders).map((header: any) => {
              const label: string = typeof header === 'object' ? header[study] ?? header.default : header
              return (
                <Table.HeaderCell 
                  key={label} 
                  sorted={ sortingColumn === label ? sortingDirection : undefined }
                  onClick={() => {
                    setSortingColumn(label.toLowerCase().replaceAll(' ', '_'))
                    setSortingDirection((prev) => prev === 'ascending' ? 'descending' : 'ascending')
                  }}
                >
                  {toTitle(label)}
                </Table.HeaderCell>
              );
            })}
            {data.isAdmin ? (
              <Table.HeaderCell key="delete">Delete</Table.HeaderCell>
            ) : (
              <></>
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sortedRows.map((row: any, index) => {
            return (
              <Table.Row
                key={`${row.id}-${index}`}
                onClick={() => {
                  const { id, ...filteredRow } = row
                  setActiveSubmission(
                    submissions.find((submission: any) => submission.submission_id === id)
                  );
                  fillForm(filteredRow);
                }}
              >
                {Object.keys(sortedHeaders).map((key) => {
                  let value = row.hasOwnProperty(key) ? row[key] : "";

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
                    <Table.Cell key={`${row.id}-${key}-${value}`}>
                      {value}
                    </Table.Cell>
                  );
                })}
                {data.isAdmin ? (
                  <Table.Cell key={`delete-${row.id}`}>
                    <Button
                      icon="trash"
                      color="red"
                      onClick={() => doDelete(row.id)}
                    />
                  </Table.Cell>
                ) : (
                  <></>
                )}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  ) : (
    <></>
  );
};
