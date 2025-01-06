import { useQuery } from "@apollo/client";
import { FindSubmissions } from "../components/form/dynamic_form/queries/form";
import useRootForm from "./useRootForm";
import { usePatientID } from "../components/layout/context/PatientIDProvider";

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
    fetchPolicy: "cache-first",
  });

  return { loading, error, data, refetch }
}

export function useRootFormSubmissions() {
  const patientID = usePatientID()
  const { loading: rootFormLoading, error: rootFormError, data: rootForm } = useRootForm()
  const { loading: submissionsLoading, error: submissionsError, data: submissions, refetch } = useQuery(FindSubmissions, {
    variables: {
      where: {
        form_id: rootForm?.GetRootForm?.form_id,
        patient: {
          patient_id: patientID.submitter_donor_id,
          program_id: patientID.program_id,
          study: patientID.study,
        },
      },
    },
    fetchPolicy: "cache-first",
    skip: !rootForm,
  });

  const loading = rootFormLoading || submissionsLoading
  const error = rootFormError || submissionsError

  return { loading, error, data: submissions?.submissions ?? [], refetch }
}
