import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MovementsPage from "../../../pages/newMovements";
import { renderWithTamagui } from "../../test-utils";

const { getTransactions, push } = vi.hoisted(() => ({ getTransactions: vi.fn(), push: vi.fn() }));

vi.mock("next/router", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));
vi.mock("../../../api/api", () => ({ getTransactions: (page) => getTransactions(page) }));

const onePage = { page: 1, per_page: 7, total: 3, total_pages: 1, has_next: false, has_prev: false };

const pageOf = (transactions, pagination = onePage) => ({
    status: 200,
    data: { transactions, pagination },
});

const swap = (overrides) => ({
    kind: "swap",
    swap_id: "swap-uuid-1",
    from: "ARS",
    to: "BTC_LIGHTNING",
    status: "COMPLETED",
    amount_out_quoted: 21000,
    amount_out_final: 21821,
    created_at: "2026-09-28T12:00:00Z",
    ...overrides,
});

const tx = (overrides) => ({
    kind: "transaction",
    transaction_id: overrides.type,
    status: "COMPLETED",
    payment_currency: "ARS",
    created_at: "2026-09-27T12:00:00Z",
    ...overrides,
});

beforeEach(() => {
    getTransactions.mockReset();
    push.mockReset();
});

describe("History — transaction sign", () => {
    it("shows a ledger-neutral deposit_ars without sign, next to signed rows", async () => {
        getTransactions.mockResolvedValue(
            pageOf([
                tx({ type: "deposit_ars", type_name: "ARS deposit (swap)", is_positive: null, payment_amount: 15000.37 }),
                tx({ type: "deposit", type_name: "Deposit", is_positive: true, payment_amount: 10, payment_currency: "USDT" }),
                tx({ type: "fiat_transfer", type_name: "Transfer", is_positive: false, payment_amount: 5, payment_currency: "USDT" }),
            ])
        );
        renderWithTamagui(<MovementsPage />);

        expect(await screen.findByText("$15,000.37 ARS")).toBeInTheDocument();
        expect(screen.queryByText(/[+-]\$15,000\.37/)).not.toBeInTheDocument();
        expect(screen.getByText("+$10.00 USDT")).toBeInTheDocument();
        expect(screen.getByText("-$5.00 USDT")).toBeInTheDocument();
    });
});

describe("History — swaps", () => {
    it("shows a swap row with the pair, the status and the amount in sats", async () => {
        getTransactions.mockResolvedValue(pageOf([swap()]));
        renderWithTamagui(<MovementsPage />);

        expect(await screen.findByText("Swap ARS → BTC Lightning")).toBeInTheDocument();
        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(screen.getByText("21821 SAT")).toBeInTheDocument();
    });

    it("falls back to the quoted amount while the swap has no final amount", async () => {
        getTransactions.mockResolvedValue(pageOf([swap({ status: "WAITING_DEPOSIT", amount_out_final: null })]));
        renderWithTamagui(<MovementsPage />);

        expect(await screen.findByText("21000 SAT")).toBeInTheDocument();
        expect(screen.getByText("Waiting for deposit")).toBeInTheDocument();
    });

    it("opens the swap detail on /swaps", async () => {
        getTransactions.mockResolvedValue(pageOf([swap()]));
        renderWithTamagui(<MovementsPage />);

        fireEvent.click(await screen.findByText("Swap ARS → BTC Lightning"));
        expect(push).toHaveBeenCalledWith("/swaps?id=swap-uuid-1");
    });
});

describe("History — pagination", () => {
    const twoPages = { page: 1, per_page: 7, total: 10, total_pages: 2, has_next: true, has_prev: false };

    it("loads page 1 and hides the pager when everything fits in one page", async () => {
        getTransactions.mockResolvedValue(pageOf([tx({ type: "deposit", type_name: "Deposit", is_positive: true, payment_amount: 1 })]));
        renderWithTamagui(<MovementsPage />);

        expect(await screen.findByText("Deposit")).toBeInTheDocument();
        expect(getTransactions).toHaveBeenCalledWith(1);
        expect(screen.queryByText("Next")).not.toBeInTheDocument();
        expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    });

    it("moves to the next page and back", async () => {
        getTransactions.mockImplementation(async (page) =>
            page === 1
                ? pageOf([tx({ type: "deposit", type_name: "First page row", is_positive: true, payment_amount: 1 })], twoPages)
                : pageOf([swap({ swap_id: "swap-page-2" })], { ...twoPages, page: 2, has_next: false, has_prev: true })
        );
        renderWithTamagui(<MovementsPage />);

        expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
        expect(getTransactions).toHaveBeenLastCalledWith(2);
        expect(screen.getByText("Swap ARS → BTC Lightning")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        await waitFor(() => expect(screen.getByText("Page 1 of 2")).toBeInTheDocument());
        expect(getTransactions).toHaveBeenLastCalledWith(1);
    });
});
