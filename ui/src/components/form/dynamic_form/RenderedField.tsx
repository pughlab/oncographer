import React from "react"
import { InputField } from "./fields/input"
import { SelectField } from "./fields/select"
import { TextareaField } from "./fields/textarea"
import { Field, FieldValue, Validator } from "./types"
import { findLabel } from "./utils/field"

export default function RenderedField({
  field,
  validators,
  updateValue, 
  isReset,
  notifyError,
  values = {},
  updateForm,
  study = null,
  required = false,
  disabled = false,
} : {
  field: Field,
  validators: Validator[],
  updateValue: (field: any, value: FieldValue) => void,
  isReset: boolean,
  notifyError: () => void|undefined,
  values: { [key: string]: FieldValue },
  updateForm: () => void,
  study: string|null,
  required: boolean,
  disabled: boolean,
}) {
  let component = <></>
  const label = findLabel(field, values, study)
  const value = values.hasOwnProperty(field.name) ? values[field.name] : ""

  switch (field.component.toLowerCase()) {
    case 'input':
      if (field.type.toLowerCase() === 'textarea') {
        component = <TextareaField
          label={label}
          value={value as string}
          defaultValue={""}
          field={field}
          readonly={false}
          required={required}
          disabled={disabled}
          validators={validators}
          onChange={updateValue}
          notifyError={notifyError}
          isReset={isReset}
        />
      } else {
        component = <InputField 
          field={field}
          label={label} 
          value={value} 
          defaultValue="" 
          disabled={disabled}
          readonly={false}
          required={required}
          validators={validators}
          type={field.type}
          onChange={updateValue}
          notifyError={notifyError}
          isReset={isReset}
          onBlur={updateForm}
        />
      }
      break
    case 'select':
      component = <SelectField
        multiple={field.type === 'multiple'}
        options={field.options as string[]}
        field={field}
        label={label}
        value={value}
        defaultValue={""}
        disabled={disabled}
        readonly={false}
        required={required}
        validators={validators}
        onClick={(field, value) => {updateValue(field, value); updateForm()}}
        onChange={(field, value) => {updateValue(field, value); updateForm()}}
        notifyError={notifyError}
        isReset={isReset}
      />
      break
  }
  return component
}