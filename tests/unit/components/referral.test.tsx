import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Referral from "../../../components/Referral/referral";
import { getReferralCode } from "../../../api/api";
import { useUserContext } from "../../../context/userContext";
import { renderWithTamagui } from "../../test-utils";

vi.mock("../../../api/api", () => ({
    getReferralCode: vi.fn(),
}));

vi.mock("../../../context/userContext", () => ({
    useUserContext: vi.fn(),
}));

const mockContext = () => {
    vi.mocked(useUserContext).mockReturnValue({
        user: {
            referralRewardFeePercentage: 0.5,
            referralRewardsDays: 90,
            discountReferralsPercentage: 1,
            discountReferralsDays: 1,
        },
    });
    vi.mocked(getReferralCode).mockResolvedValue({
        data: { referral_link: "https://wapu.app/r/abc" },
        status: 200,
    });
};

describe("Referral", () => {
    beforeEach(mockContext);

    // The dialog is mounted on /home even when closed, twice over. A mount
    // effect here meant six POST /users/referral per visit under StrictMode.
    it("does not ask for a referral link while it is closed", async () => {
        renderWithTamagui(<Referral isOpen={false} setIsOpen={vi.fn()} />);

        await waitFor(() => {
            expect(getReferralCode).not.toHaveBeenCalled();
        });
    });

    it("asks for the link once when it opens", async () => {
        const { rerender } = renderWithTamagui(
            <Referral isOpen={false} setIsOpen={vi.fn()} />
        );

        expect(getReferralCode).not.toHaveBeenCalled();

        rerender(<Referral isOpen setIsOpen={vi.fn()} />);

        await waitFor(() => {
            expect(getReferralCode).toHaveBeenCalledTimes(1);
        });
        expect(getReferralCode).toHaveBeenCalledWith("", "");
        expect(
            await screen.findByDisplayValue("https://wapu.app/r/abc")
        ).toBeInTheDocument();
    });

    it("does not re-fetch when it is reopened with a link already loaded", async () => {
        const { rerender } = renderWithTamagui(
            <Referral isOpen setIsOpen={vi.fn()} />
        );

        await waitFor(() => {
            expect(getReferralCode).toHaveBeenCalledTimes(1);
        });

        rerender(<Referral isOpen={false} setIsOpen={vi.fn()} />);
        rerender(<Referral isOpen setIsOpen={vi.fn()} />);

        await waitFor(() => {
            expect(getReferralCode).toHaveBeenCalledTimes(1);
        });
    });
});
