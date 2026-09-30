import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "../../../pages/home";
import { renderWithTamagui } from "../../test-utils";

const mocks = vi.hoisted(() => ({ user: {} }));

vi.mock("next/router", () => ({ useRouter: () => ({ push: vi.fn(), query: {} }) }));
vi.mock("../../../context/userContext", () => ({
    useUserContext: () => ({ getUser: vi.fn(), user: mocks.user }),
}));
vi.mock("../../../api/api", () => ({ getSettings: async () => ({}) }));
vi.mock("../../../components/ExchangeRateCard/ExchangeRateCard", () => ({ default: () => null }));
vi.mock("../../../components/ExchangeRateCalculatorModal", () => ({ default: () => null }));
vi.mock("../../../components/Referral/referral", () => ({ default: () => null }));
vi.mock("../../../components/TamaguiSendModal", () => ({ default: () => null }));
vi.mock("../../../components/NewInfoCard/NewInfoCard", () => ({ default: () => null }));

describe("Home — Swaps card flag", () => {
    afterEach(() => {
        mocks.user = {};
    });

    it("shows the Swaps card when swaps_home_card is on", () => {
        mocks.user = { swapsHomeCard: true, kycStatus: "Approved" };
        renderWithTamagui(<Home />);
        expect(screen.getByText("Buy Bitcoin without KYC")).toBeInTheDocument();
    });

    it("hides the Swaps card when swaps_home_card is off", () => {
        mocks.user = { swapsHomeCard: false, kycStatus: "Approved" };
        renderWithTamagui(<Home />);
        expect(screen.queryByText("Buy Bitcoin without KYC")).not.toBeInTheDocument();
    });

    it("hides the Swaps card until the user loads", () => {
        renderWithTamagui(<Home />);
        expect(screen.queryByText("Buy Bitcoin without KYC")).not.toBeInTheDocument();
    });
});
