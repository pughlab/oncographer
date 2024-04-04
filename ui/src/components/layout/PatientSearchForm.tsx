import React, { useContext, useEffect } from 'react'
import { Icon, Form, Segment, Divider, Header } from 'semantic-ui-react'
import { useLazyQuery } from '@apollo/client'

import { defaultStudy } from '../../App'
import { PatientFoundContext, PatientIdentifierContext } from '../Portal'
import { FindPatients } from '../form/queries/query'

const studies = [
  { key: 'mohccn', text: 'MOHCCN', value: 'mohccn' },
  { key: 'charm', text: 'CHARM', value: 'charm'},
]

function ignoreEnter(event) {
  if (event.keyCode === 13) {
    event.preventDefault()
  }
}

const PatientSearchForm = () => {
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
    setPatientIdentifier((id) => ({ ...id, study: defaultStudy }))
  }, []) // set the default study when first loading the form

  useEffect(() => {
    findPatient()
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
            placeholder='Study'
            defaultValue={defaultStudy}
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
              () => { setPatientIdentifier({ submitter_donor_id: '', program_id: '', study: defaultStudy }) }
            }
            fluid
            inverted
            icon='trash'
            color='red'
            content='CLEAR FORMS'
            width={2}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}

export default PatientSearchForm