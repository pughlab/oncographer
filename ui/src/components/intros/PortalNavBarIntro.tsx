import * as React from 'react'
import {useState} from 'react'
import { Steps, Hints } from "intro.js-react";
import { Menu } from 'semantic-ui-react';

// Element IDs
export const HOME_MENU_ELEMENT_ID = 'home-menu-item'
export const DATA_MENU_ELEMENT_ID = 'data-menu-item'
export const LOGIN_MENU_ELEMENT_ID = 'login-menu-item'

export default function PortalNavBarIntro ({}) {
    const [enabled, setEnabled] = useState(false)
    const initialStep = 0
    const steps = [
        {
          element: `#${HOME_MENU_ELEMENT_ID}`,
          intro: "Click here for more information about the portal"
        },
        // {
        //   element: `#${DATA_MENU_ELEMENT_ID}`,
        //   intro: "Click here to begin uploading and downloading data"
        // },
        {
          element: `#${LOGIN_MENU_ELEMENT_ID}`,
          intro: "Click here to see your user information and logout"
        }
    ]
    return (
        <>
        <Menu.Item onClick={() => setEnabled(true)} content="Help" />
        <Steps
          enabled={enabled}
          steps={steps}
          initialStep={initialStep}
          onExit={() => setEnabled(false)}
        />
        </>
    )
}