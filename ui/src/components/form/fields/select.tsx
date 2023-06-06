import React, { useMemo } from "react"
import { Form, Icon, Popup } from "semantic-ui-react";
import * as R from "remeda";
import { constructDropdown } from '../utils'

export function SmallSelectField({ field, isDisabled, errorMessage, options, validator, value, updateErrorMessage, updateGlobalState }) {
    const processedOptions = constructDropdown(options)
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
            <Form.Group widths={options.length}>
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
                                updateGlobalState({
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

export function LargeSelectField({ field, isDisabled, errorMessage, options, validator, value, updateErrorMessage, updateGlobalState }) {
    const processedOptions = useMemo(() => {
        return constructDropdown(options)
    }, [options])
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
            <Form.Select
                key={field.name}
                search
                name={field.name}
                value={field.type === "mutiple" && value === "" ? [] : value}
                multiple={field.type === "mutiple"}
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
                    updateGlobalState({
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