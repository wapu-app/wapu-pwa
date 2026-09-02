import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Cookies from "js-cookie";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginWithTempPassword, signupUser } from "../../../api/api";
import { createLog } from "../../../utils/createLog";
import SignUp from "../../../pages/newSignUp";
import { renderWithTamagui } from "../../test-utils";

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
    router: {
        asPath: "/newSignUp",
        query: {} as Record<string, string>,
        route: "/newSignUp",
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
        push: mocks.push,
        query: mocks.router.query,
        route: mocks.router.route,
    }),
}));

vi.mock("../../../hooks/userAgent", () => ({
    default: () => mocks.userAgent,
}));

vi.mock("../../../utils/createLog", () => ({
    createLog: vi.fn(async () => undefined),
}));

vi.mock("../../../api/api", () => ({
    loginWithTempPassword: vi.fn(),
    signupUser: vi.fn(),
}));

vi.mock("js-cookie", () => ({
    default: {
        set: vi.fn(),
    },
}));

const mockedLoginWithTempPassword = vi.mocked(loginWithTempPassword);
const mockedSignupUser = vi.mocked(signupUser);
const mockedCookiesSet = vi.mocked(Cookies.set);
const mockedCreateLog = vi.mocked(createLog);

function resetRouter(): void {
    mocks.router.asPath = "/newSignUp";
    mocks.router.route = "/newSignUp";
    mocks.router.query = {};
}

async function openSignupForm(): Promise<void> {
    const user = userEvent.setup();
    renderWithTamagui(<SignUp />);
    await user.click(screen.getByRole("button", { name: "Sign Up" }));
}

async function fillSignupForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await user.type(
        screen.getByPlaceholderText("Enter your email address"),
        "new@example.com",
    );
    await user.type(
        screen.getByPlaceholderText("Enter your password"),
        "long-enough-password",
    );
}

describe("modern signup flow", () => {
    beforeEach(() => {
        resetRouter();
        mocks.push.mockClear();
        mockedLoginWithTempPassword.mockReset();
        mockedSignupUser.mockReset();
        mockedCookiesSet.mockClear();
        mockedCreateLog.mockClear();
    });

    it("requires accepted terms and rejects short passwords", async () => {
        await openSignupForm();
        const user = userEvent.setup();

        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
        await user.click(screen.getByRole("checkbox"));
        await user.type(
            screen.getByPlaceholderText("Enter your email address"),
            "new@example.com",
        );
        await user.type(screen.getByPlaceholderText("Enter your password"), "short");
        await user.click(screen.getByRole("button", { name: "Next" }));

        expect(
            await screen.findByText("Password must be at least 13 characters long."),
        ).toBeInTheDocument();
        expect(mockedSignupUser).not.toHaveBeenCalled();
    });

    it("submits signup with referral and renders verification sent", async () => {
        const user = userEvent.setup();
        mocks.router.asPath = "/newSignUp?ref=REF123";
        mocks.router.query = { ref: "REF123" };
        mockedSignupUser.mockResolvedValue({
            data: { access_token: "signup-token" },
            status: 201,
        });
        renderWithTamagui(<SignUp />);

        await user.click(screen.getByRole("checkbox"));
        await fillSignupForm(user);
        await user.click(screen.getByRole("button", { name: "Next" }));

        await waitFor(() => {
            expect(mockedSignupUser).toHaveBeenCalledWith(
                "new@example.com",
                "long-enough-password",
                "REF123",
            );
        });
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "access_token",
            "signup-token",
            expect.objectContaining({ sameSite: "strict" }),
        );
        expect(
            await screen.findByText("Great! We sent you verification to your email."),
        ).toBeInTheDocument();
    });

    it("shows signup API errors", async () => {
        const user = userEvent.setup();
        mockedSignupUser.mockResolvedValue({
            data: { error: "Email already exists" },
            status: 409,
        });
        await openSignupForm();

        await user.click(screen.getByRole("checkbox"));
        await fillSignupForm(user);
        await user.click(screen.getByRole("button", { name: "Next" }));

        expect(await screen.findByText("Email already exists")).toBeInTheDocument();
        expect(mockedCookiesSet).not.toHaveBeenCalledWith(
            "access_token",
            expect.anything(),
            expect.anything(),
        );
    });

    it("authenticates a signup temporary-password link and routes home", async () => {
        mocks.router.asPath = "/newSignUp?tempPassword=temp-123";
        mocks.router.query = { tempPassword: "temp-123" };
        mockedLoginWithTempPassword.mockResolvedValue({
            data: { access_token: "temp-token" },
            status: 200,
        });
        renderWithTamagui(<SignUp />);

        await waitFor(() => {
            expect(mockedLoginWithTempPassword).toHaveBeenCalledWith("temp-123");
        });
        expect(mockedCookiesSet).toHaveBeenCalledWith(
            "access_token",
            "temp-token",
            expect.objectContaining({ sameSite: "strict" }),
        );
        expect(mocks.push).toHaveBeenCalledWith("/home");
    });
});
