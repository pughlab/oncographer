import React, { useEffect, useState } from "react";
import { Form, SemanticWIDTHS } from "semantic-ui-react";
import { FieldValue, ButtonSelectFieldProps, DropdownSelectFieldProps, SelectFieldProps } from "../types";
import { FormField } from "./base";

const SmallSelectField: React.FC<ButtonSelectFieldProps> = ({
  field,
  label,
  value,
  defaultValue,
  disabled,
  readonly,
  required,
  options,
  onClick,
}: ButtonSelectFieldProps) => {
  const [renderedValue, setRenderedValue] = useState(value ?? defaultValue)
  return (
    <FormField
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      study={""}
      onClick={onClick}
    >
      {({ disabled, onClick }) => (
        <Form.Group
          widths={
            options?.length !== 1
              ? (options?.length as SemanticWIDTHS)
              : "equal"
          }
        >
          {options?.map((option: string, index: number) => {
              const isActive = option === renderedValue;
              return (
                <Form.Button
                  fluid
                  key={`${field.name}-${index}`}
                  basic={!isActive}
                  active={isActive}
                  disabled={disabled}
                  color={isActive ? "teal" : undefined}
                  onClick={() => {
                    if (onClick) {
                      setRenderedValue(option)
                      onClick(field, option);
                    }
                  }}
                >
                  {option}
                </Form.Button>
              );
            })}
        </Form.Group>
      )}
    </FormField>
  );
};

const MultipleSmallSelectField: React.FC<ButtonSelectFieldProps> = ({
  field,
  label,
  value,
  defaultValue,
  disabled,
  readonly,
  required,
  onClick,
  options
}: ButtonSelectFieldProps) => {
  const selectedOptions = React.useRef<string[]>([])

  return (
    <FormField
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      study=""
      onClick={onClick}
    >
      {({disabled, onClick}) => (
        <Form.Group widths={options?.length !== 1 ? (options?.length as SemanticWIDTHS) : "equal"}>
          {
            options?.map((option: string, index: number) => {
              const isActive = selectedOptions.current.includes(option)
              const notEqual = (v: string) => option !== v
              return (
                <Form.Button
                  fluid
                  key={`${field.name}-${index}`}
                  basic={!isActive}
                  active={isActive}
                  disabled={disabled}
                  color={isActive ? "teal" : undefined}
                  onClick={() => {
                    if (onClick) {
                      const options = selectedOptions.current.includes(option) 
                        ? selectedOptions.current.filter(notEqual)
                        : [...selectedOptions.current, option]
                      selectedOptions.current = options
                      onClick(field, options)
                    }
                  }}
                >
                  {option}
                </Form.Button>
              )
            })
          }
        </Form.Group>
      )}
    </FormField>
  )
};

const LargeSelectField: React.FC<DropdownSelectFieldProps> = ({
  field,
  label,
  value,
  defaultValue,
  disabled,
  readonly,
  options,
  required,
  multiple,
  onChange,
  notifyError,
  formWasCleared
}: DropdownSelectFieldProps) => {

  const blankValue: FieldValue = multiple ? [] : ""
  const selectedValue = React.useRef<FieldValue>(blankValue)

  useEffect(() => {
    if (multiple && !Array.isArray(value)) {
      selectedValue.current = [value]
    }
  }, [])

  React.useEffect(() => {
    if (formWasCleared) {
      selectedValue.current = blankValue
    }
  }, [formWasCleared])

  return (
    <FormField
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      study=""
      onChange={onChange}
      notifyError={notifyError}
    >
      {({disabled, onChange}) => (
        <Form.Select
          options={options.map((option, index) => {
            return {
              key: index,
              text: option,
              value: option
            }
          })}
          search
          multiple={multiple}
          clearable
          disabled={disabled}
          value={selectedValue.current}
          onChange={(_e, { value }) => {
            const newValue = multiple ? value as string[] : value as string
            selectedValue.current = newValue
            onChange(field, newValue)
          }}
        />
      )}
    </FormField>
  )
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  defaultValue,
  disabled,
  multiple,
  field,
  readonly,
  required,
  validators,
  options,
  onChange,
  onClick,
  notifyError,
  formWasCleared
}: SelectFieldProps) => {
  let component 
  const isLarge = options.length > 4

  if (isLarge) {
    component = <LargeSelectField
      key={field.name}
      multiple={multiple}
      options={options}
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      onChange={onChange}
      notifyError={notifyError}
      validators={validators}
      formWasCleared={formWasCleared}
    />
  } else if (multiple) {
    component = <MultipleSmallSelectField
      key={field.name}
      multiple={true}
      options={options}
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      onClick={onClick}
    />
  } else {
    component = <SmallSelectField
      key={field.name}
      multiple={false}
      options={options}
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      onClick={onClick}
    />
  }

  return component
}