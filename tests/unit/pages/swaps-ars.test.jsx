import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SwapsPage from "../../../pages/swaps";
import { renderWithTamagui } from "../../test-utils";

// ARS legs of /swaps: login gate, close button, ARS purchase (POST /swaps/ars)
// and crypto -> ARS (direct-fiat tentatives). The Tamagui Select does not open
// under jsdom, so CalcSelect is replaced by a native <select> with the same
// { value, onChange, options, label } contract.

const mocks = vi.hoisted(() => ({
    createArsSwap: vi.fn(),
    createDirectFiatTentative: vi.fn(),
    createSwap: vi.fn(),
    getDirectFiatQuote: vi.fn(),
    getDirectFiatTentative: vi.fn(),
    getSwap: vi.fn(),
    getSwapQuote: vi.fn(),
    requestDirectFiatFunding: vi.fn(),
    getAccessToken: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    query: {},
}));

vi.mock("next/router", () => ({
    useRouter: () => ({
        isReady: true,
        push: mocks.push,
        back: mocks.back,
        query: mocks.query,
    }),
}));

vi.mock("next/head", () => ({ default: () => null }));

vi.mock("../../../utils/auth", async () => {
    const actual = await vi.importActual("../../../utils/auth");
    return { ...actual, getAccessToken: () => mocks.getAccessToken() };
});

vi.mock("qrcode.react", async () => {
    const React = await vi.importActual("react");
    return {
        QRCodeSVG: ({ value }) => React.createElement("img", { alt: "qr", src: `qr:${value}` }),
    };
});

vi.mock("../../../components/CalcSelect", async () => {
    const React = await vi.importActual("react");
    return {
        default: ({ value, onChange, options, label }) =>
            React.createElement(
                "select",
                {
                    "aria-label": `select ${label}`,
                    value,
                    onChange: (event) => onChange(event.target.value),
                },
                options.map((option) =>
                    React.createElement(
                        "option",
                        { key: option.value, value: option.value },
                        option.label
                    )
                )
            ),
    };
});

vi.mock("../../../api/api", () => ({
    createArsSwap: (body) => mocks.createArsSwap(body),
    createDirectFiatTentative: (body) => mocks.createDirectFiatTentative(body),
    createSwap: (body) => mocks.createSwap(body),
    getDirectFiatQuote: (args) => mocks.getDirectFiatQuote(args),
    getDirectFiatTentative: (id) => mocks.getDirectFiatTentative(id),
    getSwap: (id) => mocks.getSwap(id),
    getSwapQuote: (from, to, amount, side) => mocks.getSwapQuote(from, to, amount, side),
    requestDirectFiatFunding: (id) => mocks.requestDirectFiatFunding(id),
}));

const SWAP_ID = "11111111-2222-3333-4444-555555555555";
const TENTATIVE_ID = "99999999-8888-7777-6666-555555555555";

const ARS_QUOTE = {
    from: "ARS",
    to: "BTC_LIGHTNING",
    amount_in: 1500000,
    amount_out: 10000,
    rate: "0.0000000066",
    fee_bps: 0,
    spread_bps: 0,
    min_amount_in: 1000000,
    expiration_minutes: 15,
    required_confirmations: 0,
    fee_estimate_sats: 26,
    liquidity_ok: true,
};

const ARS_SWAP = {
    swap_id: SWAP_ID,
    status: "WAITING_DEPOSIT",
    from: "ARS",
    to: "BTC_LIGHTNING",
    amount_in_expected: 1500037,
    amount_out_quoted: 10000,
    amount_out_final: null,
    deposit_address: "wapu.fiwind.alias",
    payout_address: "…@walletofsatoshi.com",
    deposit_txid: null,
    payout_txid: null,
    payout_payment_hash: null,
    payout_status: "none",
    expires_at: "2999-01-01T00:00:00Z",
    error_note: null,
};

