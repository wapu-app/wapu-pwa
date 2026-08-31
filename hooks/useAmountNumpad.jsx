import { useCallback, useEffect, useState } from "react";
import { useMedia } from "tamagui";

const STORAGE_KEY = "wapu.numpadEnabled";

/**
 * Preference + availability for the custom amount numpad.
 * - numpadAvailable: render the numpad block (toggle included). Touch devices only.
 * - numpadActive: the key grid is visible and the native keyboard must be
 *   suppressed (pass inputMode="none" to the amount input).
 * - toggleNumpad: flips the preference and persists it in localStorage.
 *
 * `ready` stays false during SSR and the first client render so server and
 * client markup match (no hydration mismatch, no numpad flash on desktop).
 */
export default function useAmountNumpad() {
    const media = useMedia();
    const [enabled, setEnabled] = useState(true);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setEnabled(window.localStorage.getItem(STORAGE_KEY) !== "false");
        setReady(true);
    }, []);

    const toggleNumpad = useCallback(() => {
        setEnabled((prev) => {
            const next = !prev;
            window.localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
        // iOS keeps the keyboard hidden on an input focused with
        // inputMode="none"; blur so the next tap opens the native keyboard.
        document.activeElement?.blur?.();
    }, []);

    const numpadAvailable = ready && media.pointerCoarse;

    return {
        numpadAvailable,
        numpadActive: numpadAvailable && enabled,
        toggleNumpad,
    };
}
