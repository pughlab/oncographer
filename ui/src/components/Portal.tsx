import * as React from 'react'
import { Sticky, Menu, Image, Divider, Container, Segment, Label, Popup, Header } from 'semantic-ui-react'
import useKeycloakMeMutation from '../hooks/useKeycloakMeMutation'
import {Routes, Route, Outlet, useNavigate, useLocation, matchPath, Link} from 'react-router-dom'
import dayjs from 'dayjs'

import SegmentPlaceholder from './common/SegmentPlaceholder'

import {Logo} from './logos'

import useRouter from '../hooks/useRouter'
import LoginModal from './authentication/LoginModal'

import PortalNavBarIntro, {HOME_MENU_ELEMENT_ID, DATA_MENU_ELEMENT_ID} from './intros/PortalNavBarIntro'

import FormFactory  from './layout/FormFactory';
import PatientSearchForm from './layout/PatientSearchForm'

export default function Portal () {
  const {navigate, location, isActivePathElement} = useRouter()
  console.log(location)
  const [meMutationState] = useKeycloakMeMutation()
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

          {/* {routes.map(
            ({path, icon, introID}) => <Menu.Item id={introID} key={path} {...{header: true, icon, onClick: (e, d) => navigate(path)}} />
          )} */}
          <Menu.Item icon='calendar'>
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
      <PatientSearchForm />
      <Divider horizontal />

      <FormFactory />
    </div>
    </>
  )
}