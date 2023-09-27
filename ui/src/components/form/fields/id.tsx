import React from "react";
import { Form, Icon, Popup } from "semantic-ui-react";

export function PrimaryIDField({ field, label, validator, value, errorMessage, updateErrorMessage, updateValue }) {
    return (
        <Form.Field key={field.node.name}>
            <div>
                <Popup
                    trigger={<span style={field.node.required ? { color: 'red' } : { display: 'none' }}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                />
                <label style={{ marginRight: '5px' }}>{label}</label>
                <Popup
                    trigger={<Icon name='help circle' />}
                    content={field.node.description}
                    position='top center'
                    inverted
                />
            </div>
            <Form.Input
                name={field.node.name}
                value={value}
                type={field.node.type}
                placeholder={field.node.placeholder}
                onChange={(e) => {
                    const recheckValueValidation = validator.safeParse(e.target.value);
                    if (recheckValueValidation.success) {
                        updateErrorMessage({ [field.node.name]: null });
                    }
                    updateValue(e)
                }}
                error={errorMessage}
            />
        </Form.Field>
    )
}

export function SecondaryIDField({ field, label, override, validator, value, errorMessage, updateErrorMessage, updateValue }) {
    return (
        <Form.Field key={field.name}>
            <div>
                <Popup
                    trigger={
                        <span style={
                            field.required && override === null ? { color: 'red' } : { display: 'none' }
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