import React, { useState } from "react";
import { Form, Icon, Label, Popup } from "semantic-ui-react";
import { Field, FieldValue, FormFieldProps } from "../types";

export const FormField: React.FC<FormFieldProps> = ({
  field,
  study,
  label,
  defaultValue,
  disabled,
  readonly,
  validators = [],
  required,
  onChange,
  onClick,
  notifyError,
  children,
}) => {
  const [error, setError] = useState("");
  const validate = (value: FieldValue) => {
    for (const validator of validators) {
      const errorMessage = validator(value);
      if (errorMessage) {
        setError(errorMessage);
        if (notifyError) {
          notifyError();
        }
        return;
      }
    }
    setError("");
  };

  const handleChange = (field: Field, value: FieldValue) => {
    if (onChange) {
      onChange(field, value);
      validate(value);
    }
  };

  const handleClick = (field: Field, value: FieldValue) => {
    if (onClick) {
      onClick(field, value);
    }
  };

  return (
    <Form.Field error={!!error}>
      <label>
        {required && !disabled && (
          <Popup
            trigger={
              <span style={{ color: "red", fontSize: "1.2em" }}>* </span>
            }
            content={"Required field."}
            position="top center"
            inverted
          />
        )}
        {`${label} `}
        {field.description ? (
          <Popup
            trigger={<Icon name="help circle" />}
            content={field.description}
            position="top center"
            inverted
          />
        ) : (
          <></>
        )}
      </label>
      {children({
        study,
        defaultValue,
        disabled,
        readonly,
        onChange: handleChange,
        onClick: handleClick,
      })}
      {error && (
        <Label basic color="red" pointing>
          {error}
        </Label>
      )}
    </Form.Field>
  );
};
