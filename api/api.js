import CONFIG from "../config/environment/current";
import Cookies from "js-cookie";
import { getAccessToken } from "../utils/auth";
import { getOrFetch, invalidate } from "../utils/apiCache";

const base_url = CONFIG.API.BASE_URL;

const CACHE_KEY = {
    SETTINGS: "settings",
    TRANSACTIONS: "transactions",
    COUNTRIES: "countries",
    PROFILE: "profile",
};

const CACHE_TTL = {
    // Fallback when the backend has no (or an invalid) webapp_settings_cache_ttl_minutes
    SETTINGS_DEFAULT: 10 * 60 * 1000, // 10 minutes
    SETTINGS_MAX: 24 * 60 * 60 * 1000, // cap against absurd admin input
    TRANSACTIONS: 5 * 60 * 1000, // 5 minutes
    COUNTRIES: 24 * 60 * 60 * 1000, // 24 hours
    PROFILE: 60 * 60 * 1000, // 1 hour
};

const isOkStatus = (status) => status >= 200 && status < 300;

// The settings cache TTL comes inside the /settings payload itself
// (webapp_settings_cache_ttl_minutes, tunable at runtime by ops without a FE
// deploy). The backend serves it as a raw string; tolerate an absent key
// (backend not migrated yet), "", non-numeric or <= 0 values. A TTL change
// only takes effect once the currently cached entry expires.
const settingsTtlMs = (settings) => {
    const minutes = Number(settings && settings.webapp_settings_cache_ttl_minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return CACHE_TTL.SETTINGS_DEFAULT;
    }
    return Math.min(minutes * 60 * 1000, CACHE_TTL.SETTINGS_MAX);
};

const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
};

async function apiRequest({
    endpoint,
    method = "GET",
    headers = { "Content-Type": "application/json" },
    body = null,
    requiresAuth = true,
    credentials = "same-origin" // default value
}) {
    const accessToken = requiresAuth ? await getAccessToken() : null;
    // Refresh failed / no session: don't fire "Authorization: Bearer undefined"
    // at the network. Return a 401 in the same shape callers already handle.
    if (requiresAuth && !accessToken) {
        return { data: { error: "Session expired" }, status: 401 };
    }
    let requestBody;
    if (body instanceof FormData) {
        requestBody = body;
        // Remove the Content-Type header to let the browser set it to multipart/form-data
        delete headers["Content-Type"];
    } else if (typeof body === "object" && body !== null) {
        requestBody = JSON.stringify(body);
    } else {
        requestBody = body;
    }

    const requestOptions = {
        method,
        headers: {
            ...headers,
            ...(requiresAuth && { Authorization: `Bearer ${accessToken}` }),
        },
        credentials: credentials
    };
    
    // Only add body if it exists
    if (requestBody) {
        requestOptions.body = requestBody;
    }

    try {
        const response = await fetch(`${base_url}${endpoint}`, requestOptions);
        const data = await response.json();
        return { data: data, status: response.status };
    } catch (error) {
        const errorMessage =
            error.message ||
            "An unexpected error occurred. Please try again later.";
        throw new Error(errorMessage);
    }
}

export async function signupUser(email, password, referral) {
    return await apiRequest({
        endpoint: "/users/create",
        method: "POST",
        body: {
            username: email,
            email: email,
            password: password,
            referral_code: referral,
        },
        requiresAuth: false,
        credentials: "include",
    });
}

export async function loginUser(email, password) {
    return await apiRequest({
        endpoint: "/users/login",
        method: "POST",
        body: { email, password },
        requiresAuth: false,
        credentials: "include"
    });
}

export async function loginWithTempPassword(tempPassword) {
    return await apiRequest({
        endpoint: "/users/login",
        method: "POST",
        body: { temp_password: tempPassword },
        requiresAuth: false,
        credentials: "include",
    });
}

export async function logoutUser() {
    // Send the current (possibly expired) token so the server can revoke it and,
    // via credentials:"include", clear the HttpOnly refresh cookie. requiresAuth
    // is false so an expired token doesn't short-circuit the logout request.
    const accessToken = Cookies.get("access_token");
    return await apiRequest({
        endpoint: "/users/logout",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        requiresAuth: false,
        credentials: "include",
    });
}

