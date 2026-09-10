import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SwapStatus from "../../../components/Swaps/SwapStatus";
import { TRANSLATIONS } from "../../../components/Swaps/i18n";
import { shortenHash } from "../../../components/Swaps/primitives";
import { renderWithTamagui } from "../../test-utils";

// The clipboard stub lives in tests/setup.tsx.
const clipboard = navigator.clipboard;

const t = TRANSLATIONS.es;

const BITCOIN_TXID =
    "64f8f01c4f523b4464042ee58bed2d777d33425314072c325f656638afc574b8";
const LIQUID_TXID =
    "3a7c9c29e37144220dcb7fc522846c7243c8a89f8dbc59d5f7b0e4ff7e299566";
const POLYGON_TXID =
    "0x7aebdf8d76eb08e8929cfa4899daf9742ec2b5a9d76e69316cbdcb7f04038f2a";

const SWAP = {
    swap_id: "11111111-2222-3333-4444-555555555555",
    status: "COMPLETED",
    from: "LBTC",
    to: "BTC",
    amount_in_expected: 100000000,
    amount_out_quoted: 98010000,
    deposit_address: "lq1depositaddressforthetest0000",
    deposit_txid: LIQUID_TXID,
    payout_txid: BITCOIN_TXID,
    refund_txid: null,
    confirmations: 1,
    required_confirmations: 1,
    expires_at: "2999-01-01T00:00:00Z",
    error_note: null,
};

const renderStatus = (overrides = {}) =>
    renderWithTamagui(
        <SwapStatus
            t={t}
            btcUnit={"BTC"}
            swap={{ ...SWAP, ...overrides }}
            loading={false}
            errorText={null}
            onNewSwap={vi.fn()}
        />
    );

const linkFor = (label) =>
    screen.getByRole("link", { name: t.status.explorerAria(label) });

const copyButtonFor = (label) =>
    screen.getByRole("button", { name: t.status.copyAria(label) });

// The button awaits the clipboard write before it turns green, so let that
// microtask settle instead of asserting against a half-applied state.
const clickCopy = async (label) => {
    fireEvent.click(copyButtonFor(label));
    await act(async () => {});
};

describe("SwapStatus — transaction links", () => {
    it("points each txid at the explorer of the chain it settled on", () => {
        renderStatus();

        // The deposit arrived on the `from` leg (Liquid), the payout left on
        // the `to` one (Bitcoin). Swapping the two would still produce a
        // plausible-looking link to the wrong chain.
        expect(linkFor(t.status.depositTxid)).toHaveAttribute(
            "href",
            `https://blockstream.info/liquid/tx/${LIQUID_TXID}`
        );
        expect(linkFor(t.status.payoutTxid)).toHaveAttribute(
            "href",
            `https://blockstream.info/tx/${BITCOIN_TXID}`
        );
    });

    it("sends a refund back out on the deposit's chain", () => {
        renderStatus({
            status: "REFUNDED",
            payout_txid: null,
            refund_txid: LIQUID_TXID,
        });

        expect(linkFor(t.status.refundTxid)).toHaveAttribute(
            "href",
            `https://blockstream.info/liquid/tx/${LIQUID_TXID}`
        );
    });

    it("links an EVM payout to that chain's explorer, not the other one", () => {
        renderStatus({ to: "USDT_POLYGON", payout_txid: POLYGON_TXID });

        expect(linkFor(t.status.payoutTxid)).toHaveAttribute(
            "href",
            `https://polygonscan.com/tx/${POLYGON_TXID}`
        );
    });

    it("opens the explorer in a new tab without handing it the opener", () => {
        renderStatus();

        const link = linkFor(t.status.depositTxid);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("shortens the hash on screen but links the whole one", () => {
        renderStatus();

        const link = linkFor(t.status.depositTxid);
        expect(link).toHaveTextContent(shortenHash(LIQUID_TXID));
        expect(link.getAttribute("href")).toContain(LIQUID_TXID);
    });
});

describe("SwapStatus — copy affordances", () => {
    it("copies the full txid, not the shortened one on screen", async () => {
        renderStatus();

        // Last-called, not called-at-all: the deposit hash stays in the mock's
        // history, so a payout button wired to the wrong row would still
        // satisfy toHaveBeenCalledWith.
        await clickCopy(t.status.depositTxid);
        expect(clipboard.writeText).toHaveBeenLastCalledWith(LIQUID_TXID);

        await clickCopy(t.status.payoutTxid);
        expect(clipboard.writeText).toHaveBeenLastCalledWith(BITCOIN_TXID);
    });

    it("copies the whole swap id, which is what a claim needs", async () => {
        renderStatus();

        expect(screen.getByText(shortenHash(SWAP.swap_id, 8, 6))).toBeInTheDocument();

        await clickCopy(t.status.swapId);
        expect(clipboard.writeText).toHaveBeenLastCalledWith(SWAP.swap_id);
    });

    it("names every copy button after what it copies", () => {
        renderStatus({ status: "WAITING_DEPOSIT" });

        // Five of them share this card while the deposit is pending, so
        // "Copy" alone would not tell them apart.
        expect(copyButtonFor(t.status.swapId)).toBeInTheDocument();
        expect(copyButtonFor(t.status.depositAddress)).toBeInTheDocument();
        expect(copyButtonFor(t.status.depositTxid)).toBeInTheDocument();
        expect(copyButtonFor(t.status.payoutTxid)).toBeInTheDocument();
    });

    it("confirms the copy in the page's language", async () => {
        renderStatus();

        await clickCopy(t.status.swapId);

        expect(screen.getByText(t.status.copied)).toBeInTheDocument();
        expect(screen.queryByText("Copied")).not.toBeInTheDocument();
    });
});
