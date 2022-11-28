import session from 'express-session'
import { Express } from 'express'
import Keycloak from 'keycloak-connect'
const cors = require('cors')
import dotenv from 'dotenv'

dotenv.config()

const keycloakhost = process.env.KEYCLOAK_SERVER_HOST || '0.0.0.0'
const keycloakport = process.env.KEYCLOAK_SERVER_PORT || '8085'
const keycloakrealm = process.env.KEYCLOAK_SERVER_REALM || 'mcoder2'
const keycloakclient = process.env.KEYCLOAK_SERVER_CLIENT || 'mcoder2-app'
const keycloakpublickey = process.env.KEYCLOAK_SERVER_PUBLIC_KEY || ''

const auth_server_url = `https://${keycloakhost}:${keycloakport}/auth`

console.log('auth_server_url', auth_server_url)

export const configureKeycloak = (app: Express) => {
  const keycloakConfig = {
    "realm": keycloakrealm,
    // Keycloak Console -> Realm Settings -> Keys
    // Need a way to put this into environment variables at docker level?
    "realm-public-key": keycloakpublickey,
    "auth-server-url": auth_server_url,
    "ssl-required": "none",
    "resource": keycloakclient,
    "public-client": true,
    "verify-token-audience": true,
    "use-resource-role-mappings": true,
    "confidential-port": 0,
    "bearer-only": true,
  }

  const memoryStore = new session.MemoryStore()
  app.use(session({
    secret: process.env.SESSION_SECRET_STRING || 'this should be a long secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  }))

  const keycloak = new Keycloak({store: memoryStore}, keycloakConfig)

  app.use(keycloak.middleware())
  app.use(cors('*'))

  return { keycloak }
}