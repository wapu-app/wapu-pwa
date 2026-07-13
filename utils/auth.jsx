"use client";
import CONFIG from "../config/environment/current";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

function isJWTExpired({ token }) {
    if (typeof token === "undefined") {
        return true;
    }

    // Malformed token -> treat as expired so refresh runs instead of crashing.
    let decodedToken;
    try {
        decodedToken = jwtDecode(token);
    } catch {
        return true;
    }

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

// Shared across all concurrent callers so a burst of API calls hitting an
// expired token triggers a single /users/refresh instead of one per request.
let refreshPromise = null;

const refreshAccessToken = async () => {
    const secure = window.location.protocol === "https:";
    let response;
    try {
        response = await fetch(CONFIG.API.BASE_URL + "/users/refresh", {
            credentials: "include",
            method: "GET",
        });
    } catch {
        // Network failure: return null so apiRequest returns 401 to callers.
        return null;
    }

    let data;
    try {
        data = await response.json();
    } catch {
        return null;
    }

    if (response.status === 200 && data && data.access_token) {
        Cookies.set("access_token", data.access_token, {
            path: "/",
            sameSite: "strict",
            secure: secure,
            expires: 1,
        });
        return data.access_token;
    }

    Cookies.set("isLoggedIn", false, {
        path: "/",
        sameSite: "strict",
        secure: secure,
        expires: 1,
    });
    Cookies.remove("access_token");
    return null;
};

export const getAccessToken = async () => {
    const token = Cookies.get("access_token");

    if (!isJWTExpired({ token: token })) {
        return token;
    }

    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};
