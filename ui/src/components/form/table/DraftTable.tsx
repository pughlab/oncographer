import * as React from 'react'
import { Button, Table } from 'semantic-ui-react'
import { useMutation } from '@apollo/client'
import { toTitle, toDateString } from './utils'
import { DeleteDraft } from '../queries/query'

export const DraftTable = ({ drafts, headers, patientIdentifier, updateGlobalFormState, setDrafts }) => {

  let table = null
  const [deleteDraft] = useMutation(DeleteDraft)

  const removeDraft = (draft) => {
    deleteDraft({
      variables: {
        where: {
          'draft_id': draft.draft_id
        }
      }
    })
    alert('Draft deleted')
    setDrafts(drafts.filter((currentDraft) => currentDraft.draft_id !== draft.draft_id))
  }

  if (drafts.length > 0) { // valid results, create the table

    // regex to determine a date in the YYYY-MM-DD format
    // It will also match anything after the YYYY-MM-DD match,
    // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m

    table = (
      <div style={{overflowX: 'auto'}}>
        <Table fixed selectable aria-labelledby="header" striped>
          <Table.Header>
            <Table.Row>
              {
                Object.values(headers).map((header) => {
                  return <Table.HeaderCell key={header}>{toTitle(header)}</Table.HeaderCell>
                })
              }
              <Table.HeaderCell key="Delete" textAlign='center'>Delete</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {
              drafts.map((draft) => {
                const data = JSON.parse(draft.data) // the data that is used to save the draft
                const row = { // the visual representation of the full draft
                  ...patientIdentifier,
                  ...data
                }

                // convert date-like strings to Date objects
                // and empty strings to null
                Object.keys(data).forEach((key) => {
                  const isDate = re.test(data[key])
                  if (isDate) {
                    data[key] = new Date(data[key])
                  } else if (data[key] === "") {
                    data[key] = null
                  }
                })

                return (
                <>
                  <Table.Row key={draft.draft_id} onClick={() => {
                    updateGlobalFormState(data)
                  }}>{
                    Object.keys(headers).map((key) => {
                      let value = row.hasOwnProperty(key) ? row[key] : ""

                      const isDate = re.test(value)
                      
                      // transform the cell's value for better reading if necessary
                      if (isDate) {
                        value = toDateString(value)
                      } else if (Array.isArray(value)) {
                        value = value.join(', ')
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
                      <Button negative icon='trash' onClick={() => {removeDraft(draft)}} />
                    </Table.Cell>
                  </Table.Row>
                </>)
              })
            }
          </Table.Body>
        </Table>
      </div>
    )
  } else { // invalid results, return an empty tag
    table = (
      <>
      </>
    )
  }

  return table
}
