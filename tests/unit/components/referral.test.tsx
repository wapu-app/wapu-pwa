import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Referral from "../../../components/Referral/referral";
import { getReferralCode } from "../../../api/api";
import { useUserContext } from "../../../context/userContext";
import { renderWithTamagui } from "../../test-utils";

type ReferralResponse = {
    data: { referral_link: string };
    status: number;
};

function createDeferredReferralResponse() {
    let resolvePromise: ((response: ReferralResponse) => void) | undefined;
    const promise = new Promise<ReferralResponse>((resolve) => {
        resolvePromise = resolve;
    });

    return {
        promise,
        resolve(response: ReferralResponse) {
            if (!resolvePromise) {
                throw new Error("Deferred referral response is not initialized");
            }
            resolvePromise(response);
        },
    };
}

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

    it("keeps the manual referral link when the automatic request resolves later", async () => {
        const user = userEvent.setup();
        const automaticResponse = createDeferredReferralResponse();
        const manualResponse = createDeferredReferralResponse();
        vi.mocked(getReferralCode)
            .mockReturnValueOnce(automaticResponse.promise)
            .mockReturnValueOnce(manualResponse.promise);

        renderWithTamagui(<Referral isOpen setIsOpen={vi.fn()} />);

        await waitFor(() => {
            expect(getReferralCode).toHaveBeenCalledWith("", "");
        });

        const emailInput = screen
            .getAllByRole("textbox")
            .find((input) => !input.hasAttribute("readonly"));
        if (!emailInput) {
            throw new Error("Referral email input was not rendered");
        }
        await user.type(emailInput, "friend@example.com");
        await user.click(screen.getByRole("button", { name: "Get your link" }));

        await act(async () => {
            manualResponse.resolve({
                data: { referral_link: "https://wapu.app/r/manual" },
                status: 200,
            });
        });
        expect(
            await screen.findByDisplayValue("https://wapu.app/r/manual")
        ).toBeInTheDocument();

        await act(async () => {
            automaticResponse.resolve({
                data: { referral_link: "https://wapu.app/r/automatic" },
                status: 200,
            });
        });

        await waitFor(() => {
            expect(
                screen.getByDisplayValue("https://wapu.app/r/manual")
            ).toBeInTheDocument();
        });
    });
});
