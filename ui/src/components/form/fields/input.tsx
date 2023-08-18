import React from "react"
import DatePicker from "react-datepicker"
import { Form, Icon, Popup } from "semantic-ui-react"
import "react-datepicker/dist/react-datepicker.css"

export function DateInputField({ field, study, value, isDisabled, errorMessage, validator, updateErrorMessage, updateValue }) {
    return (
        <Form.Field disabled={isDisabled} error={errorMessage}>
            <div>
                <Popup
                    trigger={<span style={field.required && !isDisabled ? { color: 'red' } : { display: 'none' }}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                />
                <label style={{ marginRight: '5px' }}>{field.display_name ? field.display_name[study] : field.label}</label>
                <Popup
                    trigger={!isDisabled && <Icon name='help circle' />}
                    content={field.description}
                    position='top center'
                    inverted
                />
            </div>
            <DatePicker
                selected={value}
                placeholderText={field.placeholder}
                onChange={(date) => {
                    const recheckValueValidation = validator.safeParse(date === null ? date : new Date(date));
                    if (recheckValueValidation.success) {
                        updateErrorMessage({
                            [field.name]: null,
                        });
                    }
                    updateValue({
                        /* 
                         * we create a structure similar to the event object
                         * so we don't need to rewrite the handler in the reducer
                         * for this particular case
                        */
                        target: {
                            name: field.name,
                            value: date === null ? date : new Date(date)
                        }
                    })
                }}
                dateFormat="MM/yyyy"
                isClearable
                showMonthYearPicker
                showFullMonthYearPicker
                showFourColumnMonthYearPicker
            />
        </Form.Field>
    )
}

export function InputField({ field, study, value, isDisabled, errorMessage, validator, updateErrorMessage, updateValue }) {
    return (
        <Form.Field disabled={isDisabled} error={errorMessage}>
            <div>
                <Popup
                    trigger={<span style={field.required && !isDisabled ? { color: 'red' } : { display: 'none' }}>* </span>}
                    content={"Required field."}
                    position='top center'
                    inverted
                />
                <label style={{ marginRight: '5px' }}>{field.display_name ? field.display_name[study] :field.label}</label>
                <Popup
                    trigger={!isDisabled && <Icon name='help circle' />}
                    content={field.description}
                    position='top center'
                    inverted
                />
            </div>
            <Form.Input
                name={field.name}
                value={value ?? ''}
                type={field.type}
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
                    updateValue(e);
                }}
                error={errorMessage}
            />
        </Form.Field>
    )
}