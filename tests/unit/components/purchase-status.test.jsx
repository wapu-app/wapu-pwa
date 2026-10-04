import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PurchaseStatus, {
    isPurchaseTentative,
    purchaseOrderOf,
} from "../../../components/Swaps/PurchaseStatus";
import { TRANSLATIONS } from "../../../components/Swaps/i18n";
import { FUNDED_PURCHASE, PURCHASE } from "../../fixtures/crypto-purchase";
import { renderWithTamagui } from "../../test-utils";

const t = TRANSLATIONS.es;

const BITCOIN_TXID = "64f8f01c4f523b4464042ee58bed2d777d33425314072c325f656638afc574b8";

const renderPurchase = (tentative, props = {}) =>
    renderWithTamagui(
        <PurchaseStatus
            t={t}
            lang="es"
            btcUnit="BTC"
            swap={purchaseOrderOf(tentative)}
            errorText={null}
            onNewSwap={vi.fn()}
            {...props}
        />
    );

describe("PurchaseStatus — direct-fiat purchases", () => {
    it("tells purchases from sales by type/direction, not by the tentative id", () => {
        expect(isPurchaseTentative(PURCHASE)).toBe(true);
        expect(isPurchaseTentative({ tentative_id: "x", direction: "ramp_on" })).toBe(true);
        expect(isPurchaseTentative({ tentative_id: "x", type: "fast_fiat_transfer" })).toBe(false);
        expect(isPurchaseTentative(null)).toBe(false);
    });

    it("maps the payload onto the order shape, USDT cents into chain base units", () => {
        const order = purchaseOrderOf({
            ...FUNDED_PURCHASE,
            payout_currency: "USDT",
            payout_network: "POLYGON",
            amount_out: 9875,
            amount_out_unit: "usdt_cents",
        });
        expect(order).toMatchObject({
            swap_id: FUNDED_PURCHASE.tentative_id,
            status: "WAITING_DEPOSIT",
            from: "ARS",
            to: "USDT_POLYGON",
            amount_in_expected: 1500037,
            amount_out_quoted: 98750000,
            deposit_address: "test.receiver.alias",
            cvu: FUNDED_PURCHASE.cvu,
        });
    });

    it("shows the adjusted ARS amount, alias and CVU with copy controls", () => {
        renderPurchase(FUNDED_PURCHASE);
        expect(screen.getByText("Transferí los pesos")).toBeInTheDocument();
        expect(screen.getAllByText("15.000,37 ARS").length).toBeGreaterThan(0);
        expect(screen.getByText("test.receiver.alias")).toBeInTheDocument();
        expect(screen.getByText(FUNDED_PURCHASE.cvu)).toBeInTheDocument();
        expect(screen.getByLabelText(t.status.copyAria(t.arsPayment.cvu))).toBeInTheDocument();
        expect(screen.getByLabelText(t.status.copyAria(t.arsPayment.amount))).toBeInTheDocument();
    });

    it("offers the funding retry while the purchase is still CREATED", () => {
        const onRetryFunding = vi.fn();
        renderPurchase(PURCHASE, { onRetryFunding });
        expect(screen.queryByText("test.receiver.alias")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: t.fiatPayout.retry }));
        expect(onRetryFunding).toHaveBeenCalledTimes(1);
    });

    it("shows a sending purchase with its explorer link", () => {
        renderPurchase({
            ...FUNDED_PURCHASE,
            status: "EXECUTED",
            payout_status: "sending",
            payout_currency: "SAT",
            payout_network: "BITCOIN",
            txid: BITCOIN_TXID,
        });
        expect(screen.getByText("Enviando tus fondos")).toBeInTheDocument();
        expect(screen.getByText(t.arsPayment.sendingNotice)).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: t.status.explorerAria(t.arsPayment.payoutTxid) })
        ).toHaveAttribute("href", `https://blockstream.info/tx/${BITCOIN_TXID}`);
    });

    it("reads payout_status review as under review", () => {
        renderPurchase({ ...FUNDED_PURCHASE, status: "EXECUTED", payout_status: "review" });
        expect(screen.getByText("En revisión")).toBeInTheDocument();
        expect(screen.getByText(t.arsPayment.reviewNotice)).toBeInTheDocument();
    });

    it("never words a balance settlement as a crypto delivery", () => {
        renderPurchase({
            ...FUNDED_PURCHASE,
            status: "SETTLED_TO_BALANCE",
            payout_status: "settled_to_balance",
        });
        expect(screen.getByText("Acreditado en tu saldo Wapu")).toBeInTheDocument();
        expect(screen.getByText(t.arsPayment.settledNotice)).toBeInTheDocument();
        expect(screen.queryByText(t.arsPayment.completedNotice)).not.toBeInTheDocument();
        expect(screen.queryByText("test.receiver.alias")).not.toBeInTheDocument();
    });

    it("says an expired purchase is still being watched while watch_pending", () => {
        renderPurchase({ ...FUNDED_PURCHASE, status: "EXPIRED", watch_pending: true });
        expect(screen.getByText(t.arsPayment.expiredWatchingNotice)).toBeInTheDocument();
    });

    it("shows a completed purchase as delivered", () => {
        renderPurchase({ ...FUNDED_PURCHASE, status: "COMPLETED", payout_status: "completed" });
        expect(screen.getByText(t.arsPayment.completedNotice)).toBeInTheDocument();
    });
});
