import { Segment, Image, Message } from "semantic-ui-react";
import { useQuery, gql } from "@apollo/client";
import React from "react";
import logo from "../../logos/logo.png";
import TableToolDisplay from "./TableTool";

const getCurrentFormAssociatedToIdentifier = gql`
  query ($where: SubmitterWhere, $reference: SubmitterWhere) {
    submitters(where: $where) {
      connectedFormsReferencingSubmitter(where: $reference) {
        form
        uuid
        formPrimaryIdentifierKeys
        formReferenceKeys {
          formPrimaryIdentifierKeys
        }
        fields {
          key
          value
        }
      }
    }
  }
`;

const getRootOfFormDirectedGraphFormFields = gql`
  query ($where: SubmitterWhere) {
    submitters(where: $where) {
      form
      uuid
      formReferenceKeys {
        formPrimaryIdentifierKeys
      }
      formPrimaryIdentifierKeys
      fields {
        key
        value
      }
    }
  }
`;


// **REFACTOR**
// THIS NEEDS TO REFACTORED
export const TableTool = ({
  form,
  searchForRootForm,
  globalIdentifierKeys,
  formPrimaryIdentifierKeys,
  updateUniqueIdsFormState,
  updateGlobalFormState,
}) => {
  const filterQueryIfEmptyString = searchForRootForm ? formPrimaryIdentifierKeys : globalIdentifierKeys
  if (Object.values(filterQueryIfEmptyString).filter((x : string) => !x.replace(/\s/g, '').length).length > 0){
    return <></>
  }
  
  const { loading, data, error } = useQuery(
    searchForRootForm
      ? getRootOfFormDirectedGraphFormFields
      : getCurrentFormAssociatedToIdentifier,
    {
      variables: {
        ...(searchForRootForm ? {} : { reference: { form: form } }),
        where: {
          formPrimaryIdentifierKeys: searchForRootForm
            ? formPrimaryIdentifierKeys
            : globalIdentifierKeys,
        },
      },
      fetchPolicy: "network-only",
    }
  );

  if (loading) {
    return (
      <>
        <Segment loading style={{ height: "100%" }}>
          <Image src={logo} centered size="medium" />
        </Segment>
      </>
    );
  }

  // checks if the query shows up empty if so do not return anythng
  
  if ((data.submitters !== undefined &&data.submitters.length === 0) || data.submitters === undefined) return <></>;

  if (error) {
    return (
      <>
        <Message warning>
          <Message.Header>Something went wrong</Message.Header>
          <p>Restart the page, then try again.</p>
        </Message>
      </>
    );
  }

  return (
    <TableToolDisplay
      metadata={data.submitters}
      updateGlobalFormState={updateGlobalFormState}
      updateUniqueIdsFormState={updateUniqueIdsFormState}
    />
  );
};
