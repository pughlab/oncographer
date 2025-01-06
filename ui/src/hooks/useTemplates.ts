import { useQuery } from "@apollo/client";
import { usePatientID } from "../components/layout/context/PatientIDProvider";
import { FindTemplate } from "../components/form/dynamic_form/queries/form";

export default function useTemplates(formID: string) {
  const patientID = usePatientID();

  const { loading, error, data, refetch } = useQuery(FindTemplate, {
    variables: {
      where: {
        form_id: formID,
        patient_id: JSON.stringify(patientID),
      },
    },
    fetchPolicy: "cache-first",
  });

  return { loading, error, data: data?.formTemplates ?? [], refetch };
}
