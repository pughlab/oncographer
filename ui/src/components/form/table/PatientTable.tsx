import React from "react"
import { useQuery } from "@apollo/client"
import { Accordion, Divider, Header, Icon, List, Table } from "semantic-ui-react"

import { toTitle, toDateString } from './utils'
import { DisplayNamesContext } from "../../layout/FormFactory"
import { RootForm, FindSubmissions } from "../queries/query"
import { LoadingSegment } from "../../common/LoadingSegment"
import { BasicErrorMessage } from "../../common/BasicErrorMessage"
import { defaultStudy } from "../../../App"

export function PatientTable({ patientIdentifier }) {
    const [isActive, setActive] = React.useState(true)
    const { displayNames } = React.useContext(DisplayNamesContext)
    const { loading: rootFormLoading, error: rootFormError, data: rootForm } = useQuery(RootForm, {
        variables: {
            study: patientIdentifier.study
        }
    })

    const { loading: submissionsLoading, error: submissionsError, data: submissions } = useQuery(FindSubmissions, {
        variables: {
            where: {
                form_id: rootForm?.GetRootForm.form_id,
                patient: {
                    patient_id: patientIdentifier.submitter_donor_id,
                    program_id: patientIdentifier.program_id,
                    study: patientIdentifier.study
                }
            }
        },
        skip: !rootForm
    })

    if (rootFormLoading || submissionsLoading) return <LoadingSegment />

    if (rootFormError || submissionsError) return <BasicErrorMessage />

    if (!(rootForm && submissions && submissions.submissions.length > 0)) return <></>

    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m
    const excludedHeaders = ['__typename', 'patient_id', 'study'] // prevent these fields from showing on the table
    const headers: any = {}

    Object.keys(patientIdentifier).forEach((key) => {
        headers[key] = displayNames[key] ?? key
    })
    submissions.submissions[0].fields.forEach((field) => {
        headers[field["key"]] = displayNames[field["key"]] ?? field["key"]
    })
    excludedHeaders.forEach((header) => {
        delete headers[header]
    })

    return (
        <>
            <Divider hidden />
            <Accordion>
                <Accordion.Title active={isActive} onClick={()=> setActive(!isActive)}>
                    <Icon name="dropdown" />
                    <Divider horizontal style={{ display: 'inline-block' }}>
                        <Header as="h4">
                            <Icon name="user circle" />
                            { patientIdentifier.study.toLowerCase() === defaultStudy ? "DONOR": "PARTICIPANT" } INFORMATION
                        </Header>
                    </Divider>
                </Accordion.Title>
                <Accordion.Content active={isActive}>
                    <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>
                        <Table fixed selectable aria-labelledby="header" striped>
                            <Table.Header>
                                <Table.Row>
                                    {
                                        Object.values(headers).map((header: any) => <Table.HeaderCell key={header}>{String(header).includes("_") ? toTitle(header, "_") : toTitle(header)}</Table.HeaderCell>)
                                    }
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {
                                    submissions.submissions.map((submission) => {
                                        const row: any = {}
                                        submission.fields.forEach((field) => {
                                            row[field["key"]] = field["value"]
                                        })
                                        Object.keys(submission.patient).forEach((key) =>{
                                            row[key] = submission.patient[key]
                                        })
                                        return (
                                            <Table.Row key={submission.submission_id}>
                                                {
                                                    Object.keys(headers).map((field) => {
                                                        let value = row.hasOwnProperty(field) ? row[field] : ""
                                                        const isDate = (value.resolution && re.test(value.value)) ?? re.test(value)

                                                        if (isDate) {
                                                            value = toDateString(value)
                                                        } else if (Array.isArray(value)) {
                                                            value = (
                                                                <List>{
                                                                    value.map((item) => <List.Item key={item}>{item}</List.Item>)
                                                                }</List>
                                                            )
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
                </Accordion.Content>
            </Accordion>
        </>
    )
}