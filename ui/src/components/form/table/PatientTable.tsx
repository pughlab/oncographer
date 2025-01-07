import React, { useEffect } from "react";
import {
  Accordion,
  Divider,
  Header,
  Icon,
  List,
  Table,
} from "semantic-ui-react";

import { toTitle, toDateString } from "../../utils";
import { LoadingSegment } from "../../common/LoadingSegment";
import { BasicErrorMessage } from "../../common/BasicErrorMessage";
import { defaultStudy } from "../../../App";
import { usePatientID } from "../../layout/context/PatientIDProvider";
import { useRootFormSubmissions } from "../../../hooks/useSubmissions";
import { usePatientIDLabels, useStudyLabels } from "../../../hooks/useLabels";
import { PatientID } from "../dynamic_form/types";

export function PatientTable() {
  const labels = useStudyLabels()
  const rootLabels: { [key: string]: any } = {} 
  const [active, setActive] = React.useState(true);
  const patientID: PatientID = usePatientID();
  const { data: patientIDLabels } = usePatientIDLabels()
  const { loading, error, data: submissions, refetch } = useRootFormSubmissions()

  useEffect(() => {
    refetch()
  }, [patientID])

  useEffect(() => {
    submissions[0]?.fields.forEach((field: {key: string, value: string}) => {
      rootLabels[field.key] = labels[field.key] ?? toTitle(field.key, "_")
    })
  }, [submissions])

  function sortHeaders(unsortedHeaders: { [key: string]: any }) {
    const { submitter_donor_id, program_id, ...other } = unsortedHeaders

    const sortedObject = {
      submitter_donor_id,
      program_id,
      ...other
    }

    return sortedObject
  }

  if (loading) return <LoadingSegment />;

  if (error) return <BasicErrorMessage />;

  if (submissions.length === 0)
    return <></>;

  const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m;
  const headers: any = {};
  const excluded_headers = ['patient_id', 'study']
  Object.keys(patientIDLabels).forEach((key: string) => {
    headers[key] = labels[key] ?? toTitle(key, "_")
  })
  submissions[0].fields.forEach((field: {key: string, value: string}) => {
    if (!(field.key.startsWith('comments') || excluded_headers.includes(field.key))) {
      headers[field.key] = labels[field.key] ?? toTitle(field.key, "_")
    }
  })

  const sortedHeaders = sortHeaders(headers)

  return (
    <Accordion>
      <Accordion.Title active={active} onClick={() => setActive(!active)}>
        <Icon name="dropdown" />
        <Divider horizontal style={{ display: "inline-block" }}>
          <Header as="h4">
            <Icon name="user circle" />
            {patientID.study.toLowerCase() === defaultStudy
              ? "DONOR"
              : "PARTICIPANT"}
            {" "}
            INFORMATION
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
          <Table fixed selectable aria-labelledby="header" striped>
            <Table.Header>
              <Table.Row>
                {Object.values(sortedHeaders).map((header: any) => (
                  <Table.HeaderCell key={header}>
                    {String(header).includes("_")
                      ? toTitle(header, "_")
                      : toTitle(header)}
                  </Table.HeaderCell>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {submissions.map((submission: any) => {
                const row: any = {};
                submission.fields.forEach((field: any) => {
                  row[field["key"]] = field["value"];
                });
                Object.keys(submission.patient).forEach((key) => {
                  row[key] = submission.patient[key];
                });
                return (
                  <Table.Row key={submission.submission_id}>
                    {Object.keys(sortedHeaders).map((field) => {
                      let value = row.hasOwnProperty(field) ? row[field] : "";
                      const isDate =
                        (value.resolution && re.test(value.value)) ??
                        re.test(value);

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
  );
}
