import * as React from 'react'
import { Accordion, Button, Divider, Header, Icon, List, Table } from 'semantic-ui-react'
import { useMutation, useQuery } from '@apollo/client'
import { toTitle, toDateString } from './utils'
import { LoadingSegment } from "../../common/LoadingSegment";
import { FindTemplate, DeleteTemplate } from '../queries/query'
import { BasicErrorMessage } from '../../common/BasicErrorMessage';

type TemplateSearchInfo = {
  form_id: string,
  secondary_ids?: string
}

export function TemplateTable({ 
  formID,
  headers,
  setLastTemplateUpdate,
  fillForm
}) {
  const [isActive, setActive] = React.useState(true)

  // attempt to find templates for the current form
  const templateInfo: TemplateSearchInfo = { 
    form_id: formID
  }

  const { loading: templatesLoading, error: templatesError, data: templates } = useQuery(FindTemplate, {
    variables: {
      where: templateInfo
    },
    fetchPolicy: "network-only"
  })

  if (templatesLoading) {
    return <LoadingSegment />
  }

  if (templatesError) {
    return <BasicErrorMessage />
  }

  return templates.formTemplates.length === 0 ? <></> : (
    <>
      <Divider hidden />
      <Accordion>
        <Accordion.Title active={isActive} onClick={() => setActive(!isActive)}>
          <Icon name="dropdown" />
          <Divider horizontal style={{ display: 'inline-block' }}>
            <Header as="h4">
              <Icon name="save" />
              TEMPLATES
            </Header>
          </Divider>
        </Accordion.Title>
        <Accordion.Content active={isActive}>
          <TemplateTableContents
            templates={templates.formTemplates}
            setLastTemplateUpdate={setLastTemplateUpdate}
            headers={headers}
            fillForm={fillForm}
          />
        </Accordion.Content>
      </Accordion>
    </>
  )
}

const TemplateTableContents = ({ templates, headers, setLastTemplateUpdate, fillForm }) => {

  let table = null
  const [deleteTemplate] = useMutation(DeleteTemplate)

  const removeTemplate = (template) => {
    deleteTemplate({
      variables: {
        where: {
          'template_id': template.template_id
        }
      },
      onCompleted: () => {
        alert('Template deleted')
        setLastTemplateUpdate(toDateString(new Date()))
      }
    })
  }

  if (templates.length > 0) { // valid results, create the table

    // regex to determine a date in the YYYY-MM-DD format
    // It will also match anything after the YYYY-MM-DD match,
    // so a date like "2023-02-01T05:00:00.000Z" (without the quotes) is a valid date 
    const re = /[12]\d{3}-((0[1-9])|(1[012]))-((0[1-9]|[12]\d)|(3[01]))\S*/m

    table = (
      <div style={{overflowX: 'auto', maxHeight: '500px', resize: 'vertical'}}>
        <Table fixed selectable aria-labelledby="header" striped>

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
              templates.map((template) => {
                const patientId = JSON.parse(template.patient_id)
                const secondaryIds = JSON.parse(template.secondary_ids) || {}
                const data = JSON.parse(template.data) // the data that is used to save the template
                const ids = {
                  ...patientId,
                  ...secondaryIds
                }
                const row = { // the visual representation of the full template
                  ...ids,
                  ...data
                }

                // convert date-like strings to Date objects
                // and empty strings to null
                transformData(data, re)

                return (
                  <Table.Row key={template.template_id} onClick={() => {
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
                            key={`${template.template_id}-${key}-${value}`}
                          >
                            { value }
                          </Table.Cell>
                        )
                      })
                    }
                    <Table.Cell key={`${template.template_id}-delete`} textAlign="center">
                      <Button negative icon='trash' onClick={() => { removeTemplate(template) }} />
                    </Table.Cell>
                  </Table.Row>
                )
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