const FIAT_QUOTE = {
    amount_ars: 25000,
    type: "fast_fiat_transfer",
    funding_currency: "SAT",
    funding_network: "LIGHTNING",
    usdt_ars_rate: 1131.84,
    fee_rate: 0.03,
    funding_amount_usdt: 22.09,
    fee_amount_usdt: 0.66,
    total_amount_usdt: 22.75,
    total_amount_sats: 21821,
};

const TENTATIVE = {
    tentative_id: TENTATIVE_ID,
    status: "CREATED",
    type: "fast_fiat_transfer",
    alias: "my.bank.alias",
    expires_at: "2999-01-01T00:00:00Z",
    amount_ars: 25000,
    funding_currency: "SAT",
    funding_network: "LIGHTNING",
    total_amount_sats: 21821,
    total_amount_usdt: 22.75,
};

const FUNDED = {
    ...TENTATIVE,
    status: "FUNDING_ISSUED",
    lightning_pr: "lnbc218210n1ptestinvoice",
    funding_transaction_id: "tx-uuid",
};

// A JWT whose payload decodes to an expiry in 2100: isAuthExpired() is false.
const logIn = () => {
    const payload = btoa(JSON.stringify({ exp: 4102444800 })).replace(/=/g, "");
    document.cookie = `access_token=h.${payload}.s; path=/`;
    document.cookie = "isLoggedIn=true; path=/";
};

