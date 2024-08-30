import React, { useEffect, useRef, useState } from "react"
import DatePicker from "react-datepicker"
import dayjs from 'dayjs'
import { Form, Icon, Popup, Radio } from "semantic-ui-react"
import "react-datepicker/dist/react-datepicker.css"
import { v4 as uuid4 } from 'uuid'
import { fieldIsRequired, findDescription } from "../utils"

export function DateInputField({ field, study, label, value, comparingDate = null, isDisabled, isReadonly, errorMessage, validator, updateErrorMessage, updateValue }) {
    // calculate time difference in years between the current value and a given date
    const otherDate = comparingDate ?? new Date()
    const difference = dayjs(otherDate).diff(dayjs(value), 'years')
    const description = findDescription(field, study)
    const radioGroupName = uuid4()
    const [resolution, setResolution] = useState(value?.resolution || "month")
    const [key, setKey] = useState(0)
    const [selectedDate, setSelectedDate] = useState(null)
    const isProgrammaticChange = useRef(false) // used to know if the date was changed programmatically or was changed by the user

    const handleResolutionChange = (_e, { value }) => {
        setResolution(value)
    }

    const handleDateChange = (date) => {
        if (!isProgrammaticChange.current) {
            setSelectedDate(date)
        } else {
            isProgrammaticChange.current = false
        }
    }

    const getFormat = () => {
        let format = ""
        switch (resolution) {
            case "year":
                format = "yyyy"
                break
            case "day":
                format = "dd/MM/yyyy"
                break
            default:
                format = "MM/yyyy"
        }
        return format
    }

    useEffect(() => {
        isProgrammaticChange.current = true
        if (value?.value && selectedDate !== value?.value) {
            setSelectedDate(new Date(value.value))
            updateValue({
                target: {
                    name: field.name,
                    value: {
                        value: new Date(value.value),
                        resolution: resolution
                    }
                }
            })
        }
    }, [value])

    useEffect(() => {
        setKey((prevKey) => prevKey + 1)
    }, [resolution])

    useEffect(() => {
        if(!isProgrammaticChange.current && selectedDate !== null) {
            selectedDate?.setHours(0,0,0,0)
            const recheckValueValidation = validator?.safeParse(selectedDate);        
            if (recheckValueValidation?.success) {
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
                    value: {
                        value: selectedDate,
                        resolution: resolution
                    }
                }
            })
        } else if (isProgrammaticChange.current) {
            updateErrorMessage({
                [field.name]: null,
            });
        }
    }, [selectedDate])

    return (
        <>
            <Form.Field>
                <Radio 
                    label="Year"
                    name={radioGroupName}
                    value="year"
                    checked={resolution === "year"}
                    disabled={isDisabled}
                    onChange={handleResolutionChange}
                    style={{margin: '5px'}}
                />
                <Radio 
                    label="Month"
                    name={radioGroupName}
                    value="month"
                    checked={resolution === "month"}
                    disabled={isDisabled}
                    onChange={handleResolutionChange}
                    style={{margin: '5px'}}
                />
                <Radio 
                    label="Day"
                    name={radioGroupName}
                    value="day"
                    checked={resolution === "day"}
                    disabled={isDisabled}
                    onChange={handleResolutionChange}
                    style={{margin: '5px'}}
                />
            </Form.Field>
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
                    key={key}
                    selected={selectedDate}
                    onChange={handleDateChange}
                    date={selectedDate}
                    dateFormat={getFormat()}
                    showYearPicker={resolution === 'year'}
                    showMonthYearPicker={resolution === 'month'}
                    placeholderText={field.placeholder}
                    isClearable
                    readOnly={isReadonly}
                    utcOffset={0}
                />
            </Form.Field>
        </>
        
    )
}

export function InputField({ field, study, label, value, isDisabled, isReadonly, errorMessage, validator, updateErrorMessage, updateValue }) {
    const description = findDescription(field, study)
    const [dataList, setDataList] = useState([])
    const useDataList = field.api || (field.set && Array.isArray(field.set))

    // call the api if needed
    useEffect(() => {
        const getDataList= async (field) => {
            let datalist = []
            if (field.api) {
                // must ensure that the API call returns an array of strings
                const json = await fetch(field.api.url).then((res) => res.json())
                if (Array.isArray(json) && typeof json[0] === "object") {
                    datalist = json.map((item) => item[field.api.property])
                } else if(Array.isArray(json)) {
                    datalist = json
                }
            } else if (field.set) { // we can also set the datalist to a previously saved list of values in the "set" property
                datalist = field.set
            }
            setDataList(datalist)
        }
        getDataList(field)
    }, [])

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
                list={useDataList ? field.name : null}
            />
            {
                useDataList
                ? 
                <datalist id={field.name}>
                    {
                        dataList.map((data) => <option key={`Option-${data}`} value={data}>{data}</option>)
                    }
                </datalist>
                : <></>
            }
        </Form.Field>
    )
}