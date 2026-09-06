import { act, render, screen, waitFor } from "@testing-library/react";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Layout } from "../../../components/layout";
import {
    getAccessToken,
    isAuthExpired,
    refreshAccessToken,
} from "../../../utils/auth";

const mocks = vi.hoisted(() => ({
    pathname: "/home",
    push: vi.fn(),
    replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => mocks.pathname,
    useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

vi.mock("../../../components/Header", () => ({ Header: () => null }));
vi.mock("../../../components/HelpModal", () => ({ default: () => null }));
vi.mock("../../../components/NewFooterNavigation/NewFooterNavigation", () => ({
    default: () => null,
}));
vi.mock("../../../context/userContext", () => ({
    useUserContext: () => ({
        helpModalState: false,
        setHelpModalState: vi.fn(),
        user: {},
    }),
}));
vi.mock("../../../utils/auth", () => ({
    getAccessToken: vi.fn(),
    isAuthExpired: vi.fn(),
    refreshAccessToken: vi.fn(),
}));
vi.mock("js-cookie", () => ({
    default: { get: vi.fn(), set: vi.fn() },
}));

const mockedCookiesGet = vi.mocked(Cookies.get);
const mockedGetAccessToken = vi.mocked(getAccessToken);
const mockedIsAuthExpired = vi.mocked(isAuthExpired);
const mockedRefreshAccessToken = vi.mocked(refreshAccessToken);

describe("Layout session lifecycle", () => {
    beforeEach(() => {
        mocks.pathname = "/home";
        mocks.push.mockReset();
        mocks.replace.mockReset();
        mockedCookiesGet.mockReset();
        mockedGetAccessToken.mockReset();
        mockedIsAuthExpired.mockReset();
        mockedRefreshAccessToken.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("restores a protected route before redirecting when the local marker is absent", async () => {
        mockedCookiesGet.mockReturnValue(undefined);
        mockedGetAccessToken.mockResolvedValue("new-access-token");

        render(<Layout>Protected content</Layout>);

        await waitFor(() => {
            expect(mockedGetAccessToken).toHaveBeenCalledOnce();
        });
        expect(mocks.push).not.toHaveBeenCalled();
        expect(mocks.replace).not.toHaveBeenCalled();
        expect(screen.getByText("Protected content")).toBeInTheDocument();
    });

    it("redirects to signup when protected-route recovery fails", async () => {
        mockedCookiesGet.mockReturnValue(undefined);
        mockedGetAccessToken.mockResolvedValue(null);

        render(<Layout>Protected content</Layout>);

        await waitFor(() => {
            expect(mocks.replace).toHaveBeenCalledWith("/newSignUp");
        });
    });

    it("lets the entry route resolve its own destination instead of forcing an auth redirect", async () => {
        mocks.pathname = "/";
        mockedCookiesGet.mockReturnValue(undefined);
        mockedGetAccessToken.mockResolvedValue(null);

        render(<Layout>Entry content</Layout>);

        await act(async () => {});

        // "/" renders <Starting/>, which picks /home or /newSignUp on its own.
        // Layout must not gate it, or the visitor never reaches that decision.
        expect(screen.getByText("Entry content")).toBeInTheDocument();
        expect(mockedGetAccessToken).not.toHaveBeenCalled();
        expect(mockedRefreshAccessToken).not.toHaveBeenCalled();
        expect(mocks.replace).not.toHaveBeenCalled();
    });

    it("does not mount protected content while session recovery is pending", () => {
        mockedCookiesGet.mockReturnValue(undefined);
        mockedGetAccessToken.mockReturnValue(new Promise(() => {}));

        render(<Layout>Protected content</Layout>);

        expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
        expect(screen.getByText("Restoring your session…")).toBeInTheDocument();
    });

    it("recovers when the token expires while a protected page stays mounted", async () => {
        mockedCookiesGet.mockReturnValue("true");
        mockedIsAuthExpired.mockReturnValue(false);

        const rendered = render(<Layout>Protected content</Layout>);
        expect(screen.getByText("Protected content")).toBeInTheDocument();

        // The token expires in place; some unrelated state change re-renders.
        mockedIsAuthExpired.mockReturnValue(true);
        mockedGetAccessToken.mockResolvedValue("new-access-token");
        rendered.rerender(<Layout>Protected content</Layout>);

        // The gate must trigger a restore and re-open once it succeeds,
        // instead of leaving the spinner stuck with no way back.
        await waitFor(() => {
            expect(mockedGetAccessToken).toHaveBeenCalledOnce();
        });
        await waitFor(() => {
            expect(screen.getByText("Protected content")).toBeInTheDocument();
        });
        expect(mocks.replace).not.toHaveBeenCalled();
    });

    it("forces one refresh per hour while a protected page stays open", async () => {
        vi.useFakeTimers();
        mockedCookiesGet.mockReturnValue("true");
        mockedIsAuthExpired.mockReturnValue(false);
        mockedRefreshAccessToken.mockResolvedValue("new-access-token");

        render(<Layout>Protected content</Layout>);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
        });

        expect(mockedRefreshAccessToken).toHaveBeenCalledOnce();
    });

    it("does not redirect after an hourly refresh fails on a public route", async () => {
        vi.useFakeTimers();
        mockedCookiesGet.mockReturnValue("true");
        mockedIsAuthExpired.mockReturnValue(false);
        let resolveRefresh: (token: null) => void;
        mockedRefreshAccessToken.mockReturnValue(
            new Promise<null>((resolve) => {
                resolveRefresh = resolve;
            }),
        );

        const rendered = render(<Layout>Protected content</Layout>);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
        });
        mocks.pathname = "/login";
        rendered.rerender(<Layout>Public content</Layout>);

        await act(async () => {
            resolveRefresh(null);
        });

        expect(mocks.replace).not.toHaveBeenCalled();
    });
});
