import * as React from 'react'
import { ApolloProvider } from "@apollo/client"
import apolloClient from './apolloClient'

import {store as reduxStore} from './state/store'
import { Provider as ReduxProvider } from 'react-redux'

import Portal from './components/Portal'

import { ReactKeycloakProvider } from '@react-keycloak/web'
import keycloak from './keycloak/keycloak'
import {
  eventLogger as keycloakEventLogger,
  tokenLogger as keycloakTokenLogger,
  initOptions as keycloakInitOptions
} from './keycloak/providerConfig'

import {BrowserRouter, Route, Routes} from 'react-router-dom'

import RenderOnAuthenticated from './components/authentication/RenderOnAuthenticated'
import LoadingAuthentication from './components/authentication/LoadingAuthentication'

const App = () => {
  
  return (
      <div>
        <ReactKeycloakProvider 
          authClient={keycloak}
          onEvent={keycloakEventLogger}
          onTokens={keycloakTokenLogger}
          initOptions={keycloakInitOptions}
          LoadingComponent={<LoadingAuthentication />}
        >
        <ReduxProvider {...{store: reduxStore}}>
          <ApolloProvider {...{client: apolloClient}}>
          <BrowserRouter>
            <RenderOnAuthenticated>
              <Portal />
            </RenderOnAuthenticated>
          </BrowserRouter>
          </ApolloProvider>
        </ReduxProvider>
        </ReactKeycloakProvider>
        </div>    
  );
}

export default App