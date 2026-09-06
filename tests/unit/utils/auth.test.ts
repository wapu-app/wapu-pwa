import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAccessToken } from "../../../utils/auth";

vi.mock("js-cookie", () => ({
    default: { get: vi.fn(), remove: vi.fn(), set: vi.fn() },
}));

const mockedCookiesGet = vi.mocked(Cookies.get);
const mockedCookiesSet = vi.mocked(Cookies.set);

// jsdom serves the page over http, so the cookies are written without `secure`.
const expectedCookieOptions = {
    path: "/",
    sameSite: "strict",
    secure: false,
    expires: 1,
};

const buildToken = (secondsFromNow: number): string => {
    const encode = (value: object): string =>
        Buffer.from(JSON.stringify(value)).toString("base64url");
    const payload = encode({
        exp: Math.floor(Date.now() / 1000) + secondsFromNow,
    });
    return `${encode({ alg: "none" })}.${payload}.signature`;
};

describe("getAccessToken", () => {
    beforeEach(() => {
        mockedCookiesGet.mockReset();
        mockedCookiesSet.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("restores the isLoggedIn marker when the stored token is still valid", async () => {
        const token = buildToken(60 * 60);
        mockedCookiesGet.mockReturnValue(token);
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        await expect(getAccessToken()).resolves.toBe(token);

        // The marker drives the layout session gate and the hourly refresh, so
        // a valid token must never be handed out while it says logged out.
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "isLoggedIn",
            "true",
            expectedCookieOptions,
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("refreshes through the API when the stored token expired", async () => {
        mockedCookiesGet.mockReturnValue(buildToken(-60));
        const fetchMock = vi.fn().mockResolvedValue({
            status: 200,
            json: async () => ({ access_token: "refreshed-token" }),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(getAccessToken()).resolves.toBe("refreshed-token");

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "access_token",
            "refreshed-token",
            expectedCookieOptions,
        );
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "isLoggedIn",
            "true",
            expectedCookieOptions,
        );
    });

    it("clears the session when the refresh is rejected", async () => {
        mockedCookiesGet.mockReturnValue(buildToken(-60));
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                status: 401,
                json: async () => ({}),
            }),
        );

        await expect(getAccessToken()).resolves.toBeNull();

        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "isLoggedIn",
            "false",
            expectedCookieOptions,
        );
        expect(Cookies.remove).toHaveBeenCalledWith("access_token");
    });
});
