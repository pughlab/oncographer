import React from "react"
import DatePicker from "react-datepicker"
import dayjs from 'dayjs'
import { Form, Icon, Popup } from "semantic-ui-react"
import "react-datepicker/dist/react-datepicker.css"
import { fieldIsRequired, findDescription } from "../utils"


export function DateInputField({ field, study, label, value = null, comparingDate = null, isDisabled, isReadonly, errorMessage, validator, updateErrorMessage, updateValue }) {
    // calculate time difference in years between the current value and a given date
    const otherDate = comparingDate ?? new Date()
    const difference = dayjs(otherDate).diff(dayjs(value), 'years')
    const description = findDescription(field, study)

    const monthFormat = "MM/yyyy"
    const dayFormat = "dd/MM/yyyy"
    let format = ""

    if (field.format) {
        switch (typeof field.format) {
            case "string":
                try {
                    const formatObject = JSON.parse(field.format)
                    format = formatObject[study] === "day" ? dayFormat : monthFormat
                } catch (_error) {
                    format = field.format === "day" ? dayFormat : monthFormat
                }
                break
            case "object":
                format = field.format[study] === "day" ? dayFormat : monthFormat
                break
            default:
                format = monthFormat
        }
    } else {
        format = monthFormat
    }

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
                <Popup trigger={field.info && value && <Icon name='exclamation circle' />} content={`${field.info} ${difference}`} />
            </div>
            <DatePicker
                selected={typeof(value) === "string" ? new Date(value) : value}
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
                dateFormat={format}
                isClearable
                showMonthYearPicker={format === monthFormat}
                showFullMonthYearPicker={format === monthFormat}
                showFourColumnMonthYearPicker={format === monthFormat}
                readOnly={isReadonly}
            />
        </Form.Field>
    )
}

export function InputField({ field, study, label, value, isDisabled, isReadonly, errorMessage, validator, updateErrorMessage, updateValue }) {
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