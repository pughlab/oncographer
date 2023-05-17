import React from 'react'
import { Icon, Form, Segment, Divider, Header } from 'semantic-ui-react'

const PatientSearchForm = ({ patientIdentifier, setPatientIdentifier }) => {
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
          <Form.Input
            width={8}
            value={patientIdentifier.submitter_donor_id}
            icon='id card outline'
            iconPosition='left'
            type='text'
            placeholder='Submitter Donor Id'
            onChange={(e) => { setPatientIdentifier((f) => ({ ...f, submitter_donor_id: e.target.value })) }}
          />
          <Form.Input
            width={6}
            value={patientIdentifier.program_id}
            icon='id card outline'
            iconPosition='left'
            type='text'
            placeholder='Program Id'
            onChange={(e) => { setPatientIdentifier((f) => ({ ...f, program_id: e.target.value })) }}
          />
          <Form.Button size='large' onClick={() => { setPatientIdentifier({ submitter_donor_id: '', program_id: '' }) }} fluid inverted icon='trash' color='red' content='CLEAR FORMS' width={2} />
        </Form.Group>
      </Form>
    </Segment>
  )
}

export default PatientSearchForm