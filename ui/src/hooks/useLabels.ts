import { useQuery } from "@apollo/client";
import {
  FormLabels,
  PatientIDLabels,
} from "../components/form/dynamic_form/queries/form";
import {
  Field,
  LabelObject,
} from "../components/form/dynamic_form/types";
import { useLabelsContext } from "../components/layout/context/LabelsProvider";
import { usePatientID } from "../components/layout/context/PatientIDProvider";

export function usePatientIDLabels() {
  const { loading, error, data } = useQuery(PatientIDLabels, {
    fetchPolicy: "cache-first",
  });
  const labels: LabelObject = {};
  if (data) {
    const fields = data.forms[0].fieldsConnection.edges.map(
      (edge: any) => edge.node
    );
    fields.forEach((field: Field) => {
      labels[field.name] = field.label;
    });
  }

  return { loading, error, data: labels };
}

export function useFormLabels(formID: string) {
  const { study } = usePatientID();
  const labels: LabelObject = {};
  const { loading, error, data } = useQuery(FormLabels, {
    variables: {
      id: formID,
      study: study,
    },
    fetchPolicy: "cache-first",
    skip: !formID,
  });

  if (data) {
    const fields = data.GetFormFields;
    fields.forEach((field: Field) => {
      labels[field.name] = field.label;
    });
  }

  return { loading, error, data: labels };
}

export function useLabel(fieldName: string) {
  const labels = useLabelsContext();
  const { study } = usePatientID();
  let label: string | undefined = "";

  if (labels.hasOwnProperty(fieldName)) {
    label = labels[fieldName]?.[study] ?? labels[fieldName]?.default;
  }

  return label ?? "";
}

export function useStudyLabels() {
  const labels = useLabelsContext();
  const { study } = usePatientID();

  const studyLabels: { [key: string]: string } = {};

  Object.keys(labels).forEach((key: string) => {
    const value = labels[key]?.hasOwnProperty(study) ? labels[key]?.[study] : labels[key]?.default 
    studyLabels[key] = value ?? "";
  });

  return studyLabels;
}
