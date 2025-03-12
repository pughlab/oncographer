const eventLogger = (event: any, error: any) => {
  console.log('onKeycloakEvent', event, error)
}

const tokenLogger = (tokens: any) => {
  const {token} = tokens
  localStorage.setItem('keycloak_token', token)
}

const initOptions = { 
  onLoad: "login-required",
  checkLoginIframe: false,
  enableLogging: true
}

export {
  eventLogger,
  tokenLogger,
  initOptions
};