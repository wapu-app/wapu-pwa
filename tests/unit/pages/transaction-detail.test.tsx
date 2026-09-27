import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TransactionDetail from "../../../pages/newTransactionDetail";
import { getTransaction } from "../../../api/api";
import { renderWithTamagui } from "../../test-utils";

const routerMock = vi.hoisted(() => ({
    back: vi.fn(),
    push: vi.fn(),
    query: { id: "inner-transfer-id" },
}));

vi.mock("next/router", () => ({
    useRouter: () => routerMock,
}));

vi.mock("next/image", () => ({
    default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("../../../api/api", () => ({
    getTransaction: vi.fn(),
}));

vi.mock("../../../components/CopyButton", () => ({
    default: () => null,
}));

vi.mock("../../../components/TamaguiButton", () => ({
    default: ({ text }: { readonly text: string }) => <button>{text}</button>,
}));

vi.mock("../../../components/newHeaderButton", () => ({
    default: ({ children }: { readonly children?: string }) => (
        <header>{children}</header>
    ),
}));

vi.mock("../../../utils/cancelPayment", () => ({
    cancelTransaction: vi.fn(),
}));

const sentInnerTransfer = {
    address_destination: null,
    address_index: null,
    alias: null,
    blockchain_trx_id: null,
    created_at: "2026-09-19T00:00:00Z",
    currency_taken: "USDT",
    current_rate: 1,
    external_reference: null,
    fee_taken: 0,
    is_positive: false,
    lnurl_pr_invoice: null,
    lnurl_verify_invoice: null,
    network: null,
    note: "You sent 25 USDT to satoshi",
    payment_amount: 25,
    payment_currency: "USDT",
    qr_image_url: null,
    receipt_image_url: null,
    receiver_name: "satoshi",
    sender_username: null,
    source_address: null,
    status: "completed",
    total_amount_taken: 25,
    transaction_id: "inner-transfer-id",
    type: "send_inner_transf",
    type_name: "Send digital dollars",
};

describe("TransactionDetail", () => {
    beforeEach(() => {
        routerMock.query = { id: "inner-transfer-id" };
        vi.mocked(getTransaction).mockResolvedValue({
            data: sentInnerTransfer,
            status: 200,
        });
    });

    it("shows the recipient's full Lightning Address for a sent inner transfer", async () => {
        renderWithTamagui(<TransactionDetail />);

        expect(await screen.findByText("satoshi@wapu.app")).toBeVisible();
    });
});
