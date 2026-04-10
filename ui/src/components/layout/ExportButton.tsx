import { gql, useLazyQuery, useQuery } from "@apollo/client";
import React, { useEffect } from "react";
import { Button } from "semantic-ui-react";
import { usePatientID } from "./context/PatientIDProvider";


export default function ExportButton() {

  const { study } = usePatientID()

  const { data: isAdmin } = useQuery(gql`
    query {
      isAdmin
    }
  `);

  const [exportToCSV, { data }] = useLazyQuery(gql`
    query ExportToCSV($study: String!) {
      exportDataToCSVFile(study: $study)
    }`
  )

  useEffect(() => {
    if (data?.exportDataToCSVFile) {
      const blob = new Blob([data.exportDataToCSVFile], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${study}_${new Date().toISOString()}_export.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [data])

  if (!isAdmin?.isAdmin || !study) {
    return <></>
  }

  return (
    <Button width={2} onClick={() => exportToCSV({ variables: { study } })} color="green" inverted>
      Export Study
    </Button>
  )
}