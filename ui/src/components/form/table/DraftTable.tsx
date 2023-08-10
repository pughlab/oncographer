import * as React from 'react'
import { Button, Divider, Header, Icon, List, Table } from 'semantic-ui-react'
import { useMutation, useQuery } from '@apollo/client'
import { toTitle, toDateString } from './utils'
import { LoadingSegment } from "../../common/LoadingSegment";
import { FindDraft, DeleteDraft } from '../queries/query'
import { BasicErrorMessage } from '../../common/BasicErrorMessage';

type DraftSearchInfo = {
  form_id: String,
  patient_id: String,
  secondary_ids?: String
}

export function DraftTable({ 
  formID,
  headers,
  patientIdentifier,
  setLastDraftUpdate,
  fillForm
}) {
  // attempt to find drafts for the current form/patient combination
  const draftInfo: DraftSearchInfo = { 
    form_id: formID,
    patient_id: JSON.stringify(patientIdentifier)
  }

  const { loading: draftsLoading, error: draftsError, data: drafts } = useQuery(FindDraft, {
    variables: {
      where: draftInfo
    },
    fetchPolicy: "network-only"
  })

  if (draftsLoading) {
    return <LoadingSegment />
  }

  if (draftsError) {
    return <BasicErrorMessage />
  }

  return (
    <>
      <Divider hidden />
      <Divider horizontal>
        <Header as="h4">
          <Icon name="save" />
          DRAFTS
        </Header>
      </Divider>
      <DraftTableContents
        drafts={drafts.formDrafts}
        setLastDraftUpdate={setLastDraftUpdate}
        headers={headers}
        fillForm={fillForm}
      />
    </>
  )
}

const DraftTableContents = ({ drafts, headers, setLastDraftUpdate, fillForm }) => {

  let table = null
  const [deleteDraft] = useMutation(DeleteDraft)

  const removeDraft = (draft) => {
    deleteDraft({
      variables: {
        where: {
          'draft_id': draft.draft_id
        }
      },
      onCompleted: () => {
        alert('Draft deleted')
        setLastDraftUpdate(new Date().toUTCString())
      }
    })
  }

  if (drafts.length > 0) { // valid results, create the table

    // regex to determine a date in the YYYY-MM-DD format
    // It will also match anything after the YYYY-MM-DD match,
    // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m

    table = (
      <Table fixed selectable aria-labelledby="header" striped>
        <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>

          <Table.Header>
            <Table.Row>
              {
                Object.values(headers).map((header: any) => {
                  return <Table.HeaderCell key={header}>{toTitle(header)}</Table.HeaderCell>
                })
              }
              <Table.HeaderCell key="Delete" textAlign='center'>Delete</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {
              drafts.map((draft) => {
                const patientId = JSON.parse(draft.patient_id)
                const secondaryIds = JSON.parse(draft.secondary_ids) || {}
                const data = JSON.parse(draft.data) // the data that is used to save the draft
                const ids = {
                  ...patientId,
                  ...secondaryIds
                }
                const row = { // the visual representation of the full draft
                  ...ids,
                  ...data
                }

                // convert date-like strings to Date objects
                // and empty strings to null
                transformData(data, re)

                return (
                  <Table.Row key={draft.draft_id} onClick={() => {
                    fillForm({
                      fields: data,
                      patientID: patientId,
                      formIDs: secondaryIds
                    })
                  }}>{
                      Object.keys(headers).map((key) => {
                        let value = row.hasOwnProperty(key) ? row[key] : ""

                        const isDate = re.test(value)

                        // transform the cell's value for better reading if necessary
                        if (isDate) {
                          value = toDateString(value)
                        } else if (Array.isArray(value)) {
                          value = <List>{ value.map((item) => <List.Item key={item}>{item}</List.Item>) }</List>
                        }

                        return (
                          <Table.Cell
                            key={`${draft.draft_id}-${key}-${value}`}
                          >
                            { value }
                          </Table.Cell>
                        )
                      })
                    }
                    <Table.Cell key={`${draft.draft_id}-delete`} textAlign="center">
                      <Button negative icon='trash' onClick={() => { removeDraft(draft) }} />
                    </Table.Cell>
                  </Table.Row>
                )
              })
            }
          </Table.Body>
        </div>
      </Table>
    )
  } else { // invalid results, return an empty tag
    table = (
      <>
      </>
    )
  }

  return table
}

function transformData(data: any, re: RegExp) {
  Object.keys(data).forEach((key) => {
    const isDate = re.test(data[key])
    if (isDate) {
      data[key] = new Date(data[key])
    } else if (data[key] === "") {
      data[key] = null
    }
  })
}
