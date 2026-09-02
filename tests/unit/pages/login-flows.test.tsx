import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Cookies from "js-cookie";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginUser, loginWithTempPassword, sendLoginEmail } from "../../../api/api";
import { createLog } from "../../../utils/createLog";
import Login from "../../../pages/login";
import { renderWithTamagui } from "../../test-utils";

const mocks = vi.hoisted(() => ({
    back: vi.fn(),
    push: vi.fn(),
    setNotShow: vi.fn(),
    router: {
        asPath: "/login",
        query: {} as Record<string, string>,
        route: "/login",
    },
    userAgent: {
        isIOS: false,
        isMobile: true,
        isStandalone: false,
        userAgent: "Chrome",
    },
}));

vi.mock("next/router", () => ({
    useRouter: () => ({
        asPath: mocks.router.asPath,
        back: mocks.back,
        push: mocks.push,
        query: mocks.router.query,
        route: mocks.router.route,
    }),
}));

vi.mock("../../../context/userContext", () => ({
    useUserContext: () => ({
        notShow: false,
        setNotShow: mocks.setNotShow,
    }),
}));

vi.mock("../../../hooks/userAgent", () => ({
    default: () => mocks.userAgent,
}));

vi.mock("../../../utils/createLog", () => ({
    createLog: vi.fn(async () => undefined),
}));

vi.mock("../../../api/api", () => ({
    loginUser: vi.fn(),
    loginWithTempPassword: vi.fn(),
    sendLoginEmail: vi.fn(),
}));

vi.mock("js-cookie", () => ({
    default: {
        set: vi.fn(),
    },
}));

const mockedLoginUser = vi.mocked(loginUser);
const mockedLoginWithTempPassword = vi.mocked(loginWithTempPassword);
const mockedSendLoginEmail = vi.mocked(sendLoginEmail);
const mockedCreateLog = vi.mocked(createLog);
const mockedCookiesSet = vi.mocked(Cookies.set);

function resetRouter(path: string): void {
    mocks.router.asPath = path;
    mocks.router.route = path.split("?")[0] ?? path;
    mocks.router.query = {};
}

async function fillLoginForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await user.type(
        screen.getByPlaceholderText("Enter your email address"),
        "user@example.com",
    );
    await user.type(screen.getByPlaceholderText("Enter your password"), "password-123");
}

describe("modern login flow", () => {
    beforeEach(() => {
        resetRouter("/login");
        mocks.back.mockClear();
        mocks.push.mockClear();
        mocks.setNotShow.mockClear();
        mockedLoginUser.mockReset();
        mockedLoginWithTempPassword.mockReset();
        mockedSendLoginEmail.mockReset();
        mockedCreateLog.mockClear();
        mockedCookiesSet.mockClear();
    });

    it("logs in with credentials, stores cookies and navigates home", async () => {
        const user = userEvent.setup();
        mockedLoginUser.mockResolvedValue({
            data: { access_token: "access-token" },
            status: 200,
        });
        renderWithTamagui(<Login />);

        await fillLoginForm(user);
        await user.click(screen.getByRole("button", { name: "Go to Wapupay" }));

        await waitFor(() => {
            expect(mockedLoginUser).toHaveBeenCalledWith(
                "user@example.com",
                "password-123",
            );
        });
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "access_token",
            "access-token",
            expect.objectContaining({ sameSite: "strict" }),
        );
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "isLoggedIn",
            true,
            expect.objectContaining({ sameSite: "strict" }),
        );
        expect(mockedCreateLog).toHaveBeenCalledWith(
            "Chrome",
            false,
            false,
            true,
            "login",
            { email: "user@example.com" },
        );
        expect(mocks.push).toHaveBeenCalledWith("/home");
    });

    it("shows credential errors without navigating", async () => {
        const user = userEvent.setup();
        mockedLoginUser.mockResolvedValue({
            data: { error: "Invalid credentials" },
            status: 400,
        });
        renderWithTamagui(<Login />);

        await fillLoginForm(user);
        await user.click(screen.getByRole("button", { name: "Go to Wapupay" }));

        expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
        expect(mocks.push).not.toHaveBeenCalledWith("/home");
    });

    it("sends a magic link and renders the inbox confirmation", async () => {
        const user = userEvent.setup();
        mocks.router.asPath = "/login?type=magic-link";
        mocks.router.query = { type: "magic-link" };
        mockedSendLoginEmail.mockResolvedValue({ data: {}, status: 200 });
        renderWithTamagui(<Login />);

        await user.type(
            screen.getByPlaceholderText("Enter your email address"),
            "user@example.com",
        );
        await user.click(screen.getByRole("button", { name: "Send Magic Link" }));

        await waitFor(() => {
            expect(mockedSendLoginEmail).toHaveBeenCalledWith("user@example.com");
        });
        expect(
            await screen.findByText("Please check your email inbox for a login link."),
        ).toBeInTheDocument();
        expect(mockedCreateLog).toHaveBeenCalledWith(
            "Chrome",
            false,
            false,
            true,
            "login by link",
            { email: "user@example.com" },
        );
    });

    it("shows magic-link request errors", async () => {
        const user = userEvent.setup();
        mocks.router.asPath = "/login?type=magic-link";
        mocks.router.query = { type: "magic-link" };
        mockedSendLoginEmail.mockResolvedValue({
            data: { error: "Unable to send login link" },
            status: 400,
        });
        renderWithTamagui(<Login />);

        await user.type(
            screen.getByPlaceholderText("Enter your email address"),
            "user@example.com",
        );
        await user.click(screen.getByRole("button", { name: "Send Magic Link" }));

        expect(await screen.findByText("Unable to send login link")).toBeInTheDocument();
        expect(mocks.push).not.toHaveBeenCalled();
    });

    it("logs in from a temporary password link", async () => {
        mocks.router.asPath = "/login?type=magic-link&tempPassword=temp-123";
        mocks.router.query = {
            tempPassword: "temp-123",
            type: "magic-link",
        };
        mockedLoginWithTempPassword.mockResolvedValue({
            data: { access_token: "temp-token" },
            status: 200,
        });
        renderWithTamagui(<Login />);

        await waitFor(() => {
            expect(mockedLoginWithTempPassword).toHaveBeenCalledWith("temp-123");
        });
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "access_token",
            "temp-token",
            expect.objectContaining({ sameSite: "strict" }),
        );
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "isLoggedIn",
            "true",
            expect.objectContaining({ sameSite: "strict" }),
        );
        expect(mocks.push).toHaveBeenCalledWith("/home");
    });
});
