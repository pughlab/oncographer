import React, { useContext } from "react"
import { LoadingSegment } from "../../common/LoadingSegment"
import { Divider, Header, Table, Icon, List } from "semantic-ui-react"
import { useQuery } from "@apollo/client"

import { toTitle, toDateString } from './utils'
import { FindSubmissions } from "../queries/query"
import { BasicErrorMessage } from "../../common/BasicErrorMessage"
import { ActiveSubmissionContext } from "../../Portal"

export function SubmissionTable({
    formID,
    formIDKeys,
    headers,
    patientIdentifier,
    fillForm
}) {
    const { setActiveSubmission } = useContext(ActiveSubmissionContext)
    
    const submissionSearchInfo = {
        form_id: formID,
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
        },
        fetchPolicy: "network-only"
    })

    if (submissionsLoading) {
        return <LoadingSegment />
    }

    if (submissionsError) {
        return <BasicErrorMessage />
    }

    if (submissionsInfo.submissions.length === 0) return <></>

    return (
        <>
            <Divider hidden />
            <Divider horizontal>
                <Header as="h4">
                    <Icon name="send" />
                    SUBMISSIONS
                </Header>
            </Divider>
            <SubmissionTableContents 
                submissions={submissionsInfo.submissions}
                idKeys={formIDKeys}
                headers={headers}
                fillForm={fillForm}
                setActiveSubmission={setActiveSubmission}
                patientIdentifier={patientIdentifier}
            />
        </>
    )
}

const SubmissionTableContents = ({ submissions, idKeys, headers, fillForm, setActiveSubmission, patientIdentifier }) => {

    // regex to determine a date in the YYYY-MM-DD format
    // It will also match anything after the YYYY-MM-DD match,
    // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m

    return (
        <Table fixed selectable aria-labelledby="header" striped>
            <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>
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
                        submissions.map((submission: any) => {
                            const row: any = {}
                            submission.fields.forEach((field) => {
                                row[field["key"]] = field["value"]
                            })
                            Object.keys(submission.patient).forEach((key) =>{
                                row[key] = submission.patient[key]
                            })
                            const formData = {
                                patientID: patientIdentifier,
                                formIDs: idKeys.reduce((obj, key) => {
                                    return {
                                        ...obj,
                                        [submission.fields[key]]: submission.fields['value']
                                    }
                                }, {}),
                                fields: submission.fields
                                    .filter((field) => !idKeys.includes(field['key']))
                                    .reduce((obj, field) => {
                                        return {
                                            ...obj,
                                            [field['key']]: re.test(field['value']) 
                                                ? new Date(field['value']) 
                                                : field['value']
                                        }
                                    }, {})
                            }
                            return (
                                <Table.Row key={submission.submission_id} onClick={() => { fillForm(formData); setActiveSubmission(submission) }}>
                                    {
                                        Object.keys(headers).map((key) => {
                                            let value = row.hasOwnProperty(key) ? row[key]: ""

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
                                                <Table.Cell key={`${submission.submission_id}-${key}-${value}`}>
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
    )
}