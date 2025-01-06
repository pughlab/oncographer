import { useQuery } from "@apollo/client";
import { Form } from "../components/form/dynamic_form/types";
import { FieldData } from "../components/form/dynamic_form/queries/form";
import { usePatientID } from "../components/layout/context/PatientIDProvider";

export function useGetFieldData(form: Form) {
  const { study } = usePatientID();
  const { loading, error, data } = useQuery(FieldData, {
    variables: {
      id: form.formID,
      study
    },
    fetchPolicy: "no-cache"
  })

  return { loading, error, data: data?.GetFormFields ?? [] };
}
