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
    getSwapQuote: (from, to, amount, side) =>
        mocks.getSwapQuote(from, to, amount, side),
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

const typeAmountOut = async (user, value) => {
    const input = screen.getByLabelText("Monto a recibir");
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
                    100000000,
                    "in"
                ),
            { timeout: 3000 }
        );
        expect(await screen.findByText("0.9801 BTC")).toBeInTheDocument();
        // The fee comes as basis points and renders as a percentage. The spread
        // is deliberately not shown: it is already baked into the quoted rate.
        expect(screen.getAllByText("1%").length).toBeGreaterThan(0);
        expect(screen.queryByText(/spread/i)).not.toBeInTheDocument();
    });

    it("mirrors the quote into the receive field without re-querying", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue(quoteOk());
        renderWithTamagui(<SwapsPage />);

        await typeAmount(user, "1");

        await waitFor(
            () =>
                expect(screen.getByLabelText("Monto a recibir")).toHaveValue(
                    "0.9801"
                ),
            { timeout: 3000 }
        );
        // Filling in the counterpart must not feed back into the fetch.
        expect(mocks.getSwapQuote).toHaveBeenCalledTimes(1);
    });

    it("prices from the receive side when the user types what they want to get", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue(
            quoteOk({ amount_in: 102030405, amount_out: 100000000, priced_from: "out" })
        );
        renderWithTamagui(<SwapsPage />);

        await typeAmountOut(user, "1");

        await waitFor(
            () =>
                expect(mocks.getSwapQuote).toHaveBeenCalledWith(
                    "LBTC",
                    "BTC",
                    100000000,
                    "out"
                ),
            { timeout: 3000 }
        );
        // ...and the amount to send comes back from the backend's solution.
        await waitFor(() =>
            expect(screen.getByLabelText("Monto a enviar")).toHaveValue("1.02030405")
        );
    });

    it("switches both amount fields between BTC and sats", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue(quoteOk());
        renderWithTamagui(<SwapsPage />);

        await typeAmount(user, "1");
        await waitFor(
            () =>
                expect(screen.getByLabelText("Monto a recibir")).toHaveValue(
                    "0.9801"
                ),
            { timeout: 3000 }
        );

        // Both legs are bitcoin here, so either ticker flips the whole card.
        await user.click(
            screen.getAllByRole("button", { name: /Mostrar los montos en SAT/ })[0]
        );

        expect(screen.getByLabelText("Monto a enviar")).toHaveValue("100000000");
        expect(screen.getByLabelText("Monto a recibir")).toHaveValue("98010000");
        expect(
            screen.getAllByRole("button", { name: /Mostrar los montos en BTC/ }).length
        ).toBe(2);
    });

    it("labels both bitcoin legs BTC and tells them apart by network", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue(quoteOk());
        renderWithTamagui(<SwapsPage />);

        // The Liquid leg reads "BTC" in the field; the selector carries "Liquid"
        // (once per select, hence getAllByText).
        expect(screen.queryByText("L-BTC")).not.toBeInTheDocument();
        expect(screen.getAllByText("BTC · Liquid").length).toBeGreaterThan(0);

        await typeAmount(user, "1");
        const cta = await screen.findByRole("button", { name: /continuar/i });
        await waitFor(() => expect(cta).not.toBeDisabled(), { timeout: 3000 });
        await user.click(cta);

        // Away from the selectors, the summary spells the chain out.
        expect(await screen.findByText("1 BTC · Liquid")).toBeInTheDocument();
        expect(screen.getByText("0.9801 BTC · Bitcoin")).toBeInTheDocument();
    });

    it("shortens the raw backend rate to the destination's precision", async () => {
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue(
            quoteOk({ rate: "0.00001202832429805706477613484233" })
        );
        renderWithTamagui(<SwapsPage />);

        await typeAmount(user, "1");

        expect(
            await screen.findByText("1 BTC ≈ 0.00001202 BTC")
        ).toBeInTheDocument();
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
