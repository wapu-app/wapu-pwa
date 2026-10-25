import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewTransactionPendingPage from "../../../pages/newTransactionPending";
import { renderWithTamagui } from "../../test-utils";

const routerMock = vi.hoisted(() => ({
    push: vi.fn(),
    query: {} as Record<string, string>,
}));

vi.mock("next/router", () => ({
    useRouter: () => routerMock,
}));

describe("newTransactionPending", () => {
    beforeEach(() => {
        routerMock.query = {};
    });

    it("keeps the 4 hour message for a regular withdrawal", () => {
        routerMock.query = { id: "tx-1", transaction_type: "withdraw" };
        renderWithTamagui(<NewTransactionPendingPage />);

        expect(
            screen.getByText("It will take up to 4 hours to be completed")
        ).toBeVisible();
    });

    it("shows the 5 minute message for an automatic withdrawal", () => {
        routerMock.query = {
            id: "tx-1",
            transaction_type: "withdraw",
            auto: "1",
        };
        renderWithTamagui(<NewTransactionPendingPage />);

        expect(
            screen.getByText("It usually takes about 5 minutes to be completed")
        ).toBeVisible();
    });
});
