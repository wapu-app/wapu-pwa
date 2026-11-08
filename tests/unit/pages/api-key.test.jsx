import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKey from "../../../pages/apiKey";
import { generateApiToken, getApiTokenStatus } from "../../../api/api";
import { renderWithTamagui } from "../../test-utils";

vi.mock("next/router", () => ({
    useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("../../../api/api", () => ({
    getApiTokenStatus: vi.fn(),
    generateApiToken: vi.fn(),
    revokeApiToken: vi.fn(),
}));

vi.mock("qrcode.react", async () => {
    const React = await vi.importActual("react");
    return {
        QRCodeSVG: ({ value }) =>
            React.createElement("img", { alt: "API key QR code", src: `qr:${value}` }),
    };
});

describe("ApiKey page QR code", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows the new key as a QR code right after generating it", async () => {
        getApiTokenStatus.mockResolvedValue({ status: 200, data: { is_active: false } });
        generateApiToken.mockResolvedValue({
            status: 201,
            data: { token: "wapu_secret_token", token_prefix: "wapu_sec" },
        });

        renderWithTamagui(<ApiKey />);
        await userEvent.click(await screen.findByText("Generate API key"));

        const qr = await screen.findByAltText("API key QR code");
        expect(qr.getAttribute("src")).toBe("qr:wapu_secret_token");
    });

    it("does not show a QR code for an existing hidden key", async () => {
        getApiTokenStatus.mockResolvedValue({
            status: 200,
            data: { is_active: true, token_prefix: "wapu_sec", last_used_at: null },
        });

        renderWithTamagui(<ApiKey />);

        await waitFor(() => expect(screen.getByText("Regenerate")).toBeTruthy());
        expect(screen.queryByAltText("API key QR code")).toBeNull();
    });
});
