import Cookies from "js-cookie";
import { getSettings, logoutUser } from "../api/api";

const getDesignVersion = async () => {
    const settings = await getSettings();
    return settings;
};
export default async function userLogout() {
    const settings = await getDesignVersion().catch(() => null);
    try {
        await logoutUser();
    } catch (error) {
        console.error("Error during logout:", error);
    } finally {
        // Clear the local session regardless of the network result so logout
        // always works (e.g. offline) and the client "logged in" flag can't
        // outlive the request.
        Cookies.set("isLoggedIn", "false", {
            path: "/",
            sameSite: "strict",
        });
        Cookies.remove("access_token");
        window.location.replace(
            settings?.webapp_design === "tamagui-1.0" ? "/newSignUp" : "/signup"
        );
    }
}
