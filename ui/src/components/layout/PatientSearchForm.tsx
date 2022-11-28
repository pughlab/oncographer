import React, { useState } from 'react'
import { Icon, Input, Button } from 'semantic-ui-react'

const PatientSearchForm = () => {
    const [ patientId, setPatientId ] = useState('')
    const handleChange = (e) => setPatientId(e.target.value)
    return (
        <>
            <Input 
                fluid 
                iconPosition='left' 
                type='text' 
                placeholder='Patient Identifier' 
                action
                value={patientId}
                onChange={handleChange}>
                <Icon name='user' />
                <input />
                <Button color='black' style={{ backgroundColor: '#01859d'}}>Submit</Button>
            </Input>
            {/* <br /> */}
            {/* <Button style={{ float: 'right' }}>Export all data for this patient</Button> */}
        </>
    )
}

export default PatientSearchForm