const logOut = () => {
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

const optionValues = (select) => Array.from(select.options).map((option) => option.value);

const continueToPhase2 = async (user) => {
    const cta = await screen.findByRole("button", { name: /continuar/i });
    await waitFor(() => expect(cta).not.toBeDisabled(), { timeout: 3000 });
    await user.click(cta);
};

describe("SwapsPage — ARS legs", () => {
    beforeEach(() => {
        mocks.query = {};
        Object.values(mocks).forEach((mock) => {
            if (typeof mock === "function" && "mockReset" in mock) {
                mock.mockReset();
            }
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        logOut();
    });

    it("hides ARS, BTC Lightning input and the close button when logged out", () => {
        renderWithTamagui(<SwapsPage />);

        const send = screen.getByLabelText("select Vos enviás");
        const receive = screen.getByLabelText("select Recibís");
        expect(optionValues(send)).toEqual(["BTC", "LBTC", "USDT_LIQUID"]);
        expect(optionValues(receive)).not.toContain("ARS");
        expect(screen.queryByLabelText("Cerrar")).not.toBeInTheDocument();
    });

    it("restores an expired session on this public page before gating ARS", async () => {
        // Marker still set, access token expired: /swaps is not session-gated
        // by the layout, so the page itself refreshes once.
        const payload = btoa(JSON.stringify({ exp: 1 })).replace(/=/g, "");
        document.cookie = `access_token=h.${payload}.s; path=/`;
        document.cookie = "isLoggedIn=true; path=/";
        mocks.getAccessToken.mockResolvedValue("fresh-token");
        renderWithTamagui(<SwapsPage />);

        await screen.findByRole("button", { name: "Cerrar" });
        expect(mocks.getAccessToken).toHaveBeenCalledTimes(1);
        expect(optionValues(screen.getByLabelText("select Vos enviás"))).toContain("ARS");
    });

    it("does not call refresh for an anonymous visitor", async () => {
        renderWithTamagui(<SwapsPage />);
        await waitFor(() =>
            expect(screen.getByLabelText("select Vos enviás")).toBeInTheDocument()
        );
        expect(mocks.getAccessToken).not.toHaveBeenCalled();
    });

    it("shows ARS and the close button when logged in; the X goes back", async () => {
        logIn();
        // One in-app entry before /swaps, so there is somewhere to go back to.
        window.history.pushState({}, "", "/home");
        window.history.pushState({}, "", "/swaps");
        const user = userEvent.setup();
        renderWithTamagui(<SwapsPage />);

        const close = await screen.findByRole("button", { name: "Cerrar" });
        expect(optionValues(screen.getByLabelText("select Vos enviás"))).toContain("ARS");
        expect(optionValues(screen.getByLabelText("select Recibís"))).toContain("ARS");

        await user.click(close);
        expect(mocks.back).toHaveBeenCalledTimes(1);
        expect(mocks.push).not.toHaveBeenCalled();
    });

    it("stays logged out when the session refresh fails", async () => {
        const payload = btoa(JSON.stringify({ exp: 1 })).replace(/=/g, "");
        document.cookie = `access_token=h.${payload}.s; path=/`;
        document.cookie = "isLoggedIn=true; path=/";
        mocks.getAccessToken.mockResolvedValue(null);
        renderWithTamagui(<SwapsPage />);

        await waitFor(() => expect(mocks.getAccessToken).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
        expect(optionValues(screen.getByLabelText("select Vos enviás"))).not.toContain("ARS");
    });

    it("buys BTC Lightning with ARS: centavos out, exact amount with cents back", async () => {
        logIn();
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue({ data: ARS_QUOTE, status: 200 });
        mocks.createArsSwap.mockResolvedValue({ data: ARS_SWAP, status: 201 });
        mocks.getSwap.mockResolvedValue({ data: ARS_SWAP, status: 200 });
        renderWithTamagui(<SwapsPage />);

        await screen.findByRole("button", { name: "Cerrar" });
        await user.selectOptions(screen.getByLabelText("select Vos enviás"), "ARS");
        const receive = screen.getByLabelText("select Recibís");
        expect(optionValues(receive)[0]).toBe("BTC_LIGHTNING");
        await user.selectOptions(receive, "BTC_LIGHTNING");

        const input = screen.getByLabelText("Monto a enviar");
        await user.click(input);
        await user.type(input, "15000");
        await waitFor(
            () =>
                expect(mocks.getSwapQuote).toHaveBeenCalledWith(
                    "ARS",
                    "BTC_LIGHTNING",
                    1500000,
                    "in"
                ),
            { timeout: 3000 }
        );
        expect(await screen.findByText("~26 sats")).toBeInTheDocument();

        await continueToPhase2(user);
        // No refund address for pesos.
        expect(screen.queryByText(/Dirección de reembolso/)).not.toBeInTheDocument();
        await user.type(
            screen.getByLabelText(/Dirección de destino/),
            "satoshi@walletofsatoshi.com"
        );
        await user.click(screen.getByRole("button", { name: "Crear orden" }));

        await waitFor(() =>
            expect(mocks.createArsSwap).toHaveBeenCalledWith({
                to_asset: "BTC_LIGHTNING",
                payout_address: "satoshi@walletofsatoshi.com",
                amount_ars: 1500000,
            })
        );
        expect(mocks.createSwap).not.toHaveBeenCalled();
        expect(mocks.push).toHaveBeenCalledWith(`/swaps?id=${SWAP_ID}`, undefined, {
            shallow: true,
        });
        // The amount to transfer is the one from the order, cents included.
        expect(await screen.findByText("wapu.fiwind.alias")).toBeInTheDocument();
        expect(screen.getAllByText("15.000,37 ARS").length).toBeGreaterThan(0);
        expect(screen.getByText(/incluyendo los centavos/)).toBeInTheDocument();
    });

    it("shows a paid-but-failed purchase as under review, with the order id", async () => {
        mocks.query = { id: SWAP_ID };
        mocks.getSwap.mockResolvedValue({
            data: { ...ARS_SWAP, status: "FAILED", deposit_txid: "fiwind:123" },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        expect(await screen.findByText("En revisión")).toBeInTheDocument();
        expect(screen.getByText(/quedó en revisión/)).toBeInTheDocument();
        expect(screen.queryByText("wapu.fiwind.alias")).not.toBeInTheDocument();
    });

    it("reads error_code under_review as under review and never shows error_note", async () => {
        mocks.query = { id: SWAP_ID };
        mocks.getSwap.mockResolvedValue({
            data: {
                ...ARS_SWAP,
                status: "FAILED",
                deposit_txid: null,
                error_code: "under_review",
                error_note: "internal provider detail",
            },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        expect(await screen.findByText("En revisión")).toBeInTheDocument();
        expect(screen.queryByText("internal provider detail")).not.toBeInTheDocument();
    });

    it("shows a plain failure for error_code failed", async () => {
        mocks.query = { id: SWAP_ID };
        mocks.getSwap.mockResolvedValue({
            data: { ...ARS_SWAP, status: "FAILED", error_code: "failed", error_note: null },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        expect(await screen.findByText("Fallida")).toBeInTheDocument();
        expect(screen.queryByText("En revisión")).not.toBeInTheDocument();
    });

    it("shows the payment hash once a Lightning purchase is sent", async () => {
        mocks.query = { id: SWAP_ID };
        mocks.getSwap.mockResolvedValue({
            data: {
                ...ARS_SWAP,
                status: "SENDING",
                deposit_txid: "fiwind:123",
                payout_status: "sent",
                payout_payment_hash: "a".repeat(64),
            },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        expect(await screen.findByText("Payment hash")).toBeInTheDocument();
        expect(screen.getByText("Enviando tus fondos")).toBeInTheDocument();
    });

    it("sells BTC Lightning for ARS through a fast_fiat_transfer tentative", async () => {
        logIn();
        const user = userEvent.setup();
        mocks.getDirectFiatQuote.mockResolvedValue({ data: FIAT_QUOTE, status: 200 });
        mocks.createDirectFiatTentative.mockResolvedValue({ data: TENTATIVE, status: 201 });
        mocks.requestDirectFiatFunding.mockResolvedValue({ data: FUNDED, status: 201 });
        mocks.getDirectFiatTentative.mockResolvedValue({ data: FUNDED, status: 200 });
        renderWithTamagui(<SwapsPage />);

        await screen.findByRole("button", { name: "Cerrar" });
        await user.selectOptions(screen.getByLabelText("select Vos enviás"), "BTC_LIGHTNING");
        expect(optionValues(screen.getByLabelText("select Recibís"))).toEqual(["ARS"]);
        // Only the ARS side can be priced.
        expect(screen.getByLabelText("Monto a enviar")).toHaveAttribute("readonly");

        const input = screen.getByLabelText("Monto a recibir");
        await user.click(input);
        await user.type(input, "25000");
        await waitFor(
            () =>
                expect(mocks.getDirectFiatQuote).toHaveBeenCalledWith({
                    amountArs: "25000.00",
                    fundingCurrency: "SAT",
                    fundingNetwork: undefined,
                    type: "fast_fiat_transfer",
                }),
            { timeout: 3000 }
        );
        await waitFor(() =>
            expect(screen.getByLabelText("Monto a enviar")).toHaveValue("0.00021821")
        );

        await continueToPhase2(user);
        await user.type(screen.getByLabelText("Alias, CBU o CVU"), "my.bank.alias");
        await user.click(screen.getByRole("button", { name: "Crear orden" }));

        await waitFor(() =>
            expect(mocks.createDirectFiatTentative).toHaveBeenCalledWith({
                amount_ars: 25000,
                type: "fast_fiat_transfer",
                alias: "my.bank.alias",
                funding_currency: "SAT",
            })
        );
        await waitFor(() => expect(mocks.requestDirectFiatFunding).toHaveBeenCalledWith(TENTATIVE_ID));
        expect(mocks.push).toHaveBeenCalledWith(`/swaps?tentative=${TENTATIVE_ID}`, undefined, {
            shallow: true,
        });
        expect(await screen.findByText("lnbc218210n1ptestinvoice")).toBeInTheDocument();
        expect(screen.getAllByText("0.00021821 BTC · Lightning").length).toBeGreaterThan(0);
    });

    it("offers to issue the deposit instructions again when /funding failed", async () => {
        const user = userEvent.setup();
        mocks.query = { tentative: TENTATIVE_ID };
        mocks.getDirectFiatTentative.mockResolvedValue({ data: TENTATIVE, status: 200 });
        mocks.requestDirectFiatFunding.mockResolvedValue({ data: FUNDED, status: 201 });
        renderWithTamagui(<SwapsPage />);

        const retry = await screen.findByRole("button", {
            name: "Generar las instrucciones de nuevo",
        });
        expect(mocks.getSwap).not.toHaveBeenCalled();
        await user.click(retry);
        expect(await screen.findByText("lnbc218210n1ptestinvoice")).toBeInTheDocument();
    });
    // Reaches phase 2 of ARS -> BTC Lightning, pinning `side`.
    const reachArsBuyAddress = async (user, side = "in") => {
        await screen.findByRole("button", { name: "Cerrar" });
        await user.selectOptions(screen.getByLabelText("select Vos enviás"), "ARS");
        await user.selectOptions(screen.getByLabelText("select Recibís"), "BTC_LIGHTNING");
        const input = screen.getByLabelText(side === "in" ? "Monto a enviar" : "Monto a recibir");
        await user.click(input);
        await user.type(input, side === "in" ? "15000" : "0.0001");
        await continueToPhase2(user);
        await user.type(
            screen.getByLabelText(/Dirección de destino/),
            "satoshi@walletofsatoshi.com"
        );
    };

    it("sends amount_out, not amount_ars, when the user pinned what to receive", async () => {
        logIn();
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue({ data: ARS_QUOTE, status: 200 });
        mocks.createArsSwap.mockResolvedValue({ data: ARS_SWAP, status: 201 });
        mocks.getSwap.mockResolvedValue({ data: ARS_SWAP, status: 200 });
        renderWithTamagui(<SwapsPage />);

        await reachArsBuyAddress(user, "out");
        expect(mocks.getSwapQuote).toHaveBeenLastCalledWith("ARS", "BTC_LIGHTNING", 10000, "out");
        await user.click(screen.getByRole("button", { name: "Crear orden" }));

        await waitFor(() =>
            expect(mocks.createArsSwap).toHaveBeenCalledWith({
                to_asset: "BTC_LIGHTNING",
                payout_address: "satoshi@walletofsatoshi.com",
                amount_out: 10000,
            })
        );
    });

    it("shows the backend error when the ARS quote answers 400", async () => {
        logIn();
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue({
            data: { error: "ARS swaps are disabled" },
            status: 400,
        });
        renderWithTamagui(<SwapsPage />);

        await screen.findByRole("button", { name: "Cerrar" });
        await user.selectOptions(screen.getByLabelText("select Vos enviás"), "ARS");
        const input = screen.getByLabelText("Monto a enviar");
        await user.click(input);
        await user.type(input, "15000");

        expect(
            await screen.findByText("ARS swaps are disabled", {}, { timeout: 3000 })
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
    });

    it.each([
        [400, { error: "ARS swaps are disabled" }, "ARS swaps are disabled"],
        [401, {}, "Iniciá sesión para operar con pesos."],
        [409, {}, "No hay liquidez para el monto solicitado."],
        [422, { error: "Monthly ARS purchase limit exceeded" }, "Monthly ARS purchase limit exceeded"],
        [429, { error: "Too many requests" }, "Demasiados intentos. Esperá un momento e intentá de nuevo."],
    ])("maps a %s from POST /swaps/ars to its message", async (status, data, message) => {
        logIn();
        const user = userEvent.setup();
        mocks.getSwapQuote.mockResolvedValue({ data: ARS_QUOTE, status: 200 });
        mocks.createArsSwap.mockResolvedValue({ data, status });
        renderWithTamagui(<SwapsPage />);

        await reachArsBuyAddress(user);
        await user.click(screen.getByRole("button", { name: "Crear orden" }));

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(mocks.push).not.toHaveBeenCalled();
    });
});

describe("SwapsPage — ARS polling", () => {
    const NOW = new Date("2026-09-27T12:00:00Z").getTime();
    const tick = async (ms) => {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(ms);
        });
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        Object.values(mocks).forEach((mock) => {
            if (typeof mock === "function" && "mockReset" in mock) {
                mock.mockReset();
            }
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("polls every 10 s and stops at a terminal status", async () => {
        mocks.query = { id: SWAP_ID };
        mocks.getSwap
            .mockResolvedValueOnce({ data: ARS_SWAP, status: 200 })
            .mockResolvedValue({ data: { ...ARS_SWAP, status: "COMPLETED" }, status: 200 });
        renderWithTamagui(<SwapsPage />);

        await tick(0);
        expect(mocks.getSwap).toHaveBeenCalledTimes(1);
        await tick(9000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(1);
        await tick(1000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(2);
        await tick(60000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(2);
    });

    it("keeps polling an EXPIRED purchase inside the late-watch window", async () => {
        mocks.query = { id: SWAP_ID };
        const expiresAt = new Date(NOW - 10 * 60 * 1000).toISOString();
        mocks.getSwap.mockResolvedValue({
            data: { ...ARS_SWAP, status: "EXPIRED", expires_at: expiresAt },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        await tick(0);
        await tick(20000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(3);
    });

    it("stops polling an EXPIRED purchase past the late-watch window", async () => {
        mocks.query = { id: SWAP_ID };
        const expiresAt = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();
        mocks.getSwap.mockResolvedValue({
            data: { ...ARS_SWAP, status: "EXPIRED", expires_at: expiresAt },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        await tick(0);
        await tick(30000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(1);
    });

    it("uses late_watch_until from the backend over the 60 min default", async () => {
        mocks.query = { id: SWAP_ID };
        // expires_at 10 min ago would still be watched by the default, but the
        // backend says the window already closed.
        mocks.getSwap.mockResolvedValue({
            data: {
                ...ARS_SWAP,
                status: "EXPIRED",
                expires_at: new Date(NOW - 10 * 60 * 1000).toISOString(),
                late_watch_until: new Date(NOW - 60 * 1000).toISOString(),
            },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        await tick(0);
        await tick(30000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(1);
    });

    it("keeps polling while late_watch_until is in the future", async () => {
        mocks.query = { id: SWAP_ID };
        // Past the 60 min default, but the backend extends the window.
        mocks.getSwap.mockResolvedValue({
            data: {
                ...ARS_SWAP,
                status: "EXPIRED",
                expires_at: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
                late_watch_until: new Date(NOW + 5 * 60 * 1000).toISOString(),
            },
            status: 200,
        });
        renderWithTamagui(<SwapsPage />);

        await tick(0);
        await tick(20000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(3);
    });

    it("stops polling a tentative on 401 instead of refreshing every tick", async () => {
        mocks.query = { tentative: TENTATIVE_ID };
        mocks.getDirectFiatTentative.mockResolvedValue({
            data: { error: "Session expired" },
            status: 401,
        });
        renderWithTamagui(<SwapsPage />);

        await tick(0);
        await tick(30000);
        expect(mocks.getDirectFiatTentative).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Iniciá sesión para operar con pesos.")).toBeInTheDocument();
    });

    it("stops polling a swap that does not exist", async () => {
        mocks.query = { id: SWAP_ID };
        mocks.getSwap.mockResolvedValue({ data: { error: "Not found" }, status: 404 });
        renderWithTamagui(<SwapsPage />);

        await tick(0);
        await tick(30000);
        expect(mocks.getSwap).toHaveBeenCalledTimes(1);
    });
});
