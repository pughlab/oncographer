import React from 'react'
import { TextArea } from 'semantic-ui-react'
import { TextareaProps } from '../../types'
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
            {({defaultValue, onChange}) => (
                <TextArea 
                    name={field.name}
                    rows={4}
                    value={!value || Array.isArray(value) ? "" : value ?? defaultValue}
                    onChange={(_e, { value }) => onChange(field, value as string)}
                />
            )}
        </FormField>
    )
}