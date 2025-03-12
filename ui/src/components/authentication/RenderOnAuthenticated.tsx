import { useKeycloak } from "@react-keycloak/web";
//Checking if user is logged in on Keycloak
const RenderOnAuthenticated = ({ children }: { children: any }) => {
    const { keycloak } = useKeycloak();

    const isLoggedIn = keycloak.authenticated;

    return isLoggedIn ? children : null;
};

export default RenderOnAuthenticated;