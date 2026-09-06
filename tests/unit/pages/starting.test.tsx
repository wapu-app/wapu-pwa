import { render, waitFor } from "@testing-library/react";
import Cookies from "js-cookie";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Starting from "../../../pages/starting";
import { getAccessToken, isAuthExpired } from "../../../utils/auth";

const mocks = vi.hoisted(() => ({
    replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("../../../utils/auth", () => ({
    getAccessToken: vi.fn(),
    isAuthExpired: vi.fn(),
}));

vi.mock("js-cookie", () => ({
    default: { get: vi.fn() },
}));

const mockedCookiesGet = vi.mocked(Cookies.get);
const mockedGetAccessToken = vi.mocked(getAccessToken);
const mockedIsAuthExpired = vi.mocked(isAuthExpired);

describe("Starting", () => {
    beforeEach(() => {
        mocks.replace.mockReset();
        mockedCookiesGet.mockReset();
        mockedGetAccessToken.mockReset();
        mockedIsAuthExpired.mockReset();
    });

    it("attempts refresh before sending a visitor without a local marker to signup", async () => {
        mockedCookiesGet.mockReturnValue(undefined);
        mockedGetAccessToken.mockResolvedValue(null);

        render(<Starting />);

        await waitFor(() => {
            expect(mocks.replace).toHaveBeenCalledWith("/newSignUp");
        });
        expect(mockedGetAccessToken).toHaveBeenCalledOnce();
    });

    it("restores a returning visitor without a local marker when refresh succeeds", async () => {
        mockedCookiesGet.mockReturnValue(undefined);
        mockedGetAccessToken.mockResolvedValue("refreshed-token");

        render(<Starting />);

        await waitFor(() => {
            expect(mocks.replace).toHaveBeenCalledWith("/home");
        });
    });

    it("routes a visitor with a valid access token home", async () => {
        mockedCookiesGet.mockReturnValue("true");
        mockedIsAuthExpired.mockReturnValue(false);

        render(<Starting />);

        await waitFor(() => {
            expect(mocks.replace).toHaveBeenCalledWith("/home");
        });
        expect(mockedGetAccessToken).not.toHaveBeenCalled();
    });

    it("routes home when an expired access token refreshes", async () => {
        mockedCookiesGet.mockReturnValue("true");
        mockedIsAuthExpired.mockReturnValue(true);
        mockedGetAccessToken.mockResolvedValue("refreshed-token");

        render(<Starting />);

        await waitFor(() => {
            expect(mocks.replace).toHaveBeenCalledWith("/home");
        });
    });

    it("routes to signup when an expired access token cannot refresh", async () => {
        mockedCookiesGet.mockReturnValue("true");
        mockedIsAuthExpired.mockReturnValue(true);
        mockedGetAccessToken.mockResolvedValue(null);

        render(<Starting />);

        await waitFor(() => {
            expect(mocks.replace).toHaveBeenCalledWith("/newSignUp");
        });
    });
});
