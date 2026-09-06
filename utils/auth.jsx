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

// Both auth cookies must be written with the same attributes: a mismatch
// creates a second cookie instead of updating the existing one.
// secure is read here, not at module scope, because this module is imported
// by statically prerendered pages, where window does not exist.
const authCookieOptions = () => ({
    path: "/",
    sameSite: "strict",
    secure: window.location.protocol === "https:",
    expires: 1,
});

// Shared across all concurrent callers so a burst of API calls hitting an
// expired token triggers a single /users/refresh instead of one per request.
let refreshPromise = null;

const requestAccessTokenRefresh = async () => {
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
        Cookies.set("access_token", data.access_token, authCookieOptions());
        Cookies.set("isLoggedIn", "true", authCookieOptions());
        return data.access_token;
    }

    Cookies.set("isLoggedIn", "false", authCookieOptions());
    Cookies.remove("access_token");
    return null;
};

export const refreshAccessToken = async () => {
    if (!refreshPromise) {
        refreshPromise = requestAccessTokenRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

export const getAccessToken = async () => {
    const token = Cookies.get("access_token");

    if (!isJWTExpired({ token: token })) {
        // The JWT can outlive the isLoggedIn marker (the marker expired on its
        // own, or a page cleared it). Re-stamp it here, or the session gate in
        // the layout and the hourly refresh keep reading a logged-out user
        // while a valid token is in hand.
        Cookies.set("isLoggedIn", "true", authCookieOptions());
        return token;
    }

    return refreshAccessToken();
};
