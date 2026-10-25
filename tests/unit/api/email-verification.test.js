import { afterEach, describe, expect, it, vi } from "vitest";
import { getVerifyCode, sendVerificationEmail } from "../../../api/api";
import { getAccessToken } from "../../../utils/auth";

vi.mock("../../../utils/auth", () => ({
    getAccessToken: vi.fn(async () => null),
}));

afterEach(() => vi.unstubAllGlobals());

describe("public email verification API", () => {
    it.each([
        ["verify", "/users/verify-email/test-code", "GET"],
        ["resend", "/users/send-verification-email", "POST"],
    ])(
        "allows %s without an authenticated session",
        async (action, endpoint, method) => {
            const fetchMock = vi.fn(async () => ({
                status: 200,
                json: async () => ({}),
            }));
            vi.stubGlobal("fetch", fetchMock);

            const response =
                action === "verify"
                    ? await getVerifyCode("test-code")
                    : await sendVerificationEmail("user@example.com");

            expect(response.status).toBe(200);
            expect(getAccessToken).not.toHaveBeenCalled();
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining(endpoint),
                expect.objectContaining({ method })
            );
            expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty(
                "Authorization"
            );
            if (action === "resend") {
                expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
                    email: "user@example.com",
                });
            }
        }
    );
});
