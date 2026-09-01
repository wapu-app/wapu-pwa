import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewSendPage from "../../../pages/newSend";
import {
    sendFiat,
    getSettings,
    getTransactionTentativeAmount,
} from "../../../api/api";
import { getAccessToken } from "../../../utils/auth";
import { useUserContext } from "../../../context/userContext";
import { renderWithTamagui } from "../../test-utils";

const routerMock = vi.hoisted(() => ({
    back: vi.fn(),
    push: vi.fn(),
}));

vi.mock("next/router", () => ({
    useRouter: () => routerMock,
}));

vi.mock("../../../context/userContext", () => ({
    useUserContext: vi.fn(),
}));

vi.mock("../../../utils/auth", () => ({
    getAccessToken: vi.fn(),
}));

vi.mock("../../../api/api", () => ({
    getSettings: vi.fn(),
    getTransactionTentativeAmount: vi.fn(),
    sendFiat: vi.fn(),
}));

vi.mock("../../../components/ContactsList", () => ({
    default: () => null,
}));

vi.mock("../../../hooks/useAmountNumpad", () => ({
    default: () => ({
        numpadActive: false,
        numpadAvailable: false,
        toggleNumpad: vi.fn(),
    }),
}));

type SendFixture = {
    readonly combinedBalance: number;
    readonly fastFiatTransferFee: number;
    readonly fiatTransferFee: number;
    readonly mandatoryAliasValidation: boolean;
    readonly minPaymentAmountArs: number;
    readonly usdtBalance: number;
    readonly rateUsdtArsBuy: number;
};

const defaultFixture: SendFixture = {
    combinedBalance: 5_000,
    fastFiatTransferFee: 0.04,
    fiatTransferFee: 0.02,
    mandatoryAliasValidation: false,
    minPaymentAmountArs: 500,
    usdtBalance: 100,
    rateUsdtArsBuy: 1_000,
};

function mockSendPage(fixture: SendFixture = defaultFixture): void {
    vi.mocked(useUserContext).mockReturnValue({
        user: {
            combinedBalance: fixture.combinedBalance,
            fastFiatTransferFee: fixture.fastFiatTransferFee,
            fiatTransferFee: fixture.fiatTransferFee,
            mandatoryAliasValidation: fixture.mandatoryAliasValidation,
            rateUsdtArsBuy: fixture.rateUsdtArsBuy,
            showRecentFavContacts: false,
            usdtBalance: fixture.usdtBalance,
        },
    });
    vi.mocked(getAccessToken).mockResolvedValue("access-token");
    vi.mocked(getSettings).mockResolvedValue({
        fast_fiat_transfer_fee: fixture.fastFiatTransferFee,
        fiat_transfer_fee: fixture.fiatTransferFee,
        min_payment_amount_ars: fixture.minPaymentAmountArs,
    });
    vi.mocked(getTransactionTentativeAmount).mockResolvedValue({
        data: {
            exchange_rate: 1_000,
            fee: 1.25,
            total_amount: 1.25,
            valid_cbu_alias: true,
        },
        status: 200,
    });
    vi.mocked(sendFiat).mockResolvedValue({
        data: { transaction_id: "fiat-tx-123" },
        status: 201,
    });
}

async function chooseFastSend(
    user: ReturnType<typeof userEvent.setup>
): Promise<void> {
    renderWithTamagui(<NewSendPage />);

    await waitFor(() => {
        expect(getSettings).toHaveBeenCalledOnce();
    });

    await user.click(screen.getByRole("button", { name: /fast send/i }));
}

describe("newSend ARS flow", () => {
    beforeEach(() => {
        routerMock.back.mockReset();
        routerMock.push.mockReset();
        mockSendPage();
    });

    it("requires a recipient before continuing when sending ARS", async () => {
        const user = userEvent.setup();

        await chooseFastSend(user);

        const nextButton = screen.getByRole("button", { name: /^next$/i });
        expect(nextButton).toBeDisabled();

        await user.type(
            screen.getByPlaceholderText(/address or wapu id/i),
            "receiver.alias"
        );

        expect(nextButton).toBeEnabled();
    });

    it("shows minimum and balance validation before quoting the ARS transfer", async () => {
        const user = userEvent.setup();

        await chooseFastSend(user);
        await user.type(
            screen.getByPlaceholderText(/name of receiver/i),
            "Ada"
        );
        await user.type(
            screen.getByPlaceholderText(/address or wapu id/i),
            "ada.cvu"
        );
        await user.click(screen.getByRole("button", { name: /^next$/i }));

        const amountInput = screen.getByPlaceholderText(/enter amount/i);
        const amountNextButton = screen.getByRole("button", {
            name: /^next$/i,
        });

        await user.type(amountInput, "499");
        expect(
            screen.getByText(/you have to send a minimum of \$500 pesos/i)
        ).toBeVisible();
        expect(amountNextButton).toBeDisabled();

        await user.clear(amountInput);
        await user.type(amountInput, "5001");
        expect(
            screen.getByText(/you don't have enough money to send this amount/i)
        ).toBeVisible();
        expect(amountNextButton).toBeDisabled();
        expect(getTransactionTentativeAmount).not.toHaveBeenCalled();
    });

    it("quotes a fast ARS transfer and sends the pending transaction payload", async () => {
        const user = userEvent.setup();

        await chooseFastSend(user);
        await user.type(
            screen.getByPlaceholderText(/name of receiver/i),
            "Ada Lovelace"
        );
        await user.type(
            screen.getByPlaceholderText(/address or wapu id/i),
            "ada.cvu"
        );
        await user.click(screen.getByRole("button", { name: /^next$/i }));
        await user.type(screen.getByPlaceholderText(/enter amount/i), "1000");
        await user.click(screen.getByRole("button", { name: /^next$/i }));

        await waitFor(() => {
            expect(getTransactionTentativeAmount).toHaveBeenCalledWith({
                alias: "ada.cvu",
                amount: 1_000,
                currency_payment: "ARS",
                currency_taken: "USDT",
                type: "fast_fiat_transfer",
            });
        });

        await user.click(screen.getByRole("button", { name: /^confirm$/i }));

        expect(sendFiat).toHaveBeenCalledWith({
            alias: "ada.cvu",
            currency_taken: "USDT",
            payment_amount: 1_000,
            receiver_name: "Ada Lovelace",
            type: "fast_fiat_transfer",
        });
        expect(routerMock.push).toHaveBeenCalledWith(
            "/newTransactionPending?id=fiat-tx-123&transaction_type=fast_fiat_transfer"
        );
    });

    it("uses the regular ARS transfer type for standard sends", async () => {
        const user = userEvent.setup();
        renderWithTamagui(<NewSendPage />);

        await waitFor(() => {
            expect(getSettings).toHaveBeenCalledOnce();
        });

        await user.click(
            screen.getByRole("button", { name: /standard send/i })
        );
        await user.type(
            screen.getByPlaceholderText(/address or wapu id/i),
            "standard.cvu"
        );
        await user.click(screen.getByRole("button", { name: /^next$/i }));
        await user.type(screen.getByPlaceholderText(/enter amount/i), "750");
        await user.click(screen.getByRole("button", { name: /^next$/i }));

        await waitFor(() => {
            expect(getTransactionTentativeAmount).toHaveBeenCalledWith(
                expect.objectContaining({
                    alias: "standard.cvu",
                    amount: 750,
                    type: "fiat_transfer",
                })
            );
        });
    });
});
