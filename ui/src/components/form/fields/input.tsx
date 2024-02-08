import React from "react"
import DatePicker from "react-datepicker"
import dayjs from 'dayjs'
import { Form, Icon, Popup } from "semantic-ui-react"
import "react-datepicker/dist/react-datepicker.css"
import { fieldIsRequired } from "../utils"


export function DateInputField({ field, study, label, value, comparingDate = null, isDisabled, isReadonly, errorMessage, validator, updateErrorMessage, updateValue }) {
    // calculate time difference in years between the current value and a given date
    const otherDate = comparingDate ?? new Date()
    const difference = dayjs(otherDate).diff(dayjs(value), 'years')

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
                <Popup
                    trigger={!isDisabled && <Icon name='help circle' />}
                    content={field.description}
                    position='top center'
                    inverted
                />
                <Popup trigger={field.info && value && <Icon name='exclamation circle' />} content={`${field.info} ${difference}`} />
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
                readOnly={isReadonly}
            />
        </Form.Field>
    )
}

export function InputField({ field, study, label, value, isDisabled, isReadonly, errorMessage, validator, updateErrorMessage, updateValue }) {
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
                readOnly={isReadonly}
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