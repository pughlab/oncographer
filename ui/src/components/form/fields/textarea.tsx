import React from "react"
import { Form, Icon, Popup } from "semantic-ui-react";
import { fieldIsRequired, findDescription } from "../utils"

export function TextAreaField({
    field,
    study,
    label,
    isDisabled,
    isReadonly,
    validator,
    value,
    errorMessage,
    updateErrorMessage,
    updateValue
}) {
    const description = findDescription(field, study)
    return (
        <Form.Field disabled={isDisabled} readOnly={isReadonly} error={errorMessage !== null}>
            <div>
                <Popup
                    trigger={<span style={fieldIsRequired(field, study) && !isDisabled ? { color: 'red' } : { display: 'none' }}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                />
                <label style={{ marginRight: '5px' }}>{label}</label>
                {
                    description
                    ? <Popup
                        trigger={!isDisabled && <Icon name='help circle' />}
                        content={description}
                        position='top center'
                        inverted
                    />
                    : <></>
                }
            </div>
            <Form.TextArea
                name={field.name}
                rows={4}
                value={value ?? ''}
                placeholder={field.placeholder}
                onChange={(e) => {
                    let newValue = ["number", "integer"].includes(field.type.toLowerCase())
                        ? +e.target.value
                        : e.target.value;
                    newValue = Number.isNaN(newValue) ? field.value : newValue;
                    const recheckValueValidation =
                        validator.safeParse(newValue);
                    if (recheckValueValidation.success) {
                        updateErrorMessage({
                            [field.name]: null,
                        });
                    }
                    updateValue({
                        target: {
                            name: field.name,
                            value: newValue
                        }
                    })
                }}
                error={errorMessage}
            />
        </Form.Field>
    )
}