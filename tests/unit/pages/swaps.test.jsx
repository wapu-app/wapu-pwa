import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SwapsPage from "../../../pages/swaps";
import { LANG_STORAGE_KEY } from "../../../components/Swaps/i18n";
import { renderWithTamagui } from "../../test-utils";

const mocks = vi.hoisted(() => ({
    createSwap: vi.fn(),
    getSwap: vi.fn(),
    getSwapQuote: vi.fn(),
    push: vi.fn(),
    query: {},
}));

vi.mock("next/router", () => ({
    useRouter: () => ({
        isReady: true,
        push: mocks.push,
        query: mocks.query,
    }),
}));

vi.mock("next/head", () => ({
    default: () => null,
}));

vi.mock("qrcode.react", async () => {
    const React = await vi.importActual("react");

    return {
        QRCodeSVG: ({ value }) =>
            React.createElement("img", { alt: "deposit qr", src: `qr:${value}` }),
    };
});

vi.mock("../../../api/api", () => ({
    createSwap: (body) => mocks.createSwap(body),
    getSwap: (id) => mocks.getSwap(id),
    getSwapQuote: (from, to, amount) => mocks.getSwapQuote(from, to, amount),
}));

const QUOTE = {
    from: "LBTC",
    to: "BTC",
    amount_in: 100000000,
    amount_out: 98010000,
    rate: "1",
    fee_bps: 100,
    spread_bps: 100,
    btc_usd_rate: null,
    min_amount_in: 10000,
    expiration_minutes: 30,
    required_confirmations: 1,
    liquidity_ok: true,
    message: null,
};

const SWAP = {
    swap_id: "11111111-2222-3333-4444-555555555555",
    status: "WAITING_DEPOSIT",
    from: "LBTC",
    to: "BTC",
    amount_in_expected: 100000000,
    amount_out_quoted: 98010000,
    rate: "1",
    fee_bps: 100,
    spread_bps: 100,
    deposit_address: "lq1depositaddressforthetest0000",
    payout_address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    refund_address: "lq1qqw508d6qejxtdg4y5r3zarvary0",
    deposit_txid: null,
    payout_txid: null,
    refund_txid: null,
    expires_at: "2999-01-01T00:00:00Z",
    error_note: null,
    created_at: "2026-09-10T11:30:00Z",
};

const PAYOUT_BTC = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
const REFUND_LBTC = "lq1qqw508d6qejxtdg4y5r3zarvary0";

const quoteOk = (overrides = {}) => ({
    data: { ...QUOTE, ...overrides },
    status: 200,
});

const typeAmount = async (user, value) => {
    const input = screen.getByLabelText("Monto a enviar");
    await user.click(input);
    await user.type(input, value);
};

const reachAddressPhase = async (user) => {
    mocks.getSwapQuote.mockResolvedValue(quoteOk());
    renderWithTamagui(<SwapsPage />);
    await typeAmount(user, "1");
    await waitFor(() => expect(mocks.getSwapQuote).toHaveBeenCalled(), {
        timeout: 3000,
    });
    const cta = await screen.findByRole("button", { name: /continuar/i });
    await waitFor(() => expect(cta).not.toBeDisabled(), { timeout: 3000 });
    await user.click(cta);
    await screen.findByText("¿A dónde enviamos los fondos?");
};

