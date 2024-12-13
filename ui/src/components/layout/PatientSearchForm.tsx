import React, { useContext, useEffect, useState } from 'react'
import { Icon, Form, Segment, Divider, Header } from 'semantic-ui-react'
import { useLazyQuery } from '@apollo/client'

import { PatientFoundContext, PatientIdentifierContext } from '../Portal'
import { FindPatients } from '../form/queries/query'

import keycloak from '../../keycloak/keycloak'
import { defaultStudy } from '../../App'

let studies : { key: string, text: string, value: string }[] = [{ key: '', text: 'Please select a study', value: ''}]

const PatientSearchForm = () => {
  const adminRoles = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES)
  const { patientIdentifier, setPatientIdentifier } = useContext(PatientIdentifierContext)
  const { setPatientFound } = useContext(PatientFoundContext)
  const [submitterDonorId, setSubmitterDonorId] = useState('')
  const [programId, setProgramId] = useState('')
  const [patientWasFound, setPatientWasFound] = useState(false)
  const [findPatient] = useLazyQuery(FindPatients, {
    variables: {
      where:  {
        patient_id: patientIdentifier.submitter_donor_id,
        program_id: patientIdentifier.program_id,
        study: patientIdentifier.study
      }
    },
    onCompleted: (data) => {
      setPatientWasFound(data.patients.length > 0)
    }
  })

  function mustFindPatient() {
    return Object.values(patientIdentifier).reduce((acc, value) => acc && value.trim() !== '', true)
  }

  function handleKeyDown(event, value) {
    if (event.keyCode === 13) {
      event.preventDefault()
      setPatientIdentifier((id) => ({ ...id, ...value }))
    }
  }

  useEffect(() => {
    const roles = keycloak?.tokenParsed?.resource_access[process.env.KEYCLOAK_SERVER_CLIENT]?.roles || []
    if (roles?.length > 0) {
      roles.filter((role) => !adminRoles.includes(role)).forEach((role: string) => {
        studies.push({ key: role, text: role.toUpperCase(), value: role })
      })
    }
  }, []) // fill out the study select with permitted roles

  useEffect(() => {
    if (mustFindPatient()) {
      findPatient()
    }
  }, [patientIdentifier])

  useEffect(() => {
    setPatientFound(patientWasFound)
  }, [patientWasFound]) // notify whether a patient was found or not only after this component has finished rendering

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
            placeholder={'Study'}
            value={patientIdentifier.study}
            onChange={(_e, { value }) => { setPatientIdentifier((id) => ({ ...id, study: value })) }}
          />
          <Form.Input
            width={4}
            value={submitterDonorId}
            icon='id card outline'
            iconPosition='left'
            type='text'
            placeholder={patientIdentifier.study !== defaultStudy && patientIdentifier.study.trim() !== '' ? 'Submitter Participant ID' : 'Submitter Donor ID'}
            onChange={(e) => { setSubmitterDonorId(e.target.value)}}
            onBlur={() => { setPatientIdentifier((id) => ({ ...id, submitter_donor_id: submitterDonorId })) }}
            onKeyDown={(event) => {handleKeyDown(event, {submitter_donor_id: event.target.value} )}}
          />
          <Form.Input
            width={4}
            value={programId}
            icon='id card outline'
            iconPosition='left'
            type='text'
            placeholder='Program ID'
            onChange={(e) => { setProgramId(e.target.value)}}
            onBlur={() => { setPatientIdentifier((id) => ({ ...id, program_id: programId })) }}
            onKeyDown={(event) => {handleKeyDown(event, {program_id: event.target.value} )}}
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