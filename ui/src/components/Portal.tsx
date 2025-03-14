import React from "react";
import { Sticky, Menu, Divider, Label, Popup, Header, Icon } from 'semantic-ui-react'
import useKeycloakMeMutation from '../hooks/useKeycloakMeMutation'
import dayjs from 'dayjs'

import {Logo} from './logos'

import useRouter from '../hooks/useRouter'
import LoginModal from './authentication/LoginModal'

import PortalNavBarIntro, {HOME_MENU_ELEMENT_ID} from './intros/PortalNavBarIntro'

import FormFactory  from './layout/FormFactory';
import PatientSearchForm from './layout/PatientSearchForm'
import { PatientIDProvider } from "./layout/context/PatientIDProvider";

const DocsLink = () => {
  return (
  <Popup size='large' flowing wide='very'
    trigger={
      <Menu.Item
        id={HOME_MENU_ELEMENT_ID}     
        header
        icon='info circle'
        href='https://oncographer.ca' 
        target='_blank'
      />
    }
  >
    <Label basic content="Go to OncoGrapher Docs:" detail="https://oncographer.ca" />
  </Popup>
)}

function MainMenu() {
  return (
    <Sticky>
      <Menu borderless style={{margin: 0, borderRadius: 0}}>
        <Menu.Menu position='left'>
          <Logo href="/" size='tiny' />
          <Menu.Item>
            <Header href="/" size='large'>
              <strong>OncoGrapher</strong><strong style={{fontWeight: 100}}>App</strong>
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
  )
}

export default function Portal () {
  useRouter()
  useKeycloakMeMutation()

  return (
    <>
      <MainMenu />
      <Divider horizontal />
      <div style={{padding: '1em'}}>
        <PatientIDProvider>
          <PatientSearchForm />
          <Divider horizontal />
          <FormFactory />
        </PatientIDProvider>
      </div>
    </>
  )
}