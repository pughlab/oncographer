import React, { useEffect, useState, useRef } from "react";
import { Icon, Form, Segment, Divider, Header, Input } from "semantic-ui-react";
import { useLazyQuery } from "@apollo/client";

import { FindPatients } from "../form/dynamic_form/queries/form"

import keycloak from "../../keycloak/keycloak";
import { defaultStudy } from "../../App";
import { useUpdatePatientID } from "../layout/context/PatientIDProvider"
import useDebounce from "../../hooks/useDebounce";
import ExportButton from "./ExportButton";

let studies: { key: string; text: string; value: string }[] = [
  { key: "", text: "Please select a study", value: "" },
];

function ignoreEnter(event: any) {
  if (event.keyCode === 13) {
    event.preventDefault();
  }
}

export function getAutofillDataFromStudy(study: string): { program: string; prefix: string } {
  const programs: { [key: string]: string } = {
    "charm": "CHARM-UHN",
    "charm-bc": "CHARM-BC",
    "charm-jhg": "CHARM-JHG",
    "charm-ab": "CHARM-AB",
    "charm-iwk": "CHARM-IWK",
    "charm-nl": "CHARM-NL",
    "charm-hsc": "CHARM-HSC",
  };
  const prefixes: { [key: string]: string } = {
    "charm": "CHM2-01",
    "charm-bc": "CHM2-02",
    "charm-jhg": "CHM2-03",
    "charm-ab": "CHM2-04",
    "charm-iwk": "CHM2-05",
    "charm-nl": "CHM2-06",
    "charm-hsc": "CHM2-07",
  };
  return {
    program: programs[study] || "",
    prefix: prefixes[study] || "",
  }
}

const PatientSearchForm = () => {
  const adminRoles = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES ?? "[]");

  // each field in the form manages their own state
  const [submitterDonorId, setSubmitterDonorId] = useState("");
  const [submitterDonorLabel, setSubmitterDonorLabel] = useState("");
  const [programId, setProgramId] = useState("");
  const [study, setStudy] = useState("");

  const patientIDRef = useRef<string>("");

  // debounce the donor ID and program ID to avoid making too many queries to the DB
  const debouncedSubmitterDonorId = useDebounce(patientIDRef.current, 500);
  const debouncedProgramId = useDebounce(programId, 500);

  const setPatientID = useUpdatePatientID();
  const [findPatient, { data: patients }] = useLazyQuery(FindPatients, {
    variables: {
      where: {
        patient_id: debouncedSubmitterDonorId,
        program_id: debouncedProgramId,
        study: study,
      },
    },
  });

  function mustFindPatient() {
    return [debouncedSubmitterDonorId, debouncedProgramId, study].reduce(
      (acc, value) => acc && value.trim() !== "",
      true
    );
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
    const { prefix } = getAutofillDataFromStudy(study);
    if (prefix) {
      patientIDRef.current = `${prefix}-${submitterDonorId}`;
    } else {
      patientIDRef.current = submitterDonorId;
    }
  }, [submitterDonorId])

  useEffect(() => {
    const { prefix, program } = getAutofillDataFromStudy(study);
    setSubmitterDonorId("");
    setSubmitterDonorLabel(prefix ? `${prefix}-` : "")
    setProgramId(program);
    setPatientID({
      submitter_donor_id: patientIDRef.current,
      program_id: program,
      study,
    });
  }, [study]); // autofill the donor ID, program ID, and composite patient ID when study changes

  useEffect(() => {
    if (mustFindPatient()) {
      findPatient();
    }
  }, [debouncedSubmitterDonorId, debouncedProgramId, study]); // find patients if all fields have been filled

  useEffect(() => {
    if (patients?.patients.length > 0) {
      const { patient_id, program_id, study } = patients.patients[0];
      setPatientID({
        submitter_donor_id: patient_id,
        program_id,
        study,
      });
    } else {
      setPatientID({ submitter_donor_id: debouncedSubmitterDonorId, program_id: debouncedProgramId, study });
    }
  }, [patients])

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
          <Form.Field width={4}>
            <Input 
              value={submitterDonorId}
              label={submitterDonorLabel || null}
              type="text"
              icon="id card outline"
              iconPosition={submitterDonorLabel ? undefined : "left"}
              placeholder={
                study.startsWith(defaultStudy)
                  ? "Submitter Participant ID"
                  : "Submitter Donor ID"
              }
              onChange={(e) => {
                setSubmitterDonorId(e.target.value);
              }}
              onKeyDown={ignoreEnter}
            />
          </Form.Field>
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
            onKeyDown={ignoreEnter}
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
          <ExportButton />
        </Form.Group>
      </Form>
    </Segment>
  );
};

export default PatientSearchForm;
