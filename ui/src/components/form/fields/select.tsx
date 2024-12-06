import React, { useEffect, useMemo } from "react"
import { Form, Icon, Popup } from "semantic-ui-react";
import * as R from "remeda";
import { constructDropdown, fieldIsRequired, findDescription } from '../utils'

export function SmallSelectField({ field, study, label, isDisabled, isReadonly, errorMessage, options, validator, value, updateErrorMessage, updateValue }) {
    const processedOptions = constructDropdown(options)
    const description = findDescription(field, study)
    const hasError = errorMessage !== null
    return (
        <Form.Field disabled={isDisabled} readOnly={isReadonly} error={hasError}>
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
            <Form.Group widths={options.length !== 1 ? options.length : "equal"}>
                {R.map(processedOptions, (option) => {
                    const isActive = value === option.value;
                    return (
                        <Form.Button
                            fluid
                            key={option.value}
                            basic={!isActive}
                            active={isActive}
                            color={isActive ? "teal" : undefined}
                            onClick={() => {
                                const recheckValueValidation = validator.safeParse(option.value);
                                if (recheckValueValidation.success) {
                                    updateErrorMessage({
                                        [field.name]: null,
                                    });
                                }
                                updateValue({
                                    target: {
                                        name: field.name,
                                        value: option.value
                                    }
                                });
                            }}
                            error={errorMessage}
                        >
                            {option.text}
                        </Form.Button>
                    );
                })}
            </Form.Group>
        </Form.Field>
    )
}

export function MultipleSmallSelectField({ field, study, label, isDisabled, isReadonly, errorMessage, options, validator, value, updateErrorMessage, updateValue, reset }) {
    const processedOptions = constructDropdown(options)
    const description = findDescription(field, study)
    const [selectedOptions, setSelectedOptions] = React.useState([])

    function handleClick(option) {
        const recheckValueValidation = validator.safeParse(option.value);
        if (recheckValueValidation.success) {
            updateErrorMessage({
                [field.name]: null,
            });
        }
        setSelectedOptions((prevSelected) => {
            const options = prevSelected.includes(option.value) ? prevSelected.filter((v) => option.value !== v) : [...prevSelected, option.value]
            return options
        })
    }

    useEffect(() => {
        setSelectedOptions([])
    }, [reset])

    useEffect(() => {
        updateValue({
            target: {
                name: field.name,
                value: selectedOptions
            }
        });
    }, [selectedOptions])

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
            <Form.Group widths={options.length !== 1 ? options.length : "equal"}>
                {R.map(processedOptions, (option) => {
                    const isActive = selectedOptions.includes(option.value);
                    return (
                        <Form.Button
                            fluid
                            key={option.value}
                            basic={!isActive}
                            active={isActive}
                            color={isActive ? "teal" : undefined}
                            onClick={() => {
                                handleClick(option)
                            }}
                            error={errorMessage}
                        >
                            {option.text}
                        </Form.Button>
                    );
                })}
            </Form.Group>
        </Form.Field>
    )
}

export function LargeSelectField({ field, study, label, isDisabled, isReadonly, errorMessage, options, validator, value, updateErrorMessage, updateValue }) {
    const processedOptions = useMemo(() => {
        return constructDropdown(options)
    }, [options])
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
            <Form.Select
                key={field.name}
                search
                name={field.name}
                value={field.type === "multiple" && ["", undefined, null].includes(value) ? [] : value}
                multiple={field.type === "multiple"}
                placeholder={field.placeholder}
                options={processedOptions}
                onChange={(_e, { name, value }) => {
                    const recheckValueValidation =
                        validator.safeParse(value);
                    if (recheckValueValidation.success) {
                        updateErrorMessage({
                            [field.name]: null,
                        });
                    }
                    updateValue({
                        target: {
                            name: name,
                            value: value
                        }
                    });
                }}
                clearable
                error={errorMessage}
            />
        </Form.Field>
    )
}