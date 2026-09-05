import Cookies from "js-cookie";
import { logoutUser } from "../api/api";
export default async function userLogout() {
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
        window.location.replace("/newSignUp");
    }
}
