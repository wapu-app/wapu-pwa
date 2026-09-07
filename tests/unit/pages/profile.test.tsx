import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "../../../pages/profile";
import {
    checkUsernameAvailability,
    getProfile,
    sendRecoverPasswordEmail,
    updateProfile,
} from "../../../api/api";
import { useUserContext } from "../../../context/userContext";
import { renderWithTamagui } from "../../test-utils";

vi.mock("next/router", () => ({
    useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("../../../context/userContext", () => ({
    useUserContext: vi.fn(),
}));

vi.mock("../../../api/api", () => ({
    checkUsernameAvailability: vi.fn(),
    getProfile: vi.fn(),
    sendRecoverPasswordEmail: vi.fn(),
    updateProfile: vi.fn(),
}));

vi.mock("../../../components/TamaguiInput", () => ({
    default: ({
        label,
        onChange,
        value,
    }: {
        readonly label?: string;
        readonly onChange: (value: string) => void;
        readonly value: string;
    }) => (
        <label>
            {label}
            <input
                aria-label={label}
                onChange={(event) => onChange(event.currentTarget.value)}
                value={value}
            />
        </label>
    ),
}));

vi.mock("../../../components/TamaguiButton", () => ({
    default: ({ text }: { readonly text: string }) => <button>{text}</button>,
}));

vi.mock("../../../components/TamaguiLink", () => ({
    default: ({ text }: { readonly text: string }) => <button>{text}</button>,
}));

vi.mock("../../../components/newHeaderButton", () => ({
    default: ({ children }: { readonly children: string }) => <h1>{children}</h1>,
}));

vi.mock("../../../components/ErrorModal", () => ({
    default: () => null,
}));

describe("Profile", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            getUser: vi.fn(),
            user: {
                email: "satoshi@example.com",
                lightningAddress: "satoshi@wapu.app",
            },
        });
        vi.mocked(getProfile).mockResolvedValue({
            data: {
                email: "satoshi@example.com",
                network: "bitcoin",
                npub: "",
                phone: "",
                telegram: "",
                username: "satoshi",
            },
        });
        vi.mocked(checkUsernameAvailability).mockResolvedValue(true);
        vi.mocked(sendRecoverPasswordEmail).mockResolvedValue({});
        vi.mocked(updateProfile).mockResolvedValue({ data: {}, status: 200 });
    });

    it("updates the displayed Lightning Address while the username is edited", async () => {
        const user = userEvent.setup();

        renderWithTamagui(<Profile />);

        await waitFor(() => {
            expect(screen.getByLabelText("Username")).toHaveValue("satoshi");
        });

        await user.clear(screen.getByLabelText("Username"));
        await user.type(screen.getByLabelText("Username"), "nakamoto");

        expect(screen.getByText("nakamoto@wapu.app")).toBeVisible();
    });
});