export async function sendLoginEmail(email) {
    return await apiRequest({
        endpoint: "/users/send-login-email",
        method: "POST",
        body: { email },
        requiresAuth: false,
    });
}

export async function logUserInfo(logInfo) {
    return await apiRequest({
        endpoint: "/users/log",
        method: "POST",
        body: logInfo,
        requiresAuth: false,
    });
}

export async function fetchUserData() {
    return apiRequest({ endpoint: "/users/home" });
}

export async function getProfile() {
    return getOrFetch(
        CACHE_KEY.PROFILE,
        CACHE_TTL.PROFILE,
        () => apiRequest({ endpoint: "/users/profile" }),
        { shouldCache: (res) => isOkStatus(res.status) }
    );
}

export async function getVerifyCode(code) {
    return await apiRequest({ endpoint: "/users/verify-email/" + code });
}

export async function updateProfile(profileData) {
    const response = await apiRequest({
        endpoint: "/users/profile",
        method: "PATCH",
        body: profileData,
    });
    if (isOkStatus(response.status)) {
        invalidate(CACHE_KEY.PROFILE);
    }
    return response;
}

export async function sendRecoverPasswordEmail(recoveryEmail) {
    return await apiRequest({
        endpoint: "/users/send-recovery-email",
        method: "POST",
        body: { email: recoveryEmail },
        requiresAuth: false,
    });
}

export async function resetPassword(verificationCode, password) {
    return await apiRequest({
        endpoint: "/users/password-recovery/" + verificationCode,
        method: "POST",
        body: { password },
        requiresAuth: false,
    });
}

export async function checkUsernameAvailability(username) {
    const { data } = await apiRequest({
        endpoint: "/users/usertag",
        method: "POST",
        body: { username },
        requiresAuth: false,
    });
    return data.is_valid;
}

export async function getTransactions() {
    return getOrFetch(
        CACHE_KEY.TRANSACTIONS,
        CACHE_TTL.TRANSACTIONS,
        () => apiRequest({ endpoint: "/transactions/my_transactions" }),
        { shouldCache: (res) => isOkStatus(res.status) }
    );
}

export const getTransaction = async (trx_id) => {
    return await apiRequest({ endpoint: `/transactions/${trx_id}` });
};

export async function getTransactionTentativeAmount(payload) {
    return await apiRequest({
        endpoint: "/transactions/tentative-amount",
        method: "POST",
        body: payload,
    });
}

export async function updateTransactionStatus(newStatus, trx_id) {
    const payload = { status: newStatus };
    const formData = new FormData();
    Object.keys(payload).forEach((key) => formData.append(key, payload[key]));

    const response = await apiRequest({
        endpoint: `/transactions/${trx_id}`,
        method: "PATCH",
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: formData,
    });
    if (isOkStatus(response.status)) {
        invalidate(CACHE_KEY.TRANSACTIONS);
    }
    return response;
}

export async function sendVerificationEmail(email) {
    return await apiRequest({
        endpoint: "/users/send-verification-email",
        method: "POST",
        body: { email },
    });
}

export async function getReferralCode(email, phone) {
    return await apiRequest({
        endpoint: "/users/referral",
        method: "POST",
        body: { email, phone },
    });
}

export async function postDeposit(payload) {
    const response = await apiRequest({
        endpoint: "/wallet/deposit",
        method: "POST",
        body: payload,
    });
    if (isOkStatus(response.status)) {
        invalidate(CACHE_KEY.TRANSACTIONS);
    }
    return response;
}

export async function postDepositLightning(payload) {
    const response = await apiRequest({
        endpoint: "/wallet/deposit_lightning",
        method: "POST",
        body: payload,
    });
    if (isOkStatus(response.status)) {
        invalidate(CACHE_KEY.TRANSACTIONS);
    }
    return response;
}

export async function postInnerTransfer(payload) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => formData.append(key, payload[key]));
    const response = await apiRequest({
        endpoint: "/transactions/inner_transfer",
        method: "POST",
        body: formData,
    });
    if (isOkStatus(response.status)) {
        invalidate(CACHE_KEY.TRANSACTIONS);
    }
    return response;
}
export async function postWithdrawal(payload) {
    const response = await apiRequest({
        endpoint: "/wallet/withdraw",
        method: "POST",
        body: payload,
    });
    if (isOkStatus(response.status)) {
        invalidate(CACHE_KEY.TRANSACTIONS);
    }
    return response;
}