describe("SwapsPage", () => {
    beforeEach(() => {
        mocks.query = {};
        mocks.getSwapQuote.mockReset();
        mocks.createSwap.mockReset();
        mocks.getSwap.mockReset();
        mocks.push.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders the quote card in Spanish by default", () => {
        renderWithTamagui(<SwapsPage />);

        expect(
            screen.getByText("Intercambiá cripto en minutos")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Monto a enviar")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /continuar/i })
        ).toBeDisabled();
    });

    it("fetches a debounced quote and shows the amount out", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue(quoteOk());
        renderWithTamagui(<SwapsPage />);

        await typeAmount(user, "1");

        await waitFor(
            () =>
                expect(mocks.getSwapQuote).toHaveBeenCalledWith(
                    "LBTC",
                    "BTC",
                    100000000
                ),
            { timeout: 3000 }
        );
        expect(await screen.findByText("0.9801 BTC")).toBeInTheDocument();
        // Fee and spread come as basis points and render as percentages.
        expect(screen.getAllByText("1%").length).toBeGreaterThan(0);
    });

    it("warns and blocks the CTA when there is no liquidity", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue(
            quoteOk({
                liquidity_ok: false,
                message: "no liquidity for the requested amount",
            })
        );
        renderWithTamagui(<SwapsPage />);

        await typeAmount(user, "1");

        expect(
            await screen.findByText("no liquidity for the requested amount", {
                exact: false,
            })
        ).toBeInTheDocument();
        // The quote itself is still visible, only the CTA is locked.
        expect(screen.getByText("0.9801 BTC")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
    });

    it("surfaces the backend error when the quote request fails", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue({
            data: { error: "amount below minimum" },
            status: 400,
        });
        renderWithTamagui(<SwapsPage />);

        await typeAmount(user, "1");

        expect(
            await screen.findByText("amount below minimum")
        ).toBeInTheDocument();
    });

    it("validates the payout and refund addresses before creating the swap", async () => {
        const user = userEvent.setup();
        await reachAddressPhase(user);

        await user.click(screen.getByRole("button", { name: /crear swap/i }));
        expect(
            (await screen.findAllByText("Este campo es obligatorio.")).length
        ).toBe(2);
        expect(mocks.createSwap).not.toHaveBeenCalled();

        // An EVM address on a Bitcoin payout leg is rejected client-side.
        await user.type(
            screen.getByLabelText(/Dirección de destino/),
            "0x52908400098527886E0F7030069857D2E4169EE7"
        );
        expect(
            await screen.findByText(/no parece válida para la red Bitcoin/)
        ).toBeInTheDocument();
        expect(mocks.createSwap).not.toHaveBeenCalled();
    });

    it("creates the swap and moves to the status phase", async () => {
        const user = userEvent.setup();
        await reachAddressPhase(user);

        mocks.createSwap.mockResolvedValue({ data: SWAP, status: 201 });
        mocks.getSwap.mockResolvedValue({ data: SWAP, status: 200 });

        await user.type(screen.getByLabelText(/Dirección de destino/), PAYOUT_BTC);
        await user.type(
            screen.getByLabelText(/Dirección de reembolso/),
            REFUND_LBTC
        );
        await user.click(screen.getByRole("button", { name: /crear swap/i }));

        await waitFor(() =>
            expect(mocks.createSwap).toHaveBeenCalledWith({
                from: "LBTC",
                to: "BTC",
                amount_in: 100000000,
                payout_address: PAYOUT_BTC,
                refund_address: REFUND_LBTC,
            })
        );
        expect(
            await screen.findByText(SWAP.deposit_address)
        ).toBeInTheDocument();
        expect(screen.getByAltText("deposit qr")).toBeInTheDocument();
        expect(mocks.push).toHaveBeenCalledWith(
            `/swaps?id=${SWAP.swap_id}`,
            undefined,
            { shallow: true }
        );
    });

    it("restores the status phase from the id in the URL and stops polling on COMPLETED", async () => {
        vi.useFakeTimers();
        mocks.query = { id: SWAP.swap_id };
        mocks.getSwap
            .mockResolvedValueOnce({
                data: { ...SWAP, status: "CONFIRMING", confirmations: 0 },
                status: 200,
            })
            .mockResolvedValue({
                data: {
                    ...SWAP,
                    status: "COMPLETED",
                    confirmations: 1,
                    payout_txid: "abc123def456",
                },
                status: 200,
            });

        renderWithTamagui(<SwapsPage />);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(mocks.getSwap).toHaveBeenCalledWith(SWAP.swap_id);
        expect(mocks.getSwap).toHaveBeenCalledTimes(1);
        expect(screen.getByText("0/1 confirmaciones")).toBeInTheDocument();

        // Second poll lands on a terminal status.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10000);
        });
        expect(mocks.getSwap).toHaveBeenCalledTimes(2);
        expect(screen.getByText("¡Listo! El swap se completó.")).toBeInTheDocument();

        // The interval is torn down: further time passing issues no request.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60000);
        });
        expect(mocks.getSwap).toHaveBeenCalledTimes(2);
    });

    it("switches every string with the language pill and persists the choice", async () => {
        const user = userEvent.setup();
        renderWithTamagui(<SwapsPage />);

        expect(
            screen.getByText("Intercambiá cripto en minutos")
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "EN" }));

        expect(
            await screen.findByText("Swap crypto in minutes")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Amount to send")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
        expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe("en");
    });

    it("starts in the stored language on a later visit", async () => {
        window.localStorage.setItem(LANG_STORAGE_KEY, "en");
        renderWithTamagui(<SwapsPage />);

        expect(
            await screen.findByText("Swap crypto in minutes")
        ).toBeInTheDocument();
    });
});
