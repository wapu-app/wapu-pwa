import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiKey from "../../../pages/apiKey";
import { generateApiToken, getApiTokenStatus, revokeApiToken } from "../../../api/api";
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

const key = (id, label, prefix, last = null) => ({
    id,
    label,
    token_prefix: prefix,
    last_used_at: last,
});
const statusOf = (keys) => ({
    status: 200,
    data: { has_token: keys.length > 0, is_active: keys.length > 0, keys, limit: 3 },
});

describe("ApiKey page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders one card per active key", async () => {
        getApiTokenStatus.mockResolvedValue(
            statusOf([
                key(2, "Server", "wapu_bbb", "2026-11-20T10:00:00Z"),
                key(1, null, "wapu_aaa"),
            ])
        );
        renderWithTamagui(<ApiKey />);

        expect(await screen.findByText("Server")).toBeTruthy();
        expect(screen.getByText("wapu_bbb…")).toBeTruthy();
        expect(screen.getByText("Unnamed key")).toBeTruthy();
        expect(screen.getByText("wapu_aaa…")).toBeTruthy();
        expect(screen.getByText("Never used")).toBeTruthy();
        expect(screen.getByText("2 of 3 keys in use")).toBeTruthy();
        expect(screen.queryByText("Regenerate")).toBeNull();
    });

    it("creates a key with its label and shows the token once", async () => {
        getApiTokenStatus.mockResolvedValue(statusOf([]));
        generateApiToken.mockResolvedValue({
            status: 201,
            data: { id: 5, label: "CI", token: "wapu_secret_token", token_prefix: "wapu_sec" },
        });
        renderWithTamagui(<ApiKey />);

        await userEvent.type(await screen.findByPlaceholderText(/Production server/), "CI");
        await userEvent.click(screen.getByText("Create API key"));

        expect(generateApiToken).toHaveBeenCalledWith("CI");
        const qr = await screen.findByAltText("API key QR code");
        expect(qr.getAttribute("src")).toBe("qr:wapu_secret_token");
        expect(screen.getByText("CI")).toBeTruthy();
    });

    it("deletes the chosen key by id after confirming", async () => {
        getApiTokenStatus.mockResolvedValue(
            statusOf([key(2, "Server", "wapu_bbb"), key(1, "Bot", "wapu_aaa")])
        );
        revokeApiToken.mockResolvedValue({ status: 200, data: {} });
        renderWithTamagui(<ApiKey />);

        await screen.findByText("Bot");
        await userEvent.click(screen.getAllByText("Delete")[1]);
        await userEvent.click(screen.getByText("Yes, delete"));

        await waitFor(() => expect(revokeApiToken).toHaveBeenCalledWith(1));
    });

    it("disables creation when the limit is reached", async () => {
        getApiTokenStatus.mockResolvedValue(
            statusOf([key(3, "A", "wapu_a"), key(2, "B", "wapu_b"), key(1, "C", "wapu_c")])
        );
        renderWithTamagui(<ApiKey />);

        expect(await screen.findByText(/reached the limit of 3 active keys/)).toBeTruthy();
        expect(screen.getByText("Create API key").closest("button").disabled).toBe(true);
    });

    it("shows the limit note on a 409 from the backend", async () => {
        getApiTokenStatus.mockResolvedValue(statusOf([key(1, "A", "wapu_a")]));
        generateApiToken.mockResolvedValue({
            status: 409,
            data: { error: "API key limit reached", limit: 3 },
        });
        renderWithTamagui(<ApiKey />);

        await userEvent.click(await screen.findByText("Create API key"));
        expect(await screen.findByText(/reached the limit of 3 active keys/)).toBeTruthy();
    });

    it("falls back to the summary fields on an older backend", async () => {
        getApiTokenStatus.mockResolvedValue({
            status: 200,
            data: { is_active: true, token_prefix: "wapu_old", last_used_at: null },
        });
        renderWithTamagui(<ApiKey />);

        expect(await screen.findByText("wapu_old…")).toBeTruthy();
    });
});

describe("ApiKey page QR code", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows the new key as a QR code right after generating it", async () => {
        getApiTokenStatus.mockResolvedValue(statusOf([]));
        generateApiToken.mockResolvedValue({
            status: 201,
            data: { token: "wapu_secret_token", token_prefix: "wapu_sec" },
        });

        renderWithTamagui(<ApiKey />);
        await userEvent.click(await screen.findByText("Create API key"));

        const qr = await screen.findByAltText("API key QR code");
        expect(qr.getAttribute("src")).toBe("qr:wapu_secret_token");
    });

    it("does not show a QR code for an existing hidden key", async () => {
        getApiTokenStatus.mockResolvedValue(statusOf([key(1, null, "wapu_sec")]));

        renderWithTamagui(<ApiKey />);

        await waitFor(() => expect(screen.getByText("wapu_sec…")).toBeTruthy());
        expect(screen.queryByAltText("API key QR code")).toBeNull();
    });
});
