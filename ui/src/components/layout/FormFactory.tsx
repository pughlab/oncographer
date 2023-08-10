import * as React from 'react'
import * as R from 'remeda'
import { useQuery } from "@apollo/client";
import { Segment, List, Grid } from "semantic-ui-react";
import { FormTree } from "../form/queries/query";
import { FormGenerator } from "../form/FormGenerator";
import { LoadingSegment } from '../common/LoadingSegment'
import { BasicErrorMessage } from '../common/BasicErrorMessage';

function ListMenuItem({
  item,
  activeItem,
  setActiveItem
}) {

  const isActive = activeItem === item
  const hasSubForms = item.next_form.length > 0
  const isActiveAndHasSubForms = isActive && hasSubForms

  return (
    <List.Item active={isActive}  >
      <List.Icon name={isActiveAndHasSubForms ? "folder open" : hasSubForms ? "folder open outline" : isActive ? "file alternate" : "file outline"} color={isActive ? 'teal' : 'grey'} />
      <List.Content>
        <a style={isActive ? { color: "#02B5AE" } : {}} onClick={() => {
          setActiveItem(item)
        }}>{item.form_name}</a>
        <List.List>
          {
            item.next_form.map((subform) => {
              return <ListMenuItem
                key={subform.form_id}
                item={subform}
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

function ListMenu({ 
  root,
  activeItem,
  setActiveItem
}) {

  return (
    <Segment basic>
    <List link size="large">
      <ListMenuItem
        key={root.form_id}
        item={root}
        activeItem={activeItem} 
        setActiveItem={setActiveItem}
      />
    </List>
    </Segment>
  )
}

export default function FormFactory() {
  const { loading, error, data } = useQuery(FormTree)
  const [ activeItem, setActiveItem ] = React.useState(null)

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
            root={data.GetRootForm}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </Grid.Column>
        <Grid.Column width={13}>
          <FormGenerator
            key={activeItem !== null ? activeItem.form_name : data.GetRootForm.form_name}
            formMetadata={activeItem ?? data.GetRootForm}
          />
        </Grid.Column>
      </Grid>
    </Segment>
  )
}
