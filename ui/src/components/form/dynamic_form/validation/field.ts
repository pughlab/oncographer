import { isValid, parseISO } from "date-fns"
import { Validator, FieldValue, Field } from '../types'

export const notEmpty: Validator = (value: FieldValue) => {
    if (Array.isArray(value)) {
        return value.length === 0 ? 'You must select an option' : null
    }
    return !value || value.trim() === '' ? 'This field must not be empty' : null
}

export const regex = (regex: RegExp, errorMessage: string) => (value: FieldValue): string | null => {
    if (Array.isArray(value)){
        return null
    }
    return regex.test(value) ? null : errorMessage
}

export const number: Validator = (value: any) => {
    if (Array.isArray(value)) {
        return null
    }
    return isNaN(value) ? 'This field must be a number' : null
}

export const integer: Validator = (value: FieldValue) => {
    if (Array.isArray(value)) {
        return null
    }
    return /^-?\d*$/.test(value) ? null : 'This field must be an integer (i.e. not include decimals)'
}

export const date = (value: FieldValue|Date): string | null => {

    let result = null

    if (typeof value === 'string' && value.length !== 0) {
        try {
            const parsedValue = JSON.parse(value)
            if (parsedValue?.value) {
                const parsedDate = parseISO(parsedValue.value)
                if (!isValid(parsedDate)) {
                    result = 'This field must be a valid date'
                }
            }
        } catch (_error) {
            result = 'This field must be a valid date'
        }
    }
    return result
}

export const min = (limit: number) => (value: FieldValue): string | null => {
    if (Array.isArray(value)) {
        return null
    }
    return Number(value) < limit ? `The value must not be lower than ${limit}`: null
}

export const max = (limit: number) => (value: FieldValue): string | null => {
    if (Array.isArray(value)) {
        return null
    }
    return Number(value) > limit ? `The value must not be greater than ${limit}`: null
}

export const getFieldValidators = (field: Field, requiredFields: string[] = [], mutexFields: string[] = []) => {
    const validators: Validator[] = []

    if (requiredFields.includes(field.name) && !mutexFields.includes(field.name)) {
        validators.push(notEmpty)
    }
    
    if (field.type.toLowerCase() === 'number' || field.type.toLowerCase() === 'integer') {
        validators.push(number)
    }

    if (field.type.toLowerCase() === 'integer') {
        validators.push(integer)
    }

    if (field.minValue) {
        validators.push(min(field.minValue))
    }

    if (field.maxValue) {
        validators.push(max(field.maxValue))
    }

    if (field.regex) {
        validators.push(regex(new RegExp(field.regex), "This value is invalid"))
    }

    if (field.type.toLowerCase() === 'date' || field.type.toLowerCase() === 'month') {
        validators.push(date)
    }

    return validators
}
