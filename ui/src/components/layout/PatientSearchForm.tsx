import React, { useContext, useEffect } from 'react'
import { Icon, Form, Segment, Divider, Header } from 'semantic-ui-react'
import { useLazyQuery } from '@apollo/client'

import { PatientFoundContext, PatientIdentifierContext } from '../Portal'
import { FindPatients } from '../form/queries/query'

import keycloak from '../../keycloak/keycloak'
import { defaultStudy } from '../../App'

let studies : { key: string, text: string, value: string }[] = []

function ignoreEnter(event) {
  if (event.keyCode === 13) {
    event.preventDefault()
  }
}

const PatientSearchForm = () => {
  const adminRoles = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES)
  const { patientIdentifier, setPatientIdentifier } = useContext(PatientIdentifierContext)
  const { setPatientFound } = useContext(PatientFoundContext)
  const [findPatient] = useLazyQuery(FindPatients, {
    variables: {
      where:  {
        patient_id: patientIdentifier.submitter_donor_id,
        program_id: patientIdentifier.program_id,
        study: patientIdentifier.study
      }
    },
    onCompleted: (data) => {
      setPatientFound(data.patients.length > 0)
    }
  })

  useEffect(() => {
    const roles = keycloak?.tokenParsed?.resource_access[process.env.KEYCLOAK_SERVER_CLIENT]?.roles || []
    if (roles?.length > 0) {
      roles.filter((role) => !adminRoles.includes(role)).forEach((role: string) => {
        studies.push({ key: role, text: role.toUpperCase(), value: role })
      })
    }
  }, []) // set the default study when first loading the form

  useEffect(() => {
    if (patientIdentifier.study !== "") {
      findPatient()
    }
  }, [patientIdentifier]) // search patients every time the patient's information changes

  return (
    <Segment color='teal'>
      <Divider horizontal>
        <Header as='h4'>
          <Icon name='search' />
          SEARCH
        </Header>
      </Divider>
      <Form size="large">
        <Form.Group widths={"equal"}>
          <Form.Select
            width={4}
            options={studies}
            placeholder={studies.length > 0 ? 'Study' : ''}
            onChange={(_e, { value }) => { setPatientIdentifier((id) => ({ ...id, study: value })) }}
          />
          <Form.Input
            width={4}
            value={patientIdentifier.submitter_donor_id}
            icon='id card outline'
            iconPosition='left'
            type='text'
            placeholder={patientIdentifier.study !== defaultStudy ? 'Submitter Participant ID' : 'Submitter Donor Id'}
            onChange={(e) => { setPatientIdentifier((f) => ({ ...f, submitter_donor_id: e.target.value })) }}
            onKeyDown={ignoreEnter}
          />
          <Form.Input
            width={4}
            value={patientIdentifier.program_id}
            icon='id card outline'
            iconPosition='left'
            type='text'
            placeholder='Program Id'
            onChange={(e) => { setPatientIdentifier((f) => ({ ...f, program_id: e.target.value })) }}
            onKeyDown={ignoreEnter}
          />
          <Form.Button
            size='large' 
            onClick={
              () => { setPatientIdentifier({ submitter_donor_id: '', program_id: '', study: '' }) }
            }
            fluid
            inverted
            icon='trash'
            color='red'
            content='CLEAR SEARCH'
            width={2}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}

export default PatientSearchForm