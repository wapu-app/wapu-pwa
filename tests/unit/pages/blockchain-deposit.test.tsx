import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewBlockchainDeposit from "../../../pages/newBlockchainDeposit";
import { renderWithTamagui } from "../../test-utils";

type DepositPayload = {
    readonly amount: string;
    readonly currency: string;
    readonly network: string;
};

type SelectItem = {
    readonly id: string;
    readonly name: string;
};

const mocks = vi.hoisted(() => ({
    back: vi.fn(),
    getUser: vi.fn(),
    postDeposit: vi.fn(),
    push: vi.fn(),
    user: {
        blockchains: [
            {
                address: "0xpolygon-metadata",
                network: "POLYGON",
                network_name: "Polygon",
            },
            {
                address: "liquid-metadata",
                network: "LIQUID",
                network_name: "Liquid",
            },
        ],
        minDepositUsdt: "10",
    },
}));

vi.mock("next/router", () => ({
    useRouter: () => ({
        back: mocks.back,
        push: mocks.push,
    }),
}));

vi.mock("qrcode.react", async () => {
    const React = await vi.importActual<typeof import("react")>("react");

    return {
        default: ({ value }: { readonly value: string }) =>
            React.createElement("img", {
                alt: "deposit qr",
                src: `qr:${value}`,
            }),
    };
});

vi.mock("../../../api/api", () => ({
    postDeposit: (payload: DepositPayload) => mocks.postDeposit(payload),
}));

vi.mock("../../../context/userContext", () => ({
    useUserContext: () => ({
        getUser: mocks.getUser,
        user: mocks.user,
    }),
}));

vi.mock("../../../components/ErrorModal", async () => {
    const React = await vi.importActual<typeof import("react")>("react");

    return {
        default: ({
            message,
            state,
        }: {
            readonly message: string;
            readonly state: boolean;
        }) =>
            state
                ? React.createElement("div", { role: "alert" }, message)
                : null,
    };
});

vi.mock("../../../components/TamaguiSelect", async () => {
    const React = await vi.importActual<typeof import("react")>("react");

    return {
        TamaguiSelect: ({
            items,
            onChange,
            placeholder,
            value,
        }: {
            readonly items: readonly SelectItem[];
            readonly onChange: (index: number) => void;
            readonly placeholder: string;
            readonly value: string;
        }) =>
            React.createElement(
                "label",
                undefined,
                placeholder,
                React.createElement(
                    "select",
                    {
                        "aria-label": placeholder,
                        onChange: (
                            event: React.ChangeEvent<HTMLSelectElement>,
                        ) => {
                            const selectedIndex = items.findIndex(
                                (item) =>
                                    item.name === event.currentTarget.value,
                            );
                            onChange(selectedIndex);
                        },
                        value,
                    },
                    React.createElement(
                        "option",
                        {
                            disabled: true,
                            value: "",
                        },
                        placeholder,
                    ),
                    ...items.map((item) =>
                        React.createElement(
                            "option",
                            {
                                key: item.id,
                                value: item.name,
                            },
                            item.name,
                        ),
                    ),
                ),
            ),
    };
});

vi.mock("../../../hooks/useAmountNumpad", () => ({
    default: () => ({
        numpadActive: false,
        numpadAvailable: false,
        toggleNumpad: vi.fn(),
    }),
}));

async function chooseOption(label: string, option: string): Promise<void> {
    const user = userEvent.setup();

    await user.selectOptions(
        screen.getByRole("combobox", { name: label }),
        option,
    );
}

async function completeDepositForm(
    amount: string,
    network: string,
    currency: string,
): Promise<void> {
    const user = userEvent.setup();

    await chooseOption("Select network", network);
    if (network !== "Liquid" || currency !== "USDT") {
        await chooseOption("Select currency", currency);
    }
    await user.type(screen.getByPlaceholderText("Enter Amount"), amount);
}

describe("newBlockchainDeposit", () => {
    beforeEach(() => {
        mocks.back.mockClear();
        mocks.getUser.mockClear();
        mocks.postDeposit.mockReset();
        mocks.push.mockClear();
    });

    it("loads user networks and displays the minimum deposit amount", async () => {
        // Given
        renderWithTamagui(<NewBlockchainDeposit />);

        // When
        await chooseOption("Select network", "Polygon");

        // Then
        expect(mocks.getUser).toHaveBeenCalledOnce();
        expect(screen.getByText("Deposit by Polygon")).toBeInTheDocument();
        expect(
            screen.getByText("You have to deposit minimum 10 USDT/USDC."),
        ).toBeInTheDocument();
    });

    it("locks Liquid deposits to USDT and posts the Liquid payload", async () => {
        // Given
        const user = userEvent.setup();
        mocks.postDeposit.mockResolvedValue({
            data: {
                address_destination: "liquid-derived-address",
                transaction_id: "tx-liquid",
            },
            status: 201,
        });
        renderWithTamagui(<NewBlockchainDeposit />);

        // When
        await completeDepositForm("25", "Liquid", "USDT");
        await user.click(screen.getByRole("button", { name: "Next" }));

        // Then
        await waitFor(() => {
            expect(mocks.postDeposit).toHaveBeenCalledWith({
                amount: "25",
                currency: "USDT",
                network: "LIQUID",
            });
        });
        expect(
            await screen.findByDisplayValue("liquid-derived-address"),
        ).toBeInTheDocument();
    });

    it("posts the selected network/currency payload and navigates after confirmation", async () => {
        // Given
        const user = userEvent.setup();
        mocks.postDeposit.mockResolvedValue({
            data: {
                address_destination: "0xdeposit-address",
                transaction_id: "tx-123",
            },
            status: 200,
        });
        renderWithTamagui(<NewBlockchainDeposit />);

        // When
        await completeDepositForm("42.5", "Polygon", "USDC");
        await user.click(screen.getByRole("button", { name: "Next" }));

        // Then
        await waitFor(() => {
            expect(mocks.postDeposit).toHaveBeenCalledWith({
                amount: "42.5",
                currency: "USDC",
                network: "POLYGON",
            });
        });
        expect(await screen.findByText("Send the funds to this address")).toBeInTheDocument();
        expect(screen.getByDisplayValue("0xdeposit-address")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Confirm" }));

        expect(mocks.push).toHaveBeenCalledWith(
            "/newTransactionComplete?id=tx-123&transaction_type=deposit",
        );
    });

    it("shows the API error when the deposit request returns an HTTP error", async () => {
        // Given
        const user = userEvent.setup();
        mocks.postDeposit.mockResolvedValue({
            data: {
                error: "Minimum deposit is 10 USDT.",
            },
            status: 400,
        });
        renderWithTamagui(<NewBlockchainDeposit />);

        // When
        await completeDepositForm("25", "Polygon", "USDT");
        await user.click(screen.getByRole("button", { name: "Next" }));

        // Then
        expect(
            await screen.findByText("Minimum deposit is 10 USDT."),
        ).toBeInTheDocument();
    });

    it("shows a generic error when the deposit request rejects", async () => {
        // Given
        const user = userEvent.setup();
        mocks.postDeposit.mockRejectedValue(new Error("Network failed"));
        renderWithTamagui(<NewBlockchainDeposit />);

        // When
        await completeDepositForm("25", "Polygon", "USDT");
        await user.click(screen.getByRole("button", { name: "Next" }));

        // Then
        expect(
            await screen.findByText(
                "An unexpected error occurred. Please try again later.",
            ),
        ).toBeInTheDocument();
    });
});
