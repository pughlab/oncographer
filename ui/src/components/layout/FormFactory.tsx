import { useQuery } from "@apollo/client";
import { FormIDsNames } from "../form/queries/query";
import { FormGenerator } from "../form/FormGenerator";
import { Segment, Message, Image, List, Grid } from "semantic-ui-react";
import * as React from 'react'
import logo from '../logos/logo.png'
import * as R from 'remeda'


function ListMenuItem({
  item,
  setContent,
  patientIdentifier,
  setPatientIdentifier,
  active,
  setActive 
}) {
  let finalItem = null

  if (!item.next_form) {
    finalItem = (
      <List.Item active={active === item.form_id}>
        <List.Icon name="file" />
        <List.Content>
          <a onClick={() => {
            setContent(
              <FormGenerator
                metadata={item}
                patientIdentifier={patientIdentifier}
                setPatientIdentifier={setPatientIdentifier}
              />
            )
            setActive(item.form_id)
          }}>{item.form_name}</a>
        </List.Content>
      </List.Item>
    )
  } else {
    finalItem = (
      <List.Item active={active === item.form_id}>
        <List.Icon name="folder open" />
        <List.Content>
          <a onClick={() => {
            setContent(
              <FormGenerator
                metadata={item}
                patientIdentifier={patientIdentifier}
                setPatientIdentifier={setPatientIdentifier}
              />
            )
            setActive(item.form_id)
          }}>{item.form_name}</a>
          <List.List>
            {
              item.next_form.map((subform) => {
                return <ListMenuItem
                  key={subform.form_id}
                  item={subform}
                  setContent={setContent}
                  patientIdentifier={patientIdentifier}
                  setPatientIdentifier={setPatientIdentifier}
                  active={active}
                  setActive={setActive}
                />
              })
            }
          </List.List>
        </List.Content>
      </List.Item>
    )
  }

  return finalItem
}

function ListMenu({ 
  items,
  setContent,
  patientIdentifier,
  setPatientIdentifier,
}) {
  const [ activeMenuItem, setActiveMenuItem ] = React.useState(null)
  const menuItems = items.map((item) => {
    return (
      <ListMenuItem
        key={item.form_id}
        item={item}
        setContent={setContent} 
        patientIdentifier={patientIdentifier} 
        setPatientIdentifier={setPatientIdentifier} 
        active={activeMenuItem} 
        setActive={setActiveMenuItem}
      />
    )
  })

  return (
    <List link>
      {menuItems}
    </List>
  )
}

export default function FormFactory({ patientIdentifier, setPatientIdentifier }) {
  const { loading, error, data } = useQuery(FormIDsNames)
  const [ content, setContent ] = React.useState(null)

  if (loading) {
    return (
      <>
        <Segment loading style={{ height: '100%' }}>
          <Image src={logo} centered size='medium' />
        </Segment>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Message warning>
          <Message.Header>Something went wrong</Message.Header>
          <p>Restart the page, then try again.</p>
        </Message>
      </>
    )
  }

  if (R.isNil(data)) {
    return null
  }

  return (
    <Segment>
      <Grid>
        <Grid.Column width={3}>
          <ListMenu
            items={data.forms}
            setContent={setContent}
            patientIdentifier={patientIdentifier}
            setPatientIdentifier={setPatientIdentifier}
          />
        </Grid.Column>
        <Grid.Column width={13}>
          {content}
        </Grid.Column>
      </Grid>
    </Segment>
  )
}
