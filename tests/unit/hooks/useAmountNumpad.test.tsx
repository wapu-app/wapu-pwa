import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useAmountNumpad from "../../../hooks/useAmountNumpad";

const useMediaMock = vi.fn();

vi.mock("tamagui", async (importOriginal) => {
    const actual = await importOriginal<typeof import("tamagui")>();
    return {
        ...actual,
        useMedia: () => useMediaMock(),
    };
});

describe("useAmountNumpad", () => {
    beforeEach(() => {
        useMediaMock.mockReturnValue({ pointerCoarse: true });
    });

    it("renders safely before the client effect hydrates availability", async () => {
        // Given / When
        const ServerProbe = () => {
            useAmountNumpad();
            return null;
        };

        // Then
        expect(() => renderToString(<ServerProbe />)).not.toThrow();
        const { result } = renderHook(() => useAmountNumpad());
        await waitFor(() => expect(result.current.numpadAvailable).toBe(true));
        expect(result.current.numpadActive).toBe(true);
    });

    it("keeps the numpad inactive on non-touch devices", async () => {
        // Given
        useMediaMock.mockReturnValue({ pointerCoarse: false });

        // When
        const { result } = renderHook(() => useAmountNumpad());

        // Then
        await waitFor(() => expect(result.current.numpadAvailable).toBe(false));
        expect(result.current.numpadActive).toBe(false);
    });

    it("uses the persisted disabled preference", async () => {
        // Given
        window.localStorage.setItem("wapu.numpadEnabled", "false");

        // When
        const { result } = renderHook(() => useAmountNumpad());

        // Then
        await waitFor(() => expect(result.current.numpadAvailable).toBe(true));
        expect(result.current.numpadActive).toBe(false);
    });

    it("toggles preference, writes storage and blurs the active element", async () => {
        // Given
        document.body.innerHTML = '<input aria-label="amount" />';
        const input = document.querySelector("input");
        input?.focus();
        const blurSpy = vi.spyOn(HTMLElement.prototype, "blur");
        const { result } = renderHook(() => useAmountNumpad());
        await waitFor(() => expect(result.current.numpadActive).toBe(true));

        // When
        act(() => result.current.toggleNumpad());

        // Then
        expect(window.localStorage.getItem("wapu.numpadEnabled")).toBe("false");
        expect(result.current.numpadActive).toBe(false);
        expect(blurSpy).toHaveBeenCalled();
    });
});
