import Cookies from "js-cookie";
import CONFIG from "../config/environment/current";
import { getSettings } from "../api/api";

const getDesignVersion = async () => {
    const settings = await getSettings();
    return settings;
};
export default async function userLogout() {
    const settings = await getDesignVersion();
    try {
        const res = await fetch(CONFIG.API.BASE_URL + "/users/logout", {
            method: "POST",
        });

        if (res.status === 200) {
            Cookies.set("isLoggedIn", "false", {
                path: "/",
                sameSite: "strict",
            });
            window.location.replace(
                settings.webapp_design === "tamagui-1.0" ? "/newSignUp" : "/signup"
            );
        } else {
            console.error("Failed to log out. Status:", res.status);
        }
    } catch (error) {
        console.error("Error during logout:", error);
    }
}
