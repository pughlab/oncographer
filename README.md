mCODER2 readme here (how to start, how each service works)

Requires Node 16 and Docker (should come with `docker compose` command)
```
npm install
cp sample.env .env
cp ui/sample.ui.env ui/.env
```

Need to spin up to get values for editing the .env files.
```
make setup-volumes
make dev
```

Find `KEYCLOAK_SERVER_PUBLIC_KEY` from the Keycloak console (localhost:8080) realm public key : `Realm Settings` -> `Keys` -> `Public Key`
```
KEYCLOAK_SERVER_HOST=your_local_machine_ip_from_internet_settings
KEYCLOAK_SERVER_PUBLIC_KEY=key_from_keycloak_admin_console
```

### Updated node module css (node_modules/react-datepicker/dist/react-datepicker.css)
```
.react-datepicker__close-icon::after {
  cursor: pointer;
  background-color: transparent;
  color: rgba(0, 0, 0, 0.774);
  font-weight: bolder;
  border-radius: 50%;
  height: 16px;
  width: 16px;
  padding: 2px;
  font-size: 16px;
  line-height: 1;
  text-align: center;
  display: table-cell;
  vertical-align: middle;
  content: "×";
}

.react-datepicker__close-icon::after:hover {
  cursor: pointer;
  background-color: transparent;
  color: rgb(0, 0, 0);
  font-weight: bolder;
  border-radius: 50%;
  height: 16px;
  width: 16px;
  padding: 2px;
  font-size: 16px;
  line-height: 1;
  text-align: center;
  display: table-cell;
  vertical-align: middle;
  content: "×";
}

```

You may also need to change some Docker options to give your containers (specifically `api`) enough memory to run (~4gb). 