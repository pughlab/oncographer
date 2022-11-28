// match (n) return n;
// match (n) detach delete n;

MERGE (sg:SampleGroup {sampleGroupName: 'hormones'})
with sg
MERGE (sg)-[:has_datum]->(sd1:SampleDatum {sampleDatumName: 'milk_adiponectin'})
MERGE (sg)-[:has_datum]->(sd2:SampleDatum {sampleDatumName: 'milk_insulin'})
MERGE (sg)-[:has_datum]->(sd3:SampleDatum {sampleDatumName: 'milk_leptin'});
// match (n) return n;

LOAD CSV WITH HEADERS FROM "file:///hormones1.csv" as row
WITH row
MERGE (u:Subject {subjectId: row.CHILDid})
WITH row, u
MATCH (sd1: SampleDatum {sampleDatumName: 'milk_adiponectin'})
MATCH (sd2: SampleDatum {sampleDatumName: 'milk_insulin'})
MATCH (sd3: SampleDatum {sampleDatumName: 'milk_leptin'})
WITH row, u, sd1, sd2, sd3
MERGE (s1:Sample {sampleValue: coalesce(row.milk_adiponectin, 'NULL')})
MERGE (s2:Sample {sampleValue: coalesce(row.milk_insulin, 'NULL')})
MERGE (s3:Sample {sampleValue: coalesce(row.milk_leptin, 'NULL')})
MERGE (u)-[:has_sample]->(s1)
MERGE (u)-[:has_sample]->(s2)
MERGE (u)-[:has_sample]->(s3)
MERGE (sd1)-[:has_sample]->(s1)
MERGE (sd2)-[:has_sample]->(s2)
MERGE (sd3)-[:has_sample]->(s3)
WITH row, u, s1, s2, s3
MATCH (sg:SampleGroup {sampleGroupName: 'hormones'})
MERGE (sg)-[:has_sample]->(s1)
MERGE (sg)-[:has_sample]->(s2)
MERGE (sg)-[:has_sample]->(s3);