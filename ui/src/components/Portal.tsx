import React, { useState } from "react";
import { Sticky, Menu, Divider, Label, Popup, Header, Icon } from 'semantic-ui-react'
import useKeycloakMeMutation from '../hooks/useKeycloakMeMutation'
import dayjs from 'dayjs'

import {Logo} from './logos'

import useRouter from '../hooks/useRouter'
import LoginModal from './authentication/LoginModal'

import PortalNavBarIntro, {HOME_MENU_ELEMENT_ID} from './intros/PortalNavBarIntro'

import FormFactory  from './layout/FormFactory';
import PatientSearchForm from './layout/PatientSearchForm'

const DocsLink = () => {
  return (
  <>
  <Popup size='large' flowing wide='very'
    trigger={
      <Menu.Item
        id={HOME_MENU_ELEMENT_ID}     
        header
        icon='info circle'
        href='https://mcoder2.ca' 
        target='_blank'
      />
    }
  >
    <Label basic content="Go to mCODER2 Docs:" detail="https://mcoder2.ca" />
  </Popup>
</>
)}

export default function Portal () {
  const {navigate, location, isActivePathElement} = useRouter()
  const [meMutationState] = useKeycloakMeMutation()

  const [patientIdentifier, setPatientIdentifier] = useState({submitter_donor_id: '', program_id: ''})

  const routes = [
    {path: '/', icon: 'info circle', introID: HOME_MENU_ELEMENT_ID},
    // {path: '/home', icon: 'database', introID: DATA_MENU_ELEMENT_ID},
  ]
  return (
    <>
        <Sticky>
      <Menu borderless style={{margin: 0, borderRadius: 0}}>
        <Menu.Menu position='left'>
          <Logo href="/" size='tiny' />
          <Menu.Item>
            <Header href="/" size='large'>
              <strong >mCODER2</strong><strong style={{fontWeight: 100}}>App</strong>
            </Header>
          </Menu.Item>

        </Menu.Menu>


        <Menu.Menu position='right'>
          <Menu.Item>
            <Icon name='calendar' />
            {dayjs().format("MMMM DD, YYYY, h:mm a")}
          </Menu.Item>
          <DocsLink />
          <LoginModal />
          <PortalNavBarIntro />
        </Menu.Menu>
      </Menu>
      
    </Sticky>

    <Divider horizontal />
    <div style={{padding: '1em'}}>
      <PatientSearchForm patientIdentifier={patientIdentifier} setPatientIdentifier={setPatientIdentifier}/>
      <Divider horizontal />

      <FormFactory patientIdentifier={patientIdentifier} setPatientIdentifier={setPatientIdentifier}/>
    </div>
    </>
  )
}