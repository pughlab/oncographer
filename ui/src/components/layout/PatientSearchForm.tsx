import React, { useState } from 'react'
import { Icon, Input, Button, Form, Segment, Divider, Header } from 'semantic-ui-react'

const PatientSearchForm = ({patientIdentifier, setPatientIdentifier}) => {
    const [ patientId, setPatientId ] = useState('')
    const handleChange = (e) => setPatientId(e.target.value)
    return (
        <Segment color='teal'>
        <Divider horizontal>
          <Header as='h4'>
            <Icon name='search' />
            SEARCH
          </Header>
        </Divider>
        <Form
        size="large"
        // onSubmit={(event) => {
        //   setNodeEvent("submit");
        //   onFormComplete(event);
        // }}
      >
        <Form.Group widths={"equal"}>
            <Form.Input
            width={8}

            // size='big'
            // value={uniqueIdsFormState[fld.name]}
            value={patientIdentifier.submitter_donor_id}
            icon='id card outline'
            iconPosition='left'
            type='text' 
            placeholder='Submitter Donor Id' 

            onChange={(e) => {setPatientIdentifier((f) => ({...f, submitter_donor_id : e.target.value}))}}
          />
            <Form.Input
            width={6}
            // size='big'
            // value={uniqueIdsFormState[fld.name]}
            value={patientIdentifier.program_id}
            icon='id card outline'
            iconPosition='left'
            type='text' 
            placeholder='Program Id' 
            onChange={(e) => {setPatientIdentifier((f) => ({...f, program_id : e.target.value}))}}

            // onChange={(e) => {setUniqueIdFormState((f) => ({...f, [e.target.name] : e.target.value}))}}
          />
          <Form.Button size='large' onClick={() => {setPatientIdentifier({submitter_donor_id: '', program_id: ''})}} fluid inverted icon='trash' color='red' content='CLEAR FORMS' width={2}/>
          {/* <Button icon='trash' fluid color='red'/> */}

        </Form.Group>
            {/* <Input 
                fluid 
                iconPosition='left' 
                type='text' 
                placeholder='Submitter Donor Id' 
                action
                value={patientId}
                onChange={handleChange}>
                <Icon name='user' />
                <input />
                <Button color='black' style={{ backgroundColor: '#01859d'}}>Submit</Button>
            </Input> */}
            {/* <br /> */}
            </Form>

            </Segment>
        // </>
    )
}

export default PatientSearchForm