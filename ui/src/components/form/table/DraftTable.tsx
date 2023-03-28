import * as React from 'react'
import { Table } from 'semantic-ui-react'
import { toTitle, toDateString } from './utils'

export const DraftTable = ({ drafts, headers, patientIdentifier, updateGlobalFormState }) => {

  let table = null

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
                headers.map((header) => {
                  return <Table.HeaderCell key={header}>{toTitle(header)}</Table.HeaderCell>
                })
              }
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {
              drafts.map((draft) => {
                const data = JSON.parse(draft.data) // the data that is used to save the draft
                const row = [ // the visual representation of the full draft
                  ...Object.values(patientIdentifier),
                  ...Object.values(data)
                ]

                // if the draft doesn't have values for all fields, fill the missing fields with empty strings
                fillEmptyFields(row, headers)

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

                return <Table.Row key={draft.draft_id} onClick={() => {
                  updateGlobalFormState(data)
                }}>{
                  row.map((cell,idx) => {
                    const isDate = re.test(cell)
                    
                    // transform the cell's value for better reading if necessary
                    let value = cell
                    if (isDate) {
                      value = toDateString(cell)
                    } else if (Array.isArray(cell)) {
                      value = cell.join(', ')
                    }

                    return (
                      <Table.Cell
                        key={`${draft.draft_id}-${headers[idx]}-${cell}`}
                      >
                        { value }
                      </Table.Cell>
                    )
                  })
                }</Table.Row>
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

function fillEmptyFields(row: unknown[], headers: string[]) {
  if (row.length < headers.length) {
    for (let idx = row.length; idx < headers.length; idx++) {
      row.push("")
    }
  }
}
