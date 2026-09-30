import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContactsList from "../../../components/ContactsList";
import { getContacts } from "../../../api/api";
import { renderWithTamagui } from "../../test-utils";

vi.mock("next/image", () => ({
    default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("../../../api/api", () => ({
    deleteContact: vi.fn(),
    getContacts: vi.fn(),
    toggleContactFavorite: vi.fn(),
}));

const wapuContact = {
    bank_alias: null,
    created_at: "2026-09-19T00:00:00Z",
    id: 42,
    is_favourite: false,
    name_label: "satoshi",
    name_label_id: 7,
    network: "WAPU_USERS",
    updated_at: "2026-09-19T00:00:00Z",
    user_id: 1,
    wallet_address: null,
};

describe("ContactsList", () => {
    beforeEach(() => {
        vi.mocked(getContacts).mockResolvedValue({
            data: { contacts: [wapuContact] },
            status: 200,
        });
    });

    it("shows a Wapu contact's full Lightning Address while preserving its username for transfers", async () => {
        const user = userEvent.setup();
        const onContactSelect = vi.fn();

        renderWithTamagui(<ContactsList onContactSelect={onContactSelect} />);

        const lightningAddress = await screen.findByText("satoshi@wapu.app");
        await user.click(lightningAddress);

        expect(onContactSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 42,
                selectedAddress: "satoshi",
            })
        );
    });
});
