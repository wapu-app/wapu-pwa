import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import type { ImageProps } from "next/image";
import React from "react";
import { afterEach, vi } from "vitest";

vi.mock("next/image", () => ({
    default: ({ alt, height, src, width }: ImageProps) => (
        <img
            alt={alt}
            height={typeof height === "number" ? height : undefined}
            src={
                typeof src === "string"
                    ? src
                    : "default" in src
                      ? src.default.src
                      : src.src
            }
            width={typeof width === "number" ? width : undefined}
        />
    ),
}));

class TestResizeObserver implements ResizeObserver {
    disconnect(): void {}

    observe(): void {}

    unobserve(): void {}
}

const createMediaQueryList = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
});

Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(createMediaQueryList),
});

Object.defineProperty(window, "ResizeObserver", {
    configurable: true,
    value: TestResizeObserver,
});

Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
        readText: vi.fn(async () => ""),
        writeText: vi.fn(async () => undefined),
    },
});

Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
});

afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.clearAllMocks();
});
