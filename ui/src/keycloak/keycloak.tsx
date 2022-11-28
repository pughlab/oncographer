import Keycloak from 'keycloak-js';

const keycloakhost = process.env.KEYCLOAK_SERVER_HOST || '0.0.0.0'
const keycloakport = process.env.KEYCLOAK_SERVER_PORT || '8085'
const keycloakrealm = process.env.KEYCLOAK_SERVER_REALM || 'mcoder2'
const keycloakclient = process.env.KEYCLOAK_SERVER_CLIENT || 'mcoder2-app'

console.log('keycloakhost', keycloakhost)
console.log('keycloakport', keycloakport)

// const keycloakhost = window.location.hostname

console.log('process', process)
console.log('process.env', process.env)

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
const keycloak = Keycloak({
  url: `https://${keycloakhost}:${keycloakport}/auth`,
  realm: keycloakrealm,
  clientId: keycloakclient
});

export default keycloak
