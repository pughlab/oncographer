import React, { PropsWithChildren, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { Input, Radio } from "semantic-ui-react";
import { v4 as uuid4 } from "uuid";
import { FormField } from "./base";
import { getFormat } from "../utils/date";
import {
  InputFieldPropsBase,
  DateInputFieldProps,
  InputFieldProps,
} from "../types";

import "react-datepicker/dist/react-datepicker.css";

const TextInputField: React.FC<PropsWithChildren<InputFieldPropsBase>> = ({
  field,
  label,
  value,
  defaultValue = "",
  disabled,
  readonly,
  required,
  type = "text",
  validators,
  notifyError,
  onChange,
}: InputFieldPropsBase) => {
  const [renderedValue, setRenderedValue] = useState(value ?? defaultValue);
  return (
    <FormField
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      onChange={onChange}
      notifyError={notifyError}
      study={""}
      validators={validators}
    >
      {({ disabled, readonly, onChange }) => (
        <Input
          fluid
          type={type}
          readOnly={readonly}
          disabled={disabled}
          value={renderedValue}
          onChange={(_e, { value }) => {
            setRenderedValue(value);
            onChange(field, value);
          }}
        />
      )}
    </FormField>
  );
};

const DateInputField: React.FC<PropsWithChildren<DateInputFieldProps>> = ({
  field,
  label,
  value,
  defaultValue,
  disabled,
  readonly,
  required,
  validators,
  resolution,
  notifyError,
  onChange,
  formWasCleared,
}: DateInputFieldProps) => {
  const radioGroupName = uuid4();
  const [fieldResolution, setFieldResolution] = useState<string>(resolution);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof value === "string" && value.length > 0) {
      try {
        const temp = JSON.parse(value);
        setFieldResolution(temp.resolution);
        setSelectedDate(new Date(temp.value));
      } catch (error) {
        console.log(`Date element could not be parsed. Reason: ${error}`);
      }
    }
  }, [value]);

  useEffect(() => {
    if (formWasCleared) {
      setSelectedDate(null);
      setFieldResolution('month')
    }
  }, [formWasCleared]);

  return (
    <FormField
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      onChange={onChange}
      study=""
      validators={validators}
      notifyError={notifyError}
    >
      {({ disabled, onChange }) => (
        <>
          <Radio
            label="Year"
            name={radioGroupName}
            value="year"
            checked={fieldResolution === "year"}
            disabled={disabled}
            style={{ margin: "5px" }}
            onChange={() => {
              setFieldResolution("year");
            }}
          />
          <Radio
            label="Month"
            name={radioGroupName}
            value="month"
            checked={fieldResolution === "month"}
            disabled={disabled}
            style={{ margin: "5px" }}
            onChange={() => {
              setFieldResolution("month");
            }}
          />
          <Radio
            label="Day"
            name={radioGroupName}
            value="day"
            checked={fieldResolution === "day"}
            disabled={disabled}
            style={{ margin: "5px" }}
            onChange={() => {
              setFieldResolution("day");
            }}
          />
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
              setSelectedDate(date);
              onChange(
                field,
                JSON.stringify({
                  value: date ?? "",
                  resolution: date ? fieldResolution : "",
                })
              );
            }}
            dateFormat={getFormat(fieldResolution)}
            showYearPicker={fieldResolution === "year"}
            showMonthYearPicker={fieldResolution === "month"}
            placeholderText={"Select or type a date"}
            isClearable
            readOnly={readonly}
            utcOffset={0}
            disabled={disabled}
            value={selectedDate || ""}
          />
        </>
      )}
    </FormField>
  );
};

export const InputField: React.FC<PropsWithChildren<InputFieldProps>> = ({
  field,
  label,
  value,
  defaultValue = "",
  disabled,
  readonly,
  type = "text",
  validators,
  resolution,
  onChange,
  formWasCleared,
  notifyError,
  required,
}: InputFieldProps) => {
  let component;
  const isDate = ["month", "date"].includes(type);

  component = isDate ? (
    <DateInputField
      key={field.name}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      field={field}
      readonly={readonly}
      required={required}
      type={""}
      onChange={onChange}
      resolution={resolution ?? "month"}
      formWasCleared={formWasCleared}
      validators={validators}
      notifyError={notifyError}
    />
  ) : (
    <TextInputField
      key={field.name}
      field={field}
      label={label}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      readonly={readonly}
      required={required}
      validators={validators}
      type={type}
      onChange={onChange}
      notifyError={notifyError}
    />
  );

  return component;
};
