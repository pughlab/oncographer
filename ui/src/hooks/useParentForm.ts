import { useQuery } from "@apollo/client";
import { ParentForm } from "../components/form/dynamic_form/queries/form";

export default function useParentForm(formID: string) {

  const { loading, error, data } = useQuery(ParentForm, {
    variables: {
      id: formID,
    },
  });

  return { loading, error, data };
}
