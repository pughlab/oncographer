import { useQuery } from "@apollo/client";
import { RootForm } from "../components/form/dynamic_form/queries/form";
import { usePatientID } from "../components/layout/context/PatientIDProvider";

export default function useRootForm() {
  const { study } = usePatientID();

  const { loading, error, data } = useQuery(RootForm, {
    variables: {
      study,
    },
  });

  return { loading, error, data };
}
