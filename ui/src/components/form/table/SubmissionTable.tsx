import React, { useContext, useEffect } from "react"
import { LoadingSegment } from "../../common/LoadingSegment"
import { Divider, Header, Table, Icon, List, Button, Accordion } from "semantic-ui-react"
import { gql, useMutation, useQuery } from "@apollo/client"

import { toTitle, toDateString } from './utils'
import { FindSubmissions, DeleteSubmission } from "../dynamic_form/queries/form"
import { BasicErrorMessage } from "../../common/BasicErrorMessage"
import { ActiveSubmissionContext } from "../../Portal"

export function SubmissionTable({
    formID,
    headers,
    patientIdentifier,
    clearForm,
    fillForm,
    reload,
    setLastSubmissionUpdate,
    setOpenModal,
    setModalTitle,
    setModalContent,
    setModalError
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
        data: submissionsInfo,
        refetch
    } = useQuery(FindSubmissions, {
        variables: {
            where: submissionSearchInfo
        },
        fetchPolicy: "no-cache"
    })

    useEffect(() => {
        if(reload) {
            refetch()
        }
    }, [reload, refetch])

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
                        headers={headers}
                        refetch={refetch}
                        clearForm={clearForm}
                        fillForm={fillForm}
                        setActiveSubmission={setActiveSubmission}
                        setLastSubmissionUpdate={setLastSubmissionUpdate}
                        setOpenModal={setOpenModal}
                        setModalTitle={setModalTitle}
                        setModalContent={setModalContent}
                        setModalError={setModalError}
                    />
                </Accordion.Content>
            </Accordion>
        </>
    )
}

const SubmissionTableContents = ({
    submissions,
    headers,
    refetch,
    clearForm,
    fillForm,
    setActiveSubmission,
    setLastSubmissionUpdate,
    setOpenModal,
    setModalTitle,
    setModalContent,
    setModalError
}) => {

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
                refetch()
                console.log('Submission deleted')
                setLastSubmissionUpdate()
                setModalTitle('Success')
                setModalContent('The submission was deleted.')
                setModalError(false)
                setOpenModal(true)
            },
            onError: () => {
                console.log('Submission not deleted')
                setModalTitle('Error')
                setModalContent('There was an error while deleting the submission, please try again.')
                setModalError(true)
                setOpenModal(true)
            }
        })
    }

    // fill the table's row data from the submission data
    submissions.forEach((submission: any) => {
        const row: any = {}
        submission.fields.filter((field) => field.key !== '__typename').forEach((field) => {
            row[field["key"]] = field["value"]
        })
        row.id = submission.submission_id
        Object.keys(submission.patient).filter((key) => key !== '__typename').forEach((key) =>{
            row[key] = submission.patient[key]
        })
        rows.push(row)
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
                                    clearForm()
                                    fillForm(row); 
                                    setActiveSubmission(submissions.find((sub) => sub.submission_id === row.id)) 
                                }}>
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