import React from 'react'
import { TextArea } from 'semantic-ui-react'
import { TextareaProps } from '../types'
import { FormField } from './base'

export const TextareaField: React.FC<TextareaProps> = ({
    label,
    value,
    defaultValue = "",
    field,
    readonly,
    required,
    disabled,
    validators,
    notifyError,
    onChange
}: TextareaProps) => {
    const [renderedValue, setRenderedValue] = React.useState<string|number|undefined>(value ?? defaultValue);
    return (
        <FormField
            study=''
            label={label}
            value={value}
            defaultValue={defaultValue}
            field={field}
            readonly={readonly}
            required={required}
            disabled={disabled}
            validators={validators}
            onChange={onChange}
            notifyError={notifyError}
        >
            {({onChange}) => (
                <TextArea 
                    name={field.name}
                    rows={4}
                    value={renderedValue}
                    onChange={(_e, { value }) => {
                        setRenderedValue(value)
                        onChange(field, value as string)
                    }}
                />
            )}
        </FormField>
    )
}