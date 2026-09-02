import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DepositChoice from "../../../pages/newDepositChoice";
import { renderWithTamagui } from "../../test-utils";

const mocks = vi.hoisted(() => ({
    back: vi.fn(),
    push: vi.fn(),
    user: {
        alternativeDeposit: false,
    },
}));

vi.mock("next/router", () => ({
    useRouter: () => ({
        back: mocks.back,
        push: mocks.push,
    }),
}));

vi.mock("../../../context/userContext", () => ({
    useUserContext: () => ({
        user: mocks.user,
    }),
}));

describe("newDepositChoice", () => {
    beforeEach(() => {
        mocks.back.mockClear();
        mocks.push.mockClear();
        mocks.user.alternativeDeposit = false;
    });

    it("routes to blockchain deposit when the blockchain option is selected", async () => {
        // Given
        const user = userEvent.setup();
        renderWithTamagui(<DepositChoice />);

        // When
        await user.click(screen.getByText("Blockchain"));

        // Then
        expect(mocks.push).toHaveBeenCalledWith("/newBlockchainDeposit");
    });

    it("routes to bitcoin deposit when the bitcoin option is selected", async () => {
        // Given
        const user = userEvent.setup();
        renderWithTamagui(<DepositChoice />);

        // When
        await user.click(screen.getByText("Bitcoin"));

        // Then
        expect(mocks.push).toHaveBeenCalledWith("/bitcoinDeposit");
    });

    it("shows and routes to alternative deposit when the user is enabled", async () => {
        // Given
        const user = userEvent.setup();
        mocks.user.alternativeDeposit = true;
        renderWithTamagui(<DepositChoice />);

        // When
        await user.click(screen.getByText("Other Alternative"));

        // Then
        expect(mocks.push).toHaveBeenCalledWith("/newAlternativeDeposit");
    });

    it("hides alternative deposit when the user is not enabled", () => {
        // Given / When
        renderWithTamagui(<DepositChoice />);

        // Then
        expect(screen.queryByText("Other Alternative")).not.toBeInTheDocument();
    });
});
