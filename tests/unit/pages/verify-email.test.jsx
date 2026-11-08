import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerifyEmail from "../../../pages/verifyEmail";
import { getVerifyCode, sendVerificationEmail } from "../../../api/api";
import { renderWithTamagui } from "../../test-utils";

const mocks = vi.hoisted(() => ({
    router: { isReady: true, query: { code: "test-code" }, push: vi.fn() },
}));
vi.mock("next/router", () => ({ useRouter: () => mocks.router }));
vi.mock("../../../api/api", () => ({
    getVerifyCode: vi.fn(),
    sendVerificationEmail: vi.fn(),
}));

describe("email verification", () => {
    beforeEach(() => {
        mocks.router.isReady = true;
        mocks.router.query = { code: "test-code" };
        mocks.router.push.mockReset();
        vi.mocked(getVerifyCode).mockReset();
        vi.mocked(sendVerificationEmail).mockReset();
    });

    it("waits for router hydration and verification before offering an action", async () => {
        mocks.router.isReady = false;
        let resolveVerification;
        vi.mocked(getVerifyCode).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveVerification = resolve;
                })
        );
        const view = renderWithTamagui(<VerifyEmail />);
        expect(
            screen.getByRole("heading", { name: "Verifying your email" })
        ).toBeInTheDocument();
        expect(getVerifyCode).not.toHaveBeenCalled();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        mocks.router.isReady = true;
        view.rerender(<VerifyEmail />);
        expect(getVerifyCode).toHaveBeenCalledWith("test-code");
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        await act(async () => resolveVerification({ status: 200 }));
        await userEvent.click(
            screen.getByRole("button", { name: "Continue to Wapu" })
        );
        expect(mocks.router.push).toHaveBeenCalledWith("/home");
    });

    it.each([undefined, "", ["one", "two"]])(
        "handles a missing or malformed code: %s",
        async (code) => {
            mocks.router.query = { code };
            renderWithTamagui(<VerifyEmail />);
            expect(
                await screen.findByRole("heading", {
                    name: "Let's try a new link",
                })
            ).toBeInTheDocument();
            expect(getVerifyCode).not.toHaveBeenCalled();
        }
    );

    it("retries a connection failure and shows success", async () => {
        vi.mocked(getVerifyCode)
            .mockRejectedValueOnce(new Error("offline"))
            .mockResolvedValueOnce({ status: 200 });
        renderWithTamagui(<VerifyEmail />);
        await userEvent.click(
            await screen.findByRole("button", { name: "Try again" })
        );
        expect(
            await screen.findByRole("heading", { name: "Email verified!" })
        ).toBeInTheDocument();
        expect(getVerifyCode).toHaveBeenCalledTimes(2);
    });

    it("offers retry for a server error", async () => {
        vi.mocked(getVerifyCode).mockResolvedValue({ status: 503 });
        renderWithTamagui(<VerifyEmail />);
        expect(
            await screen.findByRole("button", { name: "Try again" })
        ).toBeInTheDocument();
    });

    it("validates an email, sends once while pending and keeps the inbox confirmation visible", async () => {
        const user = userEvent.setup();
        vi.mocked(getVerifyCode).mockResolvedValue({ status: 400 });
        let resolveSend;
        vi.mocked(sendVerificationEmail).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveSend = resolve;
                })
        );
        renderWithTamagui(<VerifyEmail />);
        await user.click(
            await screen.findByRole("button", { name: "Get a new link" })
        );
        await user.click(
            screen.getByRole("button", { name: "Send verification link" })
        );
        expect(screen.getByRole("alert")).toHaveTextContent(
            "Please enter a valid email address."
        );
        expect(sendVerificationEmail).not.toHaveBeenCalled();
        await user.type(
            screen.getByRole("textbox", { name: "Email address" }),
            "user@example.com{Enter}"
        );
        await waitFor(() =>
            expect(sendVerificationEmail).toHaveBeenCalledWith(
                "user@example.com"
            )
        );
        expect(screen.getAllByRole("button")[0]).toBeDisabled();
        await user.keyboard("{Enter}");
        expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
        await act(async () => resolveSend({ status: 200 }));
        expect(
            screen.getByRole("heading", { name: "Check your inbox" })
        ).toBeInTheDocument();
        expect(mocks.router.push).not.toHaveBeenCalled();
        await user.click(screen.getByRole("button", { name: "Back to login" }));
        expect(mocks.router.push).toHaveBeenCalledWith("/login");
    });

    it.each(["server", "network"])(
        "keeps the resend form usable after a %s failure",
        async (failure) => {
            vi.mocked(getVerifyCode).mockResolvedValue({ status: 400 });
            if (failure === "server")
                vi.mocked(sendVerificationEmail).mockResolvedValue({
                    status: 500,
                });
            else
                vi.mocked(sendVerificationEmail).mockRejectedValue(
                    new Error("offline")
                );
            const user = userEvent.setup();
            renderWithTamagui(<VerifyEmail />);
            await user.click(
                await screen.findByRole("button", { name: "Get a new link" })
            );
            await user.type(
                screen.getByRole("textbox", { name: "Email address" }),
                "user@example.com"
            );
            await user.click(
                screen.getByRole("button", { name: "Send verification link" })
            );
            expect(await screen.findByRole("alert")).toHaveTextContent(
                "We couldn't send the link."
            );
            expect(
                screen.getByRole("button", { name: "Send verification link" })
            ).toBeEnabled();
            expect(mocks.router.push).not.toHaveBeenCalled();
        }
    );
});