export async function uploadKycFrontPhoto(imgSrc) {
    const formData = new FormData();
    formData.append("image", dataURItoBlob(imgSrc), "photo.png");

    const { data, status } = await apiRequest({
        endpoint: "/users/image?purpose=credential_image_front",
        method: "POST",
        body: formData,
    });

    return { data, status };
}

export async function uploadKycBackPhoto(imgSrc) {
    const formData = new FormData();
    formData.append(
        "image",
        dataURItoBlob(imgSrc),
        "credential_image_back.png"
    );

    const { data, status } = await apiRequest({
        endpoint: "/users/image?purpose=credential_image_back",
        method: "POST",
        body: formData,
    });

    return { data, status };
}

export async function uploadKycFacePhoto(imgSrc) {
    const formData = new FormData();
    formData.append("image", dataURItoBlob(imgSrc), "face_photo.png");

    const { data, status } = await apiRequest({
        endpoint: "/users/image?purpose=face_photo",
        method: "POST",
        body: formData,
    });

    return { data, status };
}

export async function getUserData() {
    const { data, status } = await apiRequest({
        endpoint: "/users/person",
    });

    return { data, status };
}

export async function getCountries() {
    return getOrFetch(
        CACHE_KEY.COUNTRIES,
        CACHE_TTL.COUNTRIES,
        () => apiRequest({ endpoint: "/countries" }),
        { shouldCache: (res) => isOkStatus(res.status) }
    );
}

export function getVersion() {
    return apiRequest({ endpoint: "/version", requiresAuth: false });
}

export async function getCredentials() {
    return await apiRequest({ endpoint: "/credentials" });
}

export async function updateUserData(userData) {
    const { data, status } = await apiRequest({
        endpoint: "/users/person",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: userData,
    });

    return { data, status };
}

export async function getUserResidenceData() {
    const { data, status } = await apiRequest({
        endpoint: "/users/residence",
    });

    return { data, status };
}

export async function updateUserResidenceData(residenceData) {
    return await apiRequest({
        endpoint: "/users/residence",
        method: "POST",
        body: residenceData,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

export async function sendPix(payload) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => formData.append(key, payload[key]));

    const { data, status } = await apiRequest({
        endpoint: "/wallet/pix_deposit",
        method: "POST",
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: formData,
    });

    if (isOkStatus(status)) {
        invalidate(CACHE_KEY.TRANSACTIONS);
    }

    return { data, status };
}

export async function getSettings() {
    return getOrFetch(
        CACHE_KEY.SETTINGS,
        settingsTtlMs,
        async () => {
            const { data } = await apiRequest({
                endpoint: "/settings",
                requiresAuth: false,
            });
            if (data && data.settings) {
                return data.settings;
            }
            return undefined;
        },
        { persist: true, shouldCache: (settings) => Boolean(settings) }
    );
}

export async function sendFiat(payload) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => formData.append(key, payload[key]));

    const { data, status } = await apiRequest({
        endpoint: "/transactions/create",
        method: "POST",
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        body: formData,
    });

    if (isOkStatus(status)) {
        invalidate(CACHE_KEY.TRANSACTIONS);
    }

    return { data, status };
}

export async function getContacts(filterType = null) {
    const endpoint = filterType ? `/contacts?filter_type=${filterType}` : "/contacts";
    return await apiRequest({ endpoint });
}

export async function toggleContactFavorite(contactId, isFavorite) {
    const formData = new FormData();
    formData.append("contact_id", contactId);
    formData.append("is_favourite", isFavorite ? "true" : "false");

    return await apiRequest({
        endpoint: "/contacts/is_favourite",
        method: "POST",
        body: formData,
    });
}

export async function deleteContact(contactId) {
    return await apiRequest({
        endpoint: `/contacts/${contactId}`,
        method: "DELETE",
    });
}

export async function getApiTokenStatus() {
    return await apiRequest({
        endpoint: "/users/api-token/status",
    });
}

export async function generateApiToken() {
    return await apiRequest({
        endpoint: "/users/api-token",
        method: "POST",
    });
}

export async function revokeApiToken() {
    return await apiRequest({
        endpoint: "/users/api-token",
        method: "DELETE",
    });
}
