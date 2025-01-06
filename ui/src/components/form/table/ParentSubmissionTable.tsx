import React, {  useEffect } from "react";
import { LoadingSegment } from "../../common/LoadingSegment";
import {
  Divider,
  Header,
  Table,
  Icon,
  List,
  Accordion,
} from "semantic-ui-react";
import { useQuery } from "@apollo/client";

import { toDateString } from "../../utils";
import {
  FindSubmissions,
  ParentForm,
  FieldData
} from "../dynamic_form/queries/form";
import { BasicErrorMessage } from "../../common/BasicErrorMessage";

import { usePatientIDLabels, useStudyLabels } from "../../../hooks/useLabels";
import { useActiveSubmission, useUpdateActiveSubmission } from "../../layout/context/ActiveSubmissionProvider";
import { usePatientID } from "../../layout/context/PatientIDProvider";

export function ParentSubmissionTable({
  formID,
}: Readonly<{ formID: string }>) {
  const [active, setActive] = React.useState(true);
  const activeSubmission = useActiveSubmission()
  const setActiveSubmission = useUpdateActiveSubmission()
  const patientID = usePatientID();
  const labels = useStudyLabels()
  const { data: patientIDLabels } = usePatientIDLabels()

  const {
    loading: parentLoading,
    error: parentError,
    data: parentForm,
  } = useQuery(ParentForm, {
    variables: {
      id: formID,
    },
  });

  const {
    loading: fieldsLoading,
    error: fieldsError,
    data: fields,
    refetch: refetchFields,
  } = useQuery(FieldData, {
    variables: {
      id: parentForm?.ParentForm?.formID,
      study: patientID.study,
    },
    skip: !parentForm?.parentForm,
  });

  const submissionSearchInfo = parentForm?.ParentForm
    ? {
        form_id: parentForm.ParentForm.formID,
        patient: {
          patient_id: patientID.submitter_donor_id,
          program_id: patientID.program_id,
          study: patientID.study,
        },
      }
    : {};

  const {
    loading: submissionsLoading,
    error: submissionsError,
    data: submissionsInfo,
    refetch: refetchSubmissions,
  } = useQuery(FindSubmissions, {
    variables: {
      where: submissionSearchInfo,
    },
    skip: !parentForm?.ParentForm,
  });

  useEffect(() => {
    if (parentForm?.ParentForm && !fieldsLoading) {
      refetchFields();
    }
    if (parentForm?.ParentForm && !submissionsLoading) {
      refetchSubmissions();
    }
  }, [
    parentForm,
    fieldsLoading,
    submissionsLoading,
    refetchFields,
    refetchSubmissions,
  ]);

  if (parentLoading || submissionsLoading || fieldsLoading) {
    return <LoadingSegment />;
  }

  if (parentError || submissionsError || fieldsError) {
    return <BasicErrorMessage />;
  }

  if (!parentForm || !fields || submissionsInfo.submissions.length === 0)
    return <></>;

  // regex to determine a date in the YYYY-MM-DD format
  // It will also match anything after the YYYY-MM-DD match,
  // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date
  const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m;

  // set names for the fields as table headers
  // const excludedHeaders = ["__typename", "patient_id", "study"]; // prevent these fields from showing on the table
  const headers: any = {};
  Object.keys(patientIDLabels).forEach((key: string) => {
    headers[key] = labels[key]
  })
  submissionsInfo.submissions[0].fields.forEach((field: {key: string, value: string}) => {
    headers[field.key] = labels[field.key]
  })

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
            <Table fixed selectable aria-labelledby="header" striped>
              <Table.Header>
                <Table.Row>
                  {Object.values(headers).map((header: any) => {
                    return (
                      <Table.HeaderCell key={header}>{header}</Table.HeaderCell>
                    );
                  })}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {submissionsInfo.submissions.map((submission: any) => {
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
