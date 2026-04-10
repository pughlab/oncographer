import { ApolloError } from "apollo-server";

const structureQuery = `MATCH (root:Form)
    WHERE $study IN root.studies
    AND NOT EXISTS {
        MATCH (:Form)-[r:NEXT_FORM]->(root)
        WHERE $study IN r.studies 
    }
    MATCH formPath = (root)-[:NEXT_FORM*0..]->(f:Form)
    WHERE $study IN f.studies
    AND ALL(r IN relationships(formPath) WHERE $study IN r.studies)
    MATCH fieldPath = (f)-[:HAS_NEXT_QUESTION*]->(field:Field)
    WHERE $study IN field.studies
    WITH f, field, length(formPath) AS formRank, length(fieldPath) AS fieldRank
    ORDER BY formRank, fieldRank
    RETURN f.form_id AS formID, f.form_name AS formName, collect(field.name) AS fieldNames
`

const baseQuery = `
    MATCH (p:Patient {study: $study})
    OPTIONAL MATCH (p)<-[:DATA_FOR]-(s:Submission)-[:HAS_VALUE]->(v:FieldKeyValuePair)

    RETURN
        p.patient_id AS patient_id,
        p.program_id AS program_id,
        p.study AS study`

export const resolvers = {
    Query: {
        exportDataToCSVFile: async (_obj, { study }, { kauth, driver }) => {
            const adminRoles : string[] = JSON.parse(process.env.KEYCLOAK_ADMIN_ROLES) || []
            const clientName : string = process.env.KEYCLOAK_SERVER_CLIENT || ""
            const isAdmin =  (
                kauth
                ? adminRoles.some((role) => kauth.accessToken?.content?.resource_access[clientName]?.roles?.includes(role))
                : false
            )
            if (!isAdmin) {
                throw new ApolloError("You are not authorised to do this operation");  
            }

            const session = driver.session()
            try {
                const structureResult = await session.run(structureQuery, { study })
                const columns = structureResult.records.map(record => {
                    const formID = record.get('formID')
                    const formName = record.get('formName')
                    const fieldNames = record.get('fieldNames')

                    if (fieldNames?.length === 0) return ''
                    return fieldNames.map((name: string) => {
                        const safeFormName = formName.replaceAll(/\W+/g, '_').toLowerCase()
                        return `max(CASE WHEN s.form_id = "${formID}" AND v.key = "${name}" THEN v.value END) AS ${safeFormName}_${name}`
                    }).join(',\n        ')
                }).filter((col: string) => col !== '').join(',\n        ')

                let query = baseQuery
                if (columns) {
                    query += `,\n        ${columns}`
                }
                query += `\n    ORDER BY p.patient_id`
                const result = await session.run(`
                    CALL apoc.export.csv.query($query, null, {
                        stream: true,
                        params: { study: $study }
                    })
                    YIELD data
                    RETURN data   
                `, { study, query })
                const csvData = result.records.map(record => record.get('data')).join('');

                return csvData
            } catch (error) {
                console.error("Error exporting data to CSV file:", error);
                throw new ApolloError("Failed to export data to CSV file.");
            } finally {
                await session.close();
            }
        }
    },
}