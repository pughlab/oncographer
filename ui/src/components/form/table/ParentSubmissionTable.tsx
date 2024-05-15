import React, { useContext, useEffect } from "react"
import { LoadingSegment } from "../../common/LoadingSegment"
import { Divider, Header, Table, Icon, List } from "semantic-ui-react"
import { useQuery } from "@apollo/client"

import { toTitle, toDateString } from './utils'
import { findDisplayName } from '../utils'
import { FindSubmissions, ParentForm, FieldData } from "../queries/query"
import { BasicErrorMessage } from "../../common/BasicErrorMessage"
import { ActiveSubmissionContext } from "../../Portal"

export function ParentSubmissionTable({
    formID,
    patientIdentifier,
    displayNames
}) {
    const { activeSubmission, setActiveSubmission } = useContext(ActiveSubmissionContext)

    const {
        loading: parentLoading,
        error: parentError,
        data: parentForm
    } = useQuery(ParentForm, {
        variables: {
            id: formID
        }
    })

    const {
        loading: fieldsLoading,
        error: fieldsError,
        data: fields,
        refetch: refetchFields
    } = useQuery(FieldData, {
        variables: {
            id: parentForm?.ParentForm.form_id,
            study: patientIdentifier.study
        },
        skip: !parentForm
    })

    const submissionSearchInfo = {
        form_id: parentForm?.ParentForm.form_id,
        patient: {
            patient_id: patientIdentifier.submitter_donor_id,
            program_id: patientIdentifier.program_id,
            study: patientIdentifier.study
        }
    }

    const {
        loading: submissionsLoading,
        error: submissionsError,
        data: submissionsInfo,
        refetch: refetchSubmissions
    } = useQuery(FindSubmissions, {
        variables: {
            where: submissionSearchInfo
        },
        skip: !parentForm
    })

    useEffect(() => {
        if (parentForm && !fieldsLoading) {
            refetchFields()
        }
        if (parentForm && !submissionsLoading) {
            refetchSubmissions()
        }
    }, [parentForm, fieldsLoading, submissionsLoading, refetchFields, refetchSubmissions])

    if (parentLoading || submissionsLoading || fieldsLoading) {
        return <LoadingSegment />
    }

    if (parentError || submissionsError || fieldsError) {
        return <BasicErrorMessage />
    }

    if (!parentForm || !fields || submissionsInfo.submissions.length === 0) return <></>

    // regex to determine a date in the YYYY-MM-DD format
    // It will also match anything after the YYYY-MM-DD match,
    // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m
    
    // set names for the fields as table headers
    const excludedHeaders = ['__typename', 'patient_id', 'study'] // prevent these fields from showing on the table
    const headers = {}
    Object.keys(patientIdentifier).forEach((key) => {
        headers[key] = displayNames[key] ?? toTitle(key, "_")
    })
    fields.GetFormFields.forEach((field) => {
        headers[field['name']] = displayNames[field['name']] ?? findDisplayName(field, patientIdentifier.study, submissionsInfo.submissions[0], parentForm.ParentForm)
    })
    excludedHeaders.forEach((header) => {
        delete headers[header]
    })

    return (
        <>
            <Divider hidden />
            <Divider horizontal>
                <Header as="h4">
                    <Icon name="folder open" />
                    PARENT SUBMISSIONS
                </Header>
            </Divider>
            <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>
                <Table fixed selectable aria-labelledby="header" striped>
                    <Table.Header>
                        <Table.Row>
                            {
                                Object.values(headers).map((header: any) => {
                                    return <Table.HeaderCell key={header}>{toTitle(header)}</Table.HeaderCell>
                                })
                            }
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {
                            submissionsInfo.submissions.map((submission: any) => {
                                const row: any = {}
                                const isActive: boolean = activeSubmission === submission
                                submission.fields.forEach((field) => {
                                    row[field["key"]] = field["value"]
                                })
                                Object.keys(submission.patient).forEach((key) =>{
                                    row[key] = submission.patient[key]
                                })
                                return (
                                    <Table.Row
                                        key={submission.submission_id}
                                        onClick={() => { setActiveSubmission(submission) }}
                                        active={isActive}
                                    >
                                        {
                                            Object.keys(headers).map((field) => {
                                                let value = row.hasOwnProperty(field) ? row[field]: ""

                                                const isDate = re.test(value)

                                                if (isDate) {
                                                    value = toDateString(value)
                                                } else if (Array.isArray(value)) {
                                                    value = (
                                                        <List>{ 
                                                            value.map(
                                                                (item) => <List.Item key={item}>{item}</List.Item>
                                                            )
                                                        }</List>)
                                                }

                                                return (
                                                    <Table.Cell key={`${submission.submission_id}-${field}-${value}`}>
                                                        {value}
                                                    </Table.Cell>
                                                )
                                            })
                                        }
                                    </Table.Row>
                                )
                            })
                        }
                    </Table.Body>
                </Table>
            </div>
        </>
    )
}