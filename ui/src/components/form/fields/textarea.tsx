import React from "react"
import { Form, Icon, Popup } from "semantic-ui-react";

export function TextAreaField({
    field,
    isDisabled,
    validator,
    value,
    errorMessage,
    updateErrorMessage,
    updateValue
}) {
    return (
        <Form.Field disabled={isDisabled} error={errorMessage}>
            <div>
                <Popup
                    trigger={<span style={field.required && !isDisabled ? { color: 'red' } : { display: 'none' }}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                />
                <label style={{ marginRight: '5px' }}>{field.label}</label>
                <Popup
                    trigger={!isDisabled && <Icon name='help circle' />}
                    content={field.description}
                    position='top center'
                    inverted
                />
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