import React from 'react'
import { Form, Icon, Popup, Checkbox } from "semantic-ui-react"
import { fieldIsRequired, findDescription } from "../utils"

export function CheckboxField({ field, study, label, value, checked, isDisabled, isReadonly, errorMessage, validator, updateErrorMessage, updateValue }) {
    const description = findDescription(field, study)
    return (
        <Form.Field disabled={isDisabled} error={errorMessage !== null}>
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
            <Checkbox 
                name={field.name}
                defaultChecked={checked}
                readOnly={isReadonly}
                value={value}
                toggle
                onChange={(_e, {name, checked}) => {
                    const recheckValueValidation = validator.safeParse(checked)
                    if (recheckValueValidation.success) {
                        updateErrorMessage({
                            [field.name]: null
                        })
                    }   
                    updateValue({
                        target: {
                            name: name,
                            value: checked
                        }
                    })
                }}
            />
        </Form.Field>
    )
}