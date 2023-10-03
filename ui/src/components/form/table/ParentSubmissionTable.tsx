import React, { useContext } from "react"
import { LoadingSegment } from "../../common/LoadingSegment"
import { Divider, Header, Table, Icon, List } from "semantic-ui-react"
import { useQuery } from "@apollo/client"

import { toTitle, toDateString } from './utils'
import { FindSubmissions } from "../queries/query"
import { BasicErrorMessage } from "../../common/BasicErrorMessage"
import { ActiveSubmissionContext } from "../../Portal"

export function ParentSubmissionTable({
    formID,
    patientIdentifier
}) {
    const { activeSubmission, setActiveSubmission } = useContext(ActiveSubmissionContext)
    
    const submissionSearchInfo = {
        form_id: activeSubmission ? activeSubmission.form_id :formID,
        patient: {
            patient_id: patientIdentifier.submitter_donor_id,
            program_id: patientIdentifier.program_id,
            study: patientIdentifier.study
        }
    }

    const {
        loading: submissionsLoading,
        error: submissionsError,
        data: submissionsInfo
    } = useQuery(FindSubmissions, {
        variables: {
            where: submissionSearchInfo
        }
    })

    if (submissionsLoading) {
        return <LoadingSegment />
    }

    if (submissionsError) {
        return <BasicErrorMessage />
    }

    if (submissionsInfo.submissions.length === 0) return <></>

    // regex to determine a date in the YYYY-MM-DD format
    // It will also match anything after the YYYY-MM-DD match,
    // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m
    
    // set names for the fields as table headers
    const excludedHeaders = ['__typename', 'patient_id', 'study'] // prevent these fields from showing on the table
    const headers = Array.from(new Set([
        ...Object.entries(submissionsInfo.submissions[0].patient).map(([key, _value]) => key),
        ...submissionsInfo.submissions[0].fields.map((field) => field.key)
    ].filter((header) => !excludedHeaders.includes(header))))

    return (
        <>
            <Divider hidden />
            <Divider horizontal>
                <Header as="h4">
                    <Icon name="folder open" />
                    PARENT SUBMISSIONS
                </Header>
            </Divider>
            <Table fixed selectable aria-labelledby="header" striped>
                <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>
                    <Table.Header>
                        <Table.Row>
                            {
                                headers.map((header: any) => {
                                    return <Table.HeaderCell key={header}>{toTitle(header, '_')}</Table.HeaderCell>
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
                                            headers.map((field) => {
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
                </div>
            </Table>
        </>
    )
}