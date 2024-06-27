import React, { useContext } from "react"
import { LoadingSegment } from "../../common/LoadingSegment"
import { Divider, Header, Table, Icon, List, Button, Accordion } from "semantic-ui-react"
import { gql, useMutation, useQuery } from "@apollo/client"

import { toTitle, toDateString } from './utils'
import { FindSubmissions, DeleteSubmission } from "../queries/query"
import { BasicErrorMessage } from "../../common/BasicErrorMessage"
import { ActiveSubmissionContext } from "../../Portal"
import { defaultStudy } from "../../../App"

export function SubmissionTable({
    formID,
    formIDKeys,
    headers,
    patientIdentifier,
    fillForm,
    setLastSubmissionUpdate
}) {
    const [isActive, setActive] = React.useState(true)
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
            <Accordion>
                <Accordion.Title active={isActive} onClick={() => setActive(!isActive)}>
                    <Icon name="dropdown" />
                    <Divider horizontal style={{ display: 'inline-block' }}>
                        <Header as="h4">
                            <Icon name="send" />
                            SUBMISSIONS
                        </Header>
                    </Divider>
                </Accordion.Title>
                <Accordion.Content active={isActive}>
                    <SubmissionTableContents 
                        submissions={submissionsInfo.submissions}
                        idKeys={formIDKeys}
                        headers={headers}
                        fillForm={fillForm}
                        setActiveSubmission={setActiveSubmission}
                        patientIdentifier={patientIdentifier}
                        setLastSubmissionUpdate={setLastSubmissionUpdate}
                    />
                </Accordion.Content>
            </Accordion>
        </>
    )
}

const SubmissionTableContents = ({ submissions, idKeys, headers, fillForm, setActiveSubmission, patientIdentifier, setLastSubmissionUpdate }) => {

    // storage for the table's contents
    let rows: any[] = []

    const [deleteSubmission] = useMutation(DeleteSubmission)
    const { data } = useQuery(gql`
        query {
            isAdmin
        }
    `)

    const doDelete = (submissionID) => {
        deleteSubmission({
            variables: {
                where: {
                    'submission_id': submissionID
                }
            },
            onCompleted: () => {
                alert('Submission deleted!')
                rows = rows.filter((row) => row.id !== submissionID)
                setLastSubmissionUpdate(`Submissions-${new Date().toUTCString()}`)
            }
        })
    }

    // creates a representation of the submission that can be used to fill
    // the form's fields in the FormGenerator component with the submission's data
    const createFormData = (row) => {
        const cleanRow = { ...row }
        delete cleanRow.id
        const formData = {
            patientID: patientIdentifier,
            formIDs: idKeys.reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: row[key]
                }
            }, {}),
            fields: Object.keys(cleanRow)
                .filter((key) => !idKeys.includes(key))
                .reduce((obj, key) => {
                    return {
                        ...obj,
                        [key]: re.test(row[key]) 
                            ? new Date(row[key]) 
                            : row[key]
                    }
                }, {})
        }
        return formData
    }

    // fill the table's row data from the submission data
    submissions.forEach((submission: any) => {
        const row: any = {}
        row.id = submission.submission_id
        submission.fields.filter((field) => field.key !== '__typename').forEach((field) => {
            row[field["key"]] = field["value"]
        })
        Object.keys(submission.patient).filter((key) => key !== '__typename').forEach((key) =>{
            row[key] = submission.patient[key]
        })
        rows.push(row)
        console.log(submission)
        console.log(rows)
    })

    // regex to determine a date in the YYYY-MM-DD format
    // It will also match anything after the YYYY-MM-DD match,
    // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m

    return data ? (
        <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>
            <Table fixed selectable aria-labelledby="header" striped key={rows.length}>
                <Table.Header>
                    <Table.Row>
                        {
                            Object.values(headers).map((header: any) => {
                                return <Table.HeaderCell key={header}>{toTitle(header)}</Table.HeaderCell>
                            })
                        }
                        { data.isAdmin ? <Table.HeaderCell key="delete">Delete</Table.HeaderCell> : <></> }
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {
                        rows.map((row: any, index) => {
                            return (
                                <Table.Row key={`${row.id}-${index}`} onClick={() => { 
                                    fillForm(createFormData(row)); 
                                    setActiveSubmission(submissions.find((sub) => sub.submission_id === row.id)) 
                                }}>
                                    {
                                        Object.keys(headers).map((key) => {
                                            let value = row.hasOwnProperty(key) ? row[key]: ""

                                            const isDate = re.test(value)

                                            if (isDate) {
                                                value = toDateString(value, patientIdentifier.study !== defaultStudy)
                                            } else if (Array.isArray(value)) {
                                                value = (
                                                    <List>{ 
                                                        value.map(
                                                            (item) => <List.Item key={item}>{item}</List.Item>
                                                        )
                                                    }</List>)
                                            }

                                            return (
                                                <Table.Cell key={`${row.id}-${key}-${value}`}>
                                                    {value}
                                                </Table.Cell>
                                            )
                                        })
                                    }
                                    {
                                        data.isAdmin 
                                        ? <Table.Cell key={`delete-${row.id}`}>
                                            <Button icon="trash" color="red" onClick={() => doDelete(row.id)} />
                                        </Table.Cell>
                                        : <></>
                                    }
                                </Table.Row>
                            )
                        })
                    }
                </Table.Body>
            </Table>
        </div>
    ) : <></>
}