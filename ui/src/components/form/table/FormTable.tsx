import { useQuery, gql } from "@apollo/client";
import React from "react";
import TableToolDisplay from "./TableTool";
import { LoadingSegment } from "../../common/LoadingSegment";
import { BasicErrorMessage } from "../../common/BasicErrorMessage";

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
export const FormTable = ({
  form,
  searchForRootForm,
  globalIdentifierKeys,
  identifierKeys,
  formPrimaryIdentifierKeys,
  updateUniqueIdsFormState,
  updateGlobalFormState,
}) => {

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

  const filterQueryIfEmptyString = searchForRootForm ? formPrimaryIdentifierKeys : globalIdentifierKeys
  if (Object.values(filterQueryIfEmptyString).filter((x : string) => !x.replace(/\s/g, '').length).length > 0){
    return <></>
  }

  if (loading) {
    return <LoadingSegment />
  }

  // checks if the query shows up empty if so do not return anythng
  if (data.submitters === undefined || (data.submitters !== undefined &&data.submitters.length === 0)) return <></>;

  if (error) {
    return <BasicErrorMessage />
  }

  return (
    <TableToolDisplay
      metadata={data.submitters}
      ids={identifierKeys}
      updateGlobalFormState={updateGlobalFormState}
      updateUniqueIdsFormState={updateUniqueIdsFormState}
    />
  );
};
