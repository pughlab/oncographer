import React, { useEffect, useState } from "react";
import { Icon, Form, Segment, Divider, Header } from "semantic-ui-react";
import { useLazyQuery } from "@apollo/client";

import { FindPatients } from "../form/queries/query";

import keycloak from "../../keycloak/keycloak";
import { defaultStudy } from "../../App";
import { useUpdatePatientID } from "../layout/context/PatientIDProvider"
import useDebounce from "../../hooks/useDebounce";

let studies: { key: string; text: string; value: string }[] = [
  { key: "", text: "Please select a study", value: "" },
];

const PatientSearchForm = () => {
  const adminRoles = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES ?? "[]");

  // each field in the form manages their own state
  const [submitterDonorId, setSubmitterDonorId] = useState("");
  const [programId, setProgramId] = useState("");
  const [study, setStudy] = useState("");

  // debounce the donor ID and program ID to avoid making too many queries to the DB
  const debouncedSubmitterDonorId = useDebounce(submitterDonorId, 500);
  const debouncedProgramId = useDebounce(programId, 500);

  const setPatientID = useUpdatePatientID();
  const [findPatient] = useLazyQuery(FindPatients, {
    variables: {
      where: {
        patient_id: debouncedSubmitterDonorId,
        program_id: debouncedProgramId,
        study: study,
      },
    },
    onCompleted: (data) => {
      if (data.patients.length > 0) {
        const { patient_id, program_id, study } = data.patients[0];
        setPatientID({
          submitter_donor_id: patient_id,
          program_id,
          study,
        });
      } else {
        setPatientID({ submitter_donor_id: debouncedSubmitterDonorId, program_id: debouncedProgramId, study });
      }
    },
  });

  function mustFindPatient() {
    return [debouncedSubmitterDonorId, debouncedProgramId, study].reduce(
      (acc, value) => acc && value.trim() !== "",
      true
    );
  }

  // ignore the Enter key
  function handleKeyDown(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
    }
  }

  useEffect(() => {
    const roles =
      keycloak?.tokenParsed?.resource_access?.[
        process.env.KEYCLOAK_SERVER_CLIENT ?? ""
      ]?.roles || [];
    if (roles?.length > 0) {
      roles
        .filter((role) => !adminRoles.includes(role))
        .forEach((role: string) => {
          studies.push({ key: role, text: role.toUpperCase(), value: role });
        });
    }
  }, []); // fill out the study select with permitted roles

  useEffect(() => {
    setSubmitterDonorId("");
    setProgramId("");
    setPatientID({
      submitter_donor_id: "",
      program_id: "",
      study,
    });
  }, [study]); // reset the donor ID, program ID and composite patient ID when study changes

  useEffect(() => {
    if (mustFindPatient()) {
      findPatient();
    }
  }, [debouncedSubmitterDonorId, debouncedProgramId, study]); // find patients if all fields have been filled

  return (
    <Segment color="teal">
      <Divider horizontal>
        <Header as="h4">
          <Icon name="search" />
          SEARCH
        </Header>
      </Divider>
      <Form size="large">
        <Form.Group widths={"equal"}>
          <Form.Select
            width={4}
            options={studies}
            placeholder={"Study"}
            value={study}
            onChange={(_e, { value }) => {
              setStudy(value as string);
            }}
          />
          <Form.Input
            width={4}
            value={submitterDonorId}
            icon="id card outline"
            iconPosition="left"
            type="text"
            placeholder={
              study !== defaultStudy && study.trim() !== ""
                ? "Submitter Participant ID"
                : "Submitter Donor ID"
            }
            onChange={(e) => {
              setSubmitterDonorId(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          <Form.Input
            width={4}
            value={programId}
            icon="id card outline"
            iconPosition="left"
            type="text"
            placeholder="Program ID"
            onChange={(e) => {
              setProgramId(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          <Form.Button
            size="large"
            onClick={() => {
              setSubmitterDonorId("");
              setProgramId("");
              setStudy("");
              setPatientID({
                submitter_donor_id: "",
                program_id: "",
                study: "",
              });
            }}
            fluid
            inverted
            icon="trash"
            color="red"
            content="CLEAR SEARCH"
            width={2}
          />
        </Form.Group>
      </Form>
    </Segment>
  );
};

export default PatientSearchForm;
