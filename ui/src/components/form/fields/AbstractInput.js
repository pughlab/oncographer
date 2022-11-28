// import { useState } from "react";
import { Form } from "semantic-ui-react";
// import { optional } from "zod";
import { doesNotMeetAllConditions } from "../utils";

/**
 * 
 * @param {*} object - (value) To populate the Select button
 *                   - (state) contol the state of the form
 *                   - (onChange) useState of the form state,
 *                   - (validator) check if the input is vaild
 *                   - (handleValidator) set the validator
 *                   - (conditionals) boolean repersenting if the current component is disabled or not
 *                   - (catch/ctch) error catcher that noftifies the the component if the input if wrong
 *                   - (disable) overide conditional
 *                   - (catchHandle) change state of the error
 * @returns Input Component
 */
export function AbstractInput({
    field,
    fieldState,
    gloabalForm,
    onChange
  }) {

    return (
      <Form.Input
        name={field.name}
        value={fieldState}
        type={field.type}
        label={field.label}
        placeholder={field.placeholder}
        onChange={(e) => {onChange((fld) => ({...fld, [e.target.name] : e.target.value}))}}
        disabled={field.conditionals === null ? false : doesNotMeetAllConditions(field.conditionals, gloabalForm)}
      />
    );
  }

  /**
   * <Form.Input
        key={value.name}
        required={value.required}
        name={value.name}
        type={value.type}
        ref={state}
        label={value.label}
        placeholder={value.placeholder}
        error={
          conditionals || optional
            ? null
            : ctch.error.includes(value.name)
            ? ctch.errorMessage[value.name]
            : null
        }
        onChange={(e, { name, value, type }) => {

          onChange((feilds) => ({ ...feilds, ...{ [name]: value } })); // change the old value to updated value 
  
                                            // ctch is an (object) containing array of errors and object of messages.
                                            // If the error catch contains the name withing the error array 
                                            // this means that the current value gives dose not vaildate 
                                            // with our validator
          if (ctch.error.includes(name)) {
            let item = value;               // assign value to item

                                                                        
            if (type === "date") {          // if the type is date we need to change the value to Date Object
              item = new Date(value);
            } else if (type === "number"){
              item = parseInt(value)
            }

            let valid = validator.safeParse(item); // validate the current value (item)
                  
            if (valid.success) { // if successful then update our error state, and message
              
              let update = ctch.error;
              update.splice(update.indexOf(name), 1);
              catchHandle((err) => ({
                error: update,
                errorMessage: { ...err.errorMessage },
              }));
            } else {  // else update the error message to mach the possible change of the value
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
        disabled={disabled === undefined ? conditionals : disabled}
      />
   */