import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MovementsPage from "../../../pages/newMovements";
import { renderWithTamagui } from "../../test-utils";

const getTransactions = vi.hoisted(() => vi.fn());

vi.mock("next/router", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));
vi.mock("../../../api/api", () => ({ getTransactions: () => getTransactions() }));

const tx = (overrides) => ({
    transaction_id: overrides.type,
    status: "COMPLETED",
    payment_currency: "ARS",
    created_at: "2026-09-27T12:00:00Z",
    ...overrides,
});

describe("History — transaction sign", () => {
    it("shows a ledger-neutral deposit_ars without sign, next to signed rows", async () => {
        getTransactions.mockResolvedValue({
            status: 200,
            data: {
                transactions: [
                    tx({ type: "deposit_ars", type_name: "ARS deposit (swap)", is_positive: null, payment_amount: 15000.37 }),
                    tx({ type: "deposit", type_name: "Deposit", is_positive: true, payment_amount: 10, payment_currency: "USDT" }),
                    tx({ type: "fiat_transfer", type_name: "Transfer", is_positive: false, payment_amount: 5, payment_currency: "USDT" }),
                ],
            },
        });
        renderWithTamagui(<MovementsPage />);

        expect(await screen.findByText("$15,000.37 ARS")).toBeInTheDocument();
        expect(screen.queryByText(/[+-]\$15,000\.37/)).not.toBeInTheDocument();
        expect(screen.getByText("+$10.00 USDT")).toBeInTheDocument();
        expect(screen.getByText("-$5.00 USDT")).toBeInTheDocument();
    });
});
