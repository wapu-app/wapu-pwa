"use client";
import CONFIG from "../config/environment/current";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

function isJWTExpired({ token }) {
    if (typeof token === "undefined") {
        return true;
    }

    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp > currentTime) {
        return false;
    }
    return true;
}

export const isAuthExpired = () => {
    const token = Cookies.get("access_token");
    return isJWTExpired({ token: token });
};

export const getAccessToken = async () => {
    const token = Cookies.get("access_token");

    if (!isJWTExpired({ token: token })) {
        return token;
    } else {
        const response = await fetch(CONFIG.API.BASE_URL + "/users/refresh", {
            credentials: "include",
            method: "GET",
        });

        const data = await response.json();

        if (response.status == 200) {
            Cookies.set("access_token", data.access_token, {
                path: "/",
                sameSite: "strict",
                expires: 1,
            });
            return data.access_token;
        } else {
            Cookies.set("isLoggedIn", false, {
                path: "/",
                sameSite: "strict",
                expires: 1,
            });
            Cookies.remove("access_token");
        }
    }
};
