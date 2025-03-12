import { useLazyQuery, useQuery } from "@apollo/client";
import { FindSubmissions } from "../components/form/dynamic_form/queries/form";
import useRootForm from "./useRootForm";
import { usePatientID } from "../components/layout/context/PatientIDProvider";
import { useEffect, useState } from "react";
import useParentForm from "./useParentForm";

export function useSubmissions(formID: string) {
  const patientID = usePatientID();

  const submissionSearchInfo = {
    form_id: formID,
    patient: {
      patient_id: patientID.submitter_donor_id,
      program_id: patientID.program_id,
      study: patientID.study,
    },
  };

  const { loading, error, data, refetch } = useQuery(FindSubmissions, {
    variables: {
      where: submissionSearchInfo,
    },
    fetchPolicy: "network-only",
  });

  return { loading, error, data, refetch }
}

export function useRootFormSubmissions() {
  const patientID = usePatientID()
  const [rootSubmissions, setRootSubmissions] = useState<any[]>([])
  const { loading: rootFormLoading, error: rootFormError, data: rootForm } = useRootForm()
  const [getRootFormSubmissions, { loading: submissionsLoading, error: submissionsError, refetch }] = useLazyQuery(FindSubmissions, {
    variables: {
      where: {
        form_id: rootForm?.GetRootForm?.formID,
        patient: {
          patient_id: patientID.submitter_donor_id,
          program_id: patientID.program_id,
          study: patientID.study,
        },
      },
    },
    fetchPolicy: "network-only",
    onCompleted(data) {
      setRootSubmissions(data.submissions)
    },
  });

  const loading = rootFormLoading || submissionsLoading
  const error = rootFormError || submissionsError
  
  useEffect(() => {
    getRootFormSubmissions()
  }, [rootForm, getRootFormSubmissions])

  return { loading, error, data: rootSubmissions, refetch }
}

export function useParentSubmissions(formID: string) {
  const patientID = usePatientID()
  const [parentSubmissions, setParentSubmissions] = useState<any[]>([])
  const { loading: parentLoading, error: parentError, data: parentForm } = useParentForm(formID)
  const [getParentSubmissions, { loading: submissionsLoading, error: submissionsError, refetch }] = useLazyQuery(FindSubmissions, {
    variables: {
      where: {
        form_id: parentForm?.ParentForm?.formID,
        patient: {
          patient_id: patientID.submitter_donor_id,
          program_id: patientID.program_id,
          study: patientID.study,
        }
      }
    },
    fetchPolicy: "cache-first",
    onCompleted(data) {
      setParentSubmissions(data.submissions)
    },
  })

  const loading = parentLoading || submissionsLoading
  const error = parentError || submissionsError

  useEffect(() => {
    if(parentForm) {
      getParentSubmissions()
    }
  }, [parentForm, getParentSubmissions])

  return { loading, error, data: parentSubmissions, refetch }
}
