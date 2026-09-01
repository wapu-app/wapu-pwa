import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import TamaguiSendModal from "../../../components/TamaguiSendModal";
import { renderWithTamagui } from "../../test-utils";

const routerPush = vi.fn();

vi.mock("next/router", () => ({
    useRouter: () => ({
        push: routerPush,
    }),
}));

type DialogRootProps = {
    readonly children: ReactNode;
    readonly onOpenChange?: (open: boolean) => void;
    readonly open?: boolean;
};

type DialogChildrenProps = {
    readonly children?: ReactNode;
};

let dismissDialog: (() => void) | undefined;

vi.mock("tamagui", async (importOriginal) => {
    const actual = await importOriginal<typeof import("tamagui")>();
    const DialogRoot = ({ children, onOpenChange, open = true }: DialogRootProps) => {
        dismissDialog = () => onOpenChange?.(false);
        return open ? <div data-testid="dialog-root">{children}</div> : null;
    };
    const Dialog = Object.assign(DialogRoot, {
        Content: ({ children }: DialogChildrenProps) => <div>{children}</div>,
        Overlay: () => (
            <button type="button" aria-label="Dismiss dialog" onClick={() => dismissDialog?.()} />
        ),
        Portal: ({ children }: DialogChildrenProps) => <>{children}</>,
    });

    return {
        ...actual,
        Dialog,
    };
});

describe("TamaguiSendModal", () => {
    it("calls onClose when the dialog is dismissed", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        renderWithTamagui(<TamaguiSendModal isOpen onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: "Dismiss dialog" }));

        expect(onClose).toHaveBeenCalledWith(false);
    });

    it("routes to the selected send flow", async () => {
        const user = userEvent.setup();
        routerPush.mockClear();

        renderWithTamagui(<TamaguiSendModal isOpen onClose={vi.fn()} />);

        await user.click(
            screen.getByRole("button", {
                name: /send local currency/i,
            }),
        );
        await user.click(
            screen.getByRole("button", {
                name: /send digital dollar/i,
            }),
        );

        expect(routerPush).toHaveBeenNthCalledWith(1, "/newSend");
        expect(routerPush).toHaveBeenNthCalledWith(2, "/newWithdrawal");
    });
});
