import { Client } from "minio";
import { Driver } from "neo4j-driver";

export type MyContextType = {
  driver: Driver
  neo4jDatabase: string
  minioClient: Client
  kauth: any
}