import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "../../../components/Header";
import { useUserContext } from "../../../context/userContext";
import { usePathname } from "next/navigation";
import { renderWithTamagui } from "../../test-utils";

vi.mock("next/navigation", () => ({
    usePathname: vi.fn(),
}));

vi.mock("../../../context/userContext", () => ({
    useUserContext: vi.fn(),
}));

vi.mock("../../../components/Burger/index", () => ({
    default: () => <div data-testid="account-menu-trigger" />,
}));

vi.mock("../../../components/MediaIcons", () => ({
    default: () => null,
}));

vi.mock("../../../components/HelpButton", () => ({
    default: () => <button type="button">help</button>,
}));

const renderAt = (pathname: string) => {
    vi.mocked(usePathname).mockReturnValue(pathname);
    vi.mocked(useUserContext).mockReturnValue({
        setHelpModalState: vi.fn(),
    });
    renderWithTamagui(<Header />);
};

describe("Header", () => {
    // These two routes draw their own header with a back arrow; the global one
    // used to stack the My Account avatar on top of it.
    it.each(["/profile", "/apiKey"])(
        "keeps the account menu out of %s",
        (pathname) => {
            renderAt(pathname);

            expect(
                screen.queryByTestId("account-menu-trigger")
            ).not.toBeInTheDocument();
        }
    );

    it("still renders the account menu on routes without their own header", () => {
        renderAt("/innerTransfer");

        expect(
            screen.getByTestId("account-menu-trigger")
        ).toBeInTheDocument();
    });

    // Derived from the pathname, so it must be right on the very first render:
    // the previous useState(false) + useEffect briefly mounted Burger everywhere.
    it("hides the account menu on the first render of a hidden route", () => {
        renderAt("/home");

        expect(
            screen.queryByTestId("account-menu-trigger")
        ).not.toBeInTheDocument();
    });

    it("shows the help button only on the QR payment route", () => {
        renderAt("/qrPayment");
        expect(screen.getByRole("button", { name: "help" })).toBeInTheDocument();
    });
});
