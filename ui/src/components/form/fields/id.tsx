import React from "react";
import { Form, Icon, Popup } from "semantic-ui-react";
import { fieldIsRequired } from "../utils"

export function PrimaryIDField({ field, study, label, validator, value, errorMessage, updateErrorMessage, updateValue }) {
    return (
        <Form.Field key={field.name} error={errorMessage !== null}>
            <div>
                <Popup
                    trigger={<span style={fieldIsRequired(field, study) ? { color: 'red' } : { display: 'none' }}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                />
                <label style={{ marginRight: '5px' }}>{label}</label>
                <Popup
                    trigger={<Icon name='help circle' />}
                    content={field.description}
                    position='top center'
                    inverted
                />
            </div>
            <Form.Input
                name={field.name}
                value={value}
                type={field.type}
                placeholder={field.placeholder}
                onChange={(e) => {
                    const recheckValueValidation = validator.safeParse(e.target.value);
                    if (recheckValueValidation.success) {
                        updateErrorMessage({ [field.name]: null });
                    }
                    updateValue(e)
                }}
                error={errorMessage}
            />
        </Form.Field>
    )
}

export function SecondaryIDField({ field, study, label, override, validator, value, errorMessage, updateErrorMessage, updateValue }) {
    return (
        <Form.Field key={field.name} error={errorMessage !== null}>
            <div>
                <Popup
                    trigger={
                        <span style={
                            fieldIsRequired(field, study) && override === null ? { color: 'red' } : { display: 'none' }
                        }>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                />
                <label style={{ marginRight: '5px' }}>{label}</label>
                <Popup
                    trigger={<Icon name='help circle' />}
                    content={field.description}
                    position='top center'
                    inverted
                />
            </div>
            <Form.Input
                name={field.name}
                value={value}
                type={field.type}
                placeholder={field.placeholder}
                onChange={(e) => {
                    const recheckValueValidation = validator.safeParse(e.target.value)
                    if (recheckValueValidation.success) {
                        updateErrorMessage({ [field.name]: null })
                    }
                    updateValue(e);
                }}
                error={errorMessage}
            />
        </Form.Field>
    )
}