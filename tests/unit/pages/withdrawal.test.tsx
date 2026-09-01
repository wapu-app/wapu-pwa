import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewWithdrawalPage from "../../../pages/newWithdrawal";
import { postInnerTransfer, postWithdrawal } from "../../../api/api";
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

vi.mock("../../../api/api", () => ({
    postInnerTransfer: vi.fn(),
    postWithdrawal: vi.fn(),
}));

vi.mock("../../../components/TamaguiSelect", () => ({
    TamaguiSelect: ({
        items,
        onChange,
        placeholder,
        value,
    }: {
        readonly items: readonly {
            readonly id: string;
            readonly name: string;
        }[];
        readonly onChange: (index: number) => void;
        readonly placeholder: string;
        readonly value?: string;
    }) => (
        <select
            aria-label="Network"
            onChange={(event) => {
                const selectedIndex = items.findIndex(
                    (item) => item.name === event.currentTarget.value
                );
                onChange(selectedIndex);
            }}
            value={value ?? ""}
        >
            <option disabled value="">
                {placeholder}
            </option>
            {items.map((item) => (
                <option key={item.id} value={item.name}>
                    {item.name}
                </option>
            ))}
        </select>
    ),
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

type BlockchainFixture = {
    readonly network: string;
    readonly network_name: string;
    readonly withdraw_fee: number;
};

const blockchains: readonly BlockchainFixture[] = [
    {
        network: "ethereum",
        network_name: "Ethereum",
        withdraw_fee: 2,
    },
    {
        network: "polygon",
        network_name: "Polygon",
        withdraw_fee: 0.5,
    },
];

function mockWithdrawalPage(): void {
    vi.mocked(useUserContext).mockReturnValue({
        getUser: vi.fn(),
        user: {
            blockchains,
            minimumWithdrawalAmountUsdt: 10,
            showRecentFavContacts: false,
        },
    });
    vi.mocked(postWithdrawal).mockResolvedValue({
        data: { transaction_id: "withdraw-tx-123" },
        status: 201,
    });
    vi.mocked(postInnerTransfer).mockResolvedValue({
        data: { transaction_id: "inner-tx-456" },
        status: 201,
    });
}

async function selectNetwork(
    user: ReturnType<typeof userEvent.setup>,
    networkName: RegExp
): Promise<void> {
    const networkSelect = screen.getByRole("combobox", { name: /network/i });
    await user.selectOptions(
        networkSelect,
        within(networkSelect).getByText(networkName)
    );
}

async function completeRecipientStep(
    user: ReturnType<typeof userEvent.setup>,
    networkName: RegExp,
    address: string
): Promise<void> {
    await selectNetwork(user, networkName);
    await user.type(
        screen.getByPlaceholderText(/name of receiver/i),
        "Grace Hopper"
    );
    await user.type(
        screen.getByPlaceholderText(/address or wapu id/i),
        address
    );
    await user.click(screen.getByRole("button", { name: /^next$/i }));
}

describe("newWithdrawal flow", () => {
    beforeEach(() => {
        routerMock.back.mockReset();
        routerMock.push.mockReset();
        mockWithdrawalPage();
    });

    it("requires a network and destination before the withdrawal amount step", async () => {
        const user = userEvent.setup();
        renderWithTamagui(<NewWithdrawalPage />);

        const nextButton = screen.getByRole("button", { name: /^next$/i });
        expect(nextButton).toBeDisabled();

        await selectNetwork(user, /^ethereum$/i);
        expect(nextButton).toBeDisabled();

        await user.type(
            screen.getByPlaceholderText(/address or wapu id/i),
            "0xabc123"
        );
        expect(nextButton).toBeEnabled();
    });

    it("uses external withdrawal fees, minimums, API payload, and pending navigation", async () => {
        const user = userEvent.setup();
        renderWithTamagui(<NewWithdrawalPage />);

        await completeRecipientStep(user, /^ethereum$/i, "0xabc123");

        expect(screen.getByText("2 USDT")).toBeVisible();
        expect(
            screen.getByText(/you have to send minimum 12 usdt/i)
        ).toBeVisible();

        const amountInput = screen.getByPlaceholderText(/enter amount/i);
        const nextButton = screen.getByRole("button", { name: /^next$/i });

        await user.type(amountInput, "11");
        expect(nextButton).toBeDisabled();

        await user.clear(amountInput);
        await user.type(amountInput, "20");
        expect(screen.getByText("18.00 USDT")).toBeVisible();
        expect(nextButton).toBeEnabled();

        await user.click(nextButton);
        await user.click(screen.getByRole("button", { name: /^confirm$/i }));

        await waitFor(() => {
            expect(postWithdrawal).toHaveBeenCalledWith({
                address: "0xabc123",
                amount: "20",
                currency: "USDT",
                network: "ethereum",
                receiver_name: "Grace Hopper",
                receiver_username: "0xabc123",
            });
        });
        expect(postInnerTransfer).not.toHaveBeenCalled();
        expect(routerMock.push).toHaveBeenCalledWith({
            pathname: "/newTransactionPending",
            query: {
                id: "withdraw-tx-123",
                transaction_type: "withdraw",
            },
        });
    });

    it("uses the Wapu user transfer API and routes to completed transactions", async () => {
        const user = userEvent.setup();
        renderWithTamagui(<NewWithdrawalPage />);

        await completeRecipientStep(user, /^wapu users$/i, "grace.wapu");

        expect(screen.getAllByText("0 USDT")).toHaveLength(2);
        expect(
            screen.getByText(/you have to send minimum 10 usdt/i)
        ).toBeVisible();

        await user.type(screen.getByPlaceholderText(/enter amount/i), "15");
        await user.click(screen.getByRole("button", { name: /^next$/i }));
        await user.click(screen.getByRole("button", { name: /^confirm$/i }));

        await waitFor(() => {
            expect(postInnerTransfer).toHaveBeenCalledWith({
                address: "grace.wapu",
                amount: "15",
                currency: "USDT",
                network: "inner_transfer",
                receiver_name: "Grace Hopper",
                receiver_username: "grace.wapu",
            });
        });
        expect(postWithdrawal).not.toHaveBeenCalled();
        expect(routerMock.push).toHaveBeenCalledWith({
            pathname: "/newTransactionComplete",
            query: {
                id: "inner-tx-456",
                transaction_type: "send_digital",
            },
        });
    });
});
