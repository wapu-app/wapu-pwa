import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import BuyBitcoinCard from "../../../components/BuyBitcoinCard/BuyBitcoinCard";
import { renderWithTamagui } from "../../test-utils";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/router", () => ({ useRouter: () => ({ push }) }));

describe("BuyBitcoinCard", () => {
    it("sends the user to /swaps", async () => {
        const user = userEvent.setup();
        renderWithTamagui(<BuyBitcoinCard />);

        expect(screen.getByText("Buy Bitcoin without KYC")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Swaps" }));
        expect(push).toHaveBeenCalledWith("/swaps");
    });
});
