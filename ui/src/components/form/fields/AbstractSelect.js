// import { useEffect } from "react";
import { Form } from "semantic-ui-react";
import { doesNotMeetAllConditions } from "../utils";


/**
 * 
 * @param {*} object - (value) To populate the Select button
 *                   - (state) contol the state of the form
 *                   - (onChange) useState of the form state,
 *                   - (option) option given from the backend
 *                   - (validator) check if the input is vaild
 *                   - (handleValidator) set the validator
 *                   - (conditionals) boolean repersenting if the current component is disabled or not
 *                   - (catch/ctch) error catcher that noftifies the the component if the input if wrong
 *                   - (disable) overide conditional
 *                   - (catchHandle) change state of the error
 * @returns Select Component
 */
export function AbstractSelect({
    field,
    option,
    fieldState,
    gloabalForm,
    onChange,
  }) {
    // =====================
    // Abstract Select Tag
    // =====================
    if (option === undefined) return <></>

    console.log(field.conditionals)
    return (
      <Form.Select
        key={field.name}
        search={option.length > 8}
        name={field.name}
        value={fieldState}
        multiple={field.type === "mutiple"}
        placeholder={field.placeholder}
        label={field.label}
        options={option}
        onChange={(e, { name, value }) => onChange((feilds) => ({ ...feilds, ...{ [name]: value } }))}
        clearable
        disabled={ field.conditionals === null ? false : doesNotMeetAllConditions(field.conditionals, gloabalForm)}
      />
    );
  }


  /**
    useEffect(() => {
      handleValidator((valid) => ({
        ...valid,
        ...{
          [value.name]: Validation({
            type: value.type,
            regex: value.regex,
            required: value.required,
          }),
        },
      }));
    }, [
      handleValidator,
      value.name,
      conditionals,
      value.type,
      value.regex,
      value.required,
    ]);
    
    // The state has not been initialized
    if (state === undefined) return null;
  
    return (
      <Form.Select
        key={value.name}
        search={option.length > 8}
        name={value.name}
        multiple={value.type === "mutiple"}
        value={state}
        placeholder={value.placeholder}
        label={value.label}
        options={option}
        onChange={(e, { name, value }) => {
          onChange((feilds) => ({ ...feilds, ...{ [name]: value } }));
          if (ctch.error.includes(name)) {
            let valid = validator.safeParse(value);
            if (valid.success) {
              let update = ctch.error;
              update.splice(update.indexOf(name), 1);
              catchHandle((err) => ({
                error: update,
                errorMessage: { ...err.errorMessage },
              }));
            } else {
              catchHandle((err) => ({
                error: [...err.error],
                errorMessage: {
                  ...err.errorMessage,
                  ...{ [name]: ParseError(JSON.parse(valid.error)) },
                },
              }));
            }
          }
        }}
        error={
          conditionals 
            ? null
            : ctch.error.includes(value.name)
            ? ctch.errorMessage[value.name]
            : null
        }
        disabled={disabled === undefined ? conditionals : disabled}
        clearable
      />
    );
   */