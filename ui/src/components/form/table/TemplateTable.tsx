import * as React from 'react'
import { Accordion, Button, Divider, Header, Icon, List, Table } from 'semantic-ui-react'
import { useMutation } from '@apollo/client'
import { toTitle, toDateString } from '../../utils'
import { LoadingSegment } from "../../common/LoadingSegment";
import { DeleteTemplate } from '../dynamic_form/queries/form'
import { BasicErrorMessage } from '../../common/BasicErrorMessage';
import { useFormOperations } from '../../layout/context/FormOperationsProvider';
import { useFormLabels } from '../../../hooks/useLabels';
import useTemplates from '../../../hooks/useTemplates';
import { usePatientID } from '../../layout/context/PatientIDProvider';

export function TemplateTable({ formID, templateUpdates, modalOperations }: any) {
  const [active, setActive] = React.useState(true)
  const { loading, error, data: templates, refetch } = useTemplates(formID)
  React.useEffect(() => {
    refetch()
  }, [templateUpdates])

  if (loading) {
    return <LoadingSegment />
  }

  if (error) {
    return <BasicErrorMessage />
  }

  return templates.length === 0 ? <></> : (
    <Accordion>
      <Accordion.Title active={active} onClick={() => setActive(!active)}>
        <Icon name="dropdown" />
        <Divider horizontal style={{ display: 'inline-block' }}>
          <Header as="h4">
            <Icon name="save" />
            TEMPLATES
          </Header>
        </Divider>
      </Accordion.Title>
      <Accordion.Content active={active}>
        <TemplateTableContents
          formID={formID}
          templates={templates}
          modalOperations={modalOperations}
          refetch={refetch}
        />
      </Accordion.Content>
    </Accordion>
  )
}

function TemplateTableContents({ formID, templates, modalOperations, refetch }: any) {

  let table = null
  const { setModalTitle, setModalContent, setModalError, setOpenModal } = modalOperations

  const { data: headers } = useFormLabels(formID)
  const { study } = usePatientID()
  const { clearForm, fillForm, updateTemplateDate } = useFormOperations()
  const [deleteTemplate] = useMutation(DeleteTemplate)

  if (!(clearForm && fillForm && updateTemplateDate)) {
    return <></>
  }

  const removeTemplate = (template: any) => {
    deleteTemplate({
      variables: {
        where: {
          'template_id': template.template_id
        }
      },
      onCompleted: () => {
        refetch()
        console.log('Template deleted')
        updateTemplateDate()
        setModalTitle('Success')
        setModalContent('The template has been deleted')
        setModalError(false)
        setOpenModal(true)
      },
      onError: () => {
        console.log('Template not deleted')
        setModalTitle('Error')
        setModalContent('There was an error while deleting the template, please try again')
        setModalError(true)
        setOpenModal(true)
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
                  const label = typeof header === 'object' ? header[study] ?? header.default : header
                  return <Table.HeaderCell key={label}>{toTitle(label)}</Table.HeaderCell>
                })
              }
              <Table.HeaderCell key="Delete" textAlign='center'>Delete</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {
              templates.map((template: any) => {
                const patientId = JSON.parse(template.patient_id)
                const secondaryIds = JSON.parse(template.secondary_ids) || {}
                const data = JSON.parse(template.data)
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
                    clearForm()
                    fillForm(data)
                  }}>{
                      Object.keys(headers).map((key) => {
                        let value = row.hasOwnProperty(key) ? row[key] : ""

                        const isDate = re.test(value)

                        // transform the cell's value for better reading if necessary
                        if (isDate) {
                          value = toDateString(value)
                        } else if (Array.isArray(value)) {
                          value = <List>{ value.map((item) => <List.Item key={item}>{item}</List.Item>) }</List>
                        } else if (typeof value === 'object' && value.hasOwnProperty("value")) {
                          value = re.test(value.value) ? toDateString(value.value) : ""
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
