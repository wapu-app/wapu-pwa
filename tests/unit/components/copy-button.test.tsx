import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CopyButton, {
    COPIED_FEEDBACK_MS,
} from "../../../components/CopyButton";
import { renderWithTamagui } from "../../test-utils";

// The clipboard stub lives in tests/setup.tsx. userEvent.setup() would install
// its own stub over it, so these tests drive the button with fireEvent.
const clipboard = navigator.clipboard as unknown as {
    writeText: ReturnType<typeof vi.fn>;
};

const clickCopy = () =>
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

describe("CopyButton", () => {
    it("writes the value to the clipboard and confirms with Copied", async () => {
        renderWithTamagui(<CopyButton value="lnbc-invoice" />);

        expect(screen.queryByText("Copied")).not.toBeInTheDocument();

        clickCopy();

        expect(clipboard.writeText).toHaveBeenCalledWith("lnbc-invoice");
        expect(await screen.findByText("Copied")).toBeInTheDocument();
    });

    it("clears the confirmation once the feedback window elapses", async () => {
        vi.useFakeTimers();
        try {
            renderWithTamagui(<CopyButton value="token" />);

            clickCopy();
            // The clipboard write is awaited, so let its microtask settle
            // before the confirmation is asserted.
            await act(async () => {});
            expect(screen.getByText("Copied")).toBeInTheDocument();

            await act(async () => {
                vi.advanceTimersByTime(COPIED_FEEDBACK_MS);
            });

            expect(screen.queryByText("Copied")).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it("reports a clipboard failure instead of confirming", async () => {
        const onError = vi.fn();
        clipboard.writeText.mockRejectedValueOnce(new Error("denied"));
        renderWithTamagui(<CopyButton value="token" onError={onError} />);

        clickCopy();

        await waitFor(() => {
            expect(onError).toHaveBeenCalledTimes(1);
        });
        expect(screen.queryByText("Copied")).not.toBeInTheDocument();
    });

    it("keeps the caller's static label next to the button", () => {
        renderWithTamagui(<CopyButton value="token" label="Copy" />);

        expect(
            screen.getByRole("button", { name: "Copy" })
        ).toBeInTheDocument();
        expect(screen.getByText("Copy")).toBeInTheDocument();
    });
});
