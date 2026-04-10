import { useEffect } from "react";
import { useGetFieldData } from "../../../../hooks/useGetFieldData";
import { useUpdateLabelsContext } from "../../../layout/context/LabelsProvider";
import * as reducer from "../dependencies/reducer";
import { DynamicFormProps, Field } from "../types";

export const useFormInitialization = (
  form: DynamicFormProps['form'],
  patientID: any,
  excluded_fields: string[],
  dispatch: React.Dispatch<any>,
  send: (event: any) => void
) => {
  const { error: fieldsError, data: fields } = useGetFieldData(form);
  const setLabels = useUpdateLabelsContext();

  useEffect(() => {
    if (fieldsError) {
      send('ERROR');
    }
  }, [fieldsError, send]);

  useEffect(() => {
    if (fields.length > 0) {
      reducer.updateWidgets(dispatch, fields.filter((field: Field) => !excluded_fields.includes(field.name)));
      
      if (form.required_fields) {
        const requiredFields = patientID.study && form.required_fields 
          ? form.required_fields[patientID.study] ?? [] 
          : form.required_fields?.default ?? [];
        reducer.updateRequiredFields(dispatch, requiredFields.filter((field: string) => !excluded_fields.includes(field)));
      }
      
      if (form.mutex_fields) {
        const mutexFields = patientID.study && form.mutex_fields.hasOwnProperty(patientID.study)
          ? form.mutex_fields[patientID.study]
          : form.mutex_fields?.default ?? [];
        reducer.updateExclusiveFields(dispatch, mutexFields.filter((field: string) => !excluded_fields.includes(field)));
      }

      const fieldLabels = fields.reduce((labels: any, field: any) => {
        labels[field.name] = field.label;
        return labels;
      }, {});
      
      setLabels(oldLabels => ({
        ...oldLabels,
        ...fieldLabels
      }));
      
      send('DONE');
    }
  }, [fields, excluded_fields, form, patientID.study, setLabels, send, dispatch]);

  return { fields, fieldsError };
};