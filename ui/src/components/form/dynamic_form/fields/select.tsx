import React, { useEffect, useMemo, useState } from "react";
import { Form, SemanticWIDTHS } from "semantic-ui-react";
import { FieldValue, ButtonSelectFieldProps, DropdownSelectFieldProps, SelectFieldProps } from "../types";
import { FormField } from "./base";
import { createHash } from "crypto";

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
  isReset
}: ButtonSelectFieldProps) => {
  const [renderedValue, setRenderedValue] = useState(value ?? defaultValue)

  useEffect(() => {
    if(isReset) {
      setRenderedValue("")
    }
  }, [isReset])

  useEffect(() => {
    setRenderedValue(value)
  }, [value])

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
  options,
  isReset
}: ButtonSelectFieldProps) => {
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([])

  useEffect(() => {
    if (isReset) {
      setSelectedOptions([])
    }
  }, [isReset])

  useEffect(() => {
    setSelectedOptions(value as string[])
  }, [value])

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
              const isActive = selectedOptions.includes(option)
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
                      const options = selectedOptions.includes(option) 
                        ? selectedOptions.filter(notEqual)
                        : [...selectedOptions, option]
                      setSelectedOptions(options)
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
  isReset
}: DropdownSelectFieldProps) => {

  const blankValue: FieldValue = multiple ? [] : ""
  const [selectedValue, setSelectedValue] = useState<FieldValue>(blankValue)

  useEffect(() => {
    if (multiple && !Array.isArray(value)) {
      setSelectedValue([value])
    }
  }, [])

  useEffect(() => {
    if (isReset) {
      setSelectedValue(blankValue)
    }
  }, [isReset])

  useEffect(() => {
    const strategies = {
      'single': () => setSelectedValue(value),
      'multiple': () => {
        if (!Array.isArray(value)) {
          setSelectedValue([value])
        } else {
          setSelectedValue(value)
        }
      }
    }
    const selectedStrategy = multiple ? 'multiple' : 'single'

    strategies[selectedStrategy]()
  }, [value])

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
          value={selectedValue}
          onChange={(_e, { value }) => {
            const newValue = multiple ? value as string[] : value as string
            setSelectedValue(newValue)
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
  isReset
}: SelectFieldProps) => {
  let component 
  const isLarge = options.length > 4
  const key = useMemo(() => {
    return createHash('sha256').update(field.name + value).digest('hex')
  }, [field.name, value])

  if (isLarge) {
    component = <LargeSelectField
      key={key}
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
      isReset={isReset}
    />
  } else if (multiple) {
    component = <MultipleSmallSelectField
      key={key}
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
      isReset={isReset}
    />
  } else {
    component = <SmallSelectField
      key={key}
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
      isReset={isReset}
    />
  }

  return component
}