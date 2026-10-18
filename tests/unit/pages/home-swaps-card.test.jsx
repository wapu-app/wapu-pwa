import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "../../../pages/home";
import { renderWithTamagui } from "../../test-utils";

const mocks = vi.hoisted(() => ({ user: {}, getUserSettings: vi.fn() }));

vi.mock("next/router", () => ({ useRouter: () => ({ push: vi.fn(), query: {} }) }));
vi.mock("../../../context/userContext", () => ({
    useUserContext: () => ({ getUser: vi.fn(), user: mocks.user }),
}));
vi.mock("../../../api/api", () => ({
    getSettings: async () => ({}),
    getUserSettings: mocks.getUserSettings,
}));
vi.mock("../../../components/ExchangeRateCard/ExchangeRateCard", () => ({ default: () => null }));
vi.mock("../../../components/ExchangeRateCalculatorModal", () => ({ default: () => null }));
vi.mock("../../../components/Referral/referral", () => ({ default: () => null }));
vi.mock("../../../components/TamaguiSendModal", () => ({ default: () => null }));
vi.mock("../../../components/NewInfoCard/NewInfoCard", () => ({ default: () => null }));

describe("Home — beta Swaps card", () => {
    beforeEach(() => {
        mocks.user = { swapsHomeCard: true, kycStatus: "Approved" };
        mocks.getUserSettings.mockResolvedValue({ status: 200, data: { beta_version: false } });
    });

    afterEach(() => {
        mocks.user = {};
    });

    it("shows the entire card for a beta user even when the old flag is off", async () => {
        mocks.user.swapsHomeCard = false;
        mocks.getUserSettings.mockResolvedValue({ status: 200, data: { beta_version: true } });
        await act(async () => renderWithTamagui(<Home />));
        expect(screen.getByText("Buy Bitcoin without KYC")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Swaps" })).toBeInTheDocument();
    });

    it.each([
        { status: 200, data: { beta_version: false } },
        { status: 200, data: {} },
        { status: 200, data: { beta_version: "true" } },
        { status: 500, data: { beta_version: true } },
    ])("hides the entire card unless settings confirm beta: %j", async (settings) => {
        mocks.getUserSettings.mockResolvedValue(settings);
        await act(async () => renderWithTamagui(<Home />));
        expect(screen.queryByText("Buy Bitcoin without KYC")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Swaps" })).not.toBeInTheDocument();
    });

    it("hides the card until beta settings finish loading", async () => {
        let resolveSettings;
        mocks.getUserSettings.mockReturnValue(new Promise((resolve) => { resolveSettings = resolve; }));
        await act(async () => renderWithTamagui(<Home />));
        expect(screen.queryByText("Buy Bitcoin without KYC")).not.toBeInTheDocument();
        await act(async () => resolveSettings({ status: 200, data: { beta_version: true } }));
        expect(screen.getByText("Buy Bitcoin without KYC")).toBeInTheDocument();
    });

    it("keeps the card hidden when the settings request fails", async () => {
        mocks.getUserSettings.mockRejectedValue(new Error("Settings unavailable"));
        await act(async () => renderWithTamagui(<Home />));
        expect(screen.queryByText("Buy Bitcoin without KYC")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Swaps" })).not.toBeInTheDocument();
    });
});
