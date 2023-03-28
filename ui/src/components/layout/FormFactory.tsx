import * as React from 'react'
import * as R from 'remeda'
import { useQuery } from "@apollo/client";
import { Segment, List, Grid, Message } from "semantic-ui-react";
import { Forms } from "../form/queries/query";
import { FormGenerator } from "../form/FormGenerator";
import { LoadingSegment } from '../common/LoadingSegment'
import { BasicErrorMessage } from '../common/BasicErrorMessage';

function ListMenuItem({
  item,
  setContent,
  patientIdentifier,
  setPatientIdentifier,
  activeItem,
  setActiveItem
}) {
  let finalItem = null

  if (!item.next_form) {
    finalItem = (
      <List.Item active={activeItem === item}>
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
            setActiveItem(item)
          }}>{item.form_name}</a>
        </List.Content>
      </List.Item>
    )
  } else {
    finalItem = (
      <List.Item active={activeItem === item}>
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
            setActiveItem(item)
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
                  activeItem={activeItem}
                  setActiveItem={setActiveItem}
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
  activeItem,
  setActiveItem
}) {
  const menuItems = items.map((item) => {
    return (
      <ListMenuItem
        key={item.form_id}
        item={item}
        setContent={setContent} 
        patientIdentifier={patientIdentifier} 
        setPatientIdentifier={setPatientIdentifier} 
        activeItem={activeItem} 
        setActiveItem={setActiveItem}
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
  const { loading, error, data } = useQuery(Forms)
  const [ content, setContent ] = React.useState(<></>)
  const [ activeItem, setActiveItem ] = React.useState(null)

  React.useEffect(() => setContent(
    data
    ? <FormGenerator
        metadata={activeItem !== null ? activeItem : data.forms[0]}
        patientIdentifier={patientIdentifier}
        setPatientIdentifier={setPatientIdentifier} />
    : <>
        <Message>
          <Message.Header>Welcome to mCODER2!</Message.Header>
          <p>Type a donor's ID in the search form or select a form on the left menu to start.</p>
        </Message>
      </>
  ), [patientIdentifier])

  if (loading) {
    return <LoadingSegment />
  }

  if (error) {
    return <BasicErrorMessage />
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
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </Grid.Column>
        <Grid.Column width={13}>
          {content}
        </Grid.Column>
      </Grid>
    </Segment>
  )
}
