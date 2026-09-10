import { describe, expect, it } from "vitest";

import {
    ASSET_OPTIONS,
    convertUnitText,
    displayDecimals,
    displaySymbol,
    formatAssetAmount,
    formatBps,
    fromBaseUnits,
    hasUnitToggle,
    isValidAddressFor,
    shortenHash,
    toBaseUnits,
} from "../../../components/Swaps/primitives";

describe("swaps primitives — base unit math", () => {
    it("parses human amounts into integer base units", () => {
        expect(toBaseUnits("1", 8)).toBe(100000000);
        expect(toBaseUnits("0.015", 8)).toBe(1500000);
        expect(toBaseUnits("12.5", 6)).toBe(12500000);
        expect(toBaseUnits("", 8)).toBeNull();
        expect(toBaseUnits("abc", 8)).toBeNull();
        expect(toBaseUnits(".", 8)).toBeNull();
    });

    it("floors extra fractional digits instead of rounding up", () => {
        expect(toBaseUnits("1.9999999999", 6)).toBe(1999999);
    });

    it("renders base units back as human amounts without trailing zeros", () => {
        expect(fromBaseUnits(100000000, 8)).toBe("1");
        expect(fromBaseUnits(98010000, 8)).toBe("0.9801");
        expect(fromBaseUnits(10000, 8)).toBe("0.0001");
        expect(fromBaseUnits(1500000, 6)).toBe("1.5");
        expect(fromBaseUnits(null, 8)).toBeNull();
    });

    it("labels amounts with the asset ticker", () => {
        expect(formatAssetAmount(98010000, "BTC")).toBe("0.9801 BTC");
        expect(formatAssetAmount(2500000, "USDT_POLYGON")).toBe("2.5 USDT");
        expect(formatAssetAmount(1, "NOPE")).toBe("—");
    });

    it("names the Liquid leg BTC too, and can spell out the chain", () => {
        expect(formatAssetAmount(98010000, "LBTC")).toBe("0.9801 BTC");
        expect(formatAssetAmount(98010000, "LBTC", { network: true })).toBe(
            "0.9801 BTC · Liquid"
        );
        expect(formatAssetAmount(98010000, "BTC", { network: true })).toBe(
            "0.9801 BTC · Bitcoin"
        );
    });

    it("turns basis points into percentages", () => {
        expect(formatBps(100)).toBe("1%");
        expect(formatBps(0)).toBe("0%");
        expect(formatBps(25)).toBe("0.25%");
        expect(formatBps(null)).toBe("—");
    });

    it("middle-truncates long hashes", () => {
        expect(shortenHash("short")).toBe("short");
        expect(shortenHash("a".repeat(40))).toContain("…");
    });
});

describe("swaps primitives — BTC/SAT denomination", () => {
    it("offers the toggle on both bitcoin legs and on nothing else", () => {
        expect(hasUnitToggle("BTC")).toBe(true);
        expect(hasUnitToggle("LBTC")).toBe(true);
        expect(hasUnitToggle("USDT_LIQUID")).toBe(false);
        expect(hasUnitToggle("USDT_ETHEREUM")).toBe(false);
        expect(hasUnitToggle("NOPE")).toBe(false);
    });

    it("drops to zero decimals in sats and keeps the asset's otherwise", () => {
        expect(displayDecimals("BTC", "SAT")).toBe(0);
        expect(displayDecimals("LBTC", "SAT")).toBe(0);
        expect(displayDecimals("BTC", "BTC")).toBe(8);
        // The unit setting is global, but it must not touch the USDT legs.
        expect(displayDecimals("USDT_ETHEREUM", "SAT")).toBe(6);
        expect(displayDecimals("USDT_LIQUID", "SAT")).toBe(8);
    });

    it("shows the picked unit as the ticker of the bitcoin legs only", () => {
        expect(displaySymbol("LBTC", "SAT")).toBe("SAT");
        expect(displaySymbol("BTC", "BTC")).toBe("BTC");
        expect(displaySymbol("USDT_POLYGON", "SAT")).toBe("USDT");
    });

    it("formats amounts in sats when that unit is picked", () => {
        expect(formatAssetAmount(98010000, "LBTC", { btcUnit: "SAT" })).toBe(
            "98010000 SAT"
        );
        expect(formatAssetAmount(2500000, "USDT_POLYGON", { btcUnit: "SAT" })).toBe(
            "2.5 USDT"
        );
    });

    it("rewrites a typed amount without changing its value", () => {
        expect(convertUnitText("0.05", "BTC", "BTC", "SAT")).toBe("5000000");
        expect(convertUnitText("5000000", "LBTC", "SAT", "BTC")).toBe("0.05");
        expect(convertUnitText("1", "BTC", "BTC", "SAT")).toBe("100000000");
    });

    it("leaves text alone when there is nothing to convert", () => {
        expect(convertUnitText("", "BTC", "BTC", "SAT")).toBe("");
        expect(convertUnitText("1", "BTC", "BTC", "BTC")).toBe("1");
        // Non-bitcoin legs never switch, and half-typed numbers survive.
        expect(convertUnitText("1.5", "USDT_ETHEREUM", "BTC", "SAT")).toBe("1.5");
        expect(convertUnitText(".", "BTC", "BTC", "SAT")).toBe(".");
    });
});

describe("swaps primitives — address validation", () => {
    it("accepts addresses for the matching network family", () => {
        expect(
            isValidAddressFor(
                "BTC",
                "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
            )
        ).toBe(true);
        expect(isValidAddressFor("LBTC", "lq1qqw508d6qejxtdg4y5r3zarvary0")).toBe(
            true
        );
        expect(
            isValidAddressFor(
                "USDT_ETHEREUM",
                "0x52908400098527886E0F7030069857D2E4169EE7"
            )
        ).toBe(true);
    });

    it("rejects addresses from the wrong network", () => {
        expect(
            isValidAddressFor(
                "BTC",
                "0x52908400098527886E0F7030069857D2E4169EE7"
            )
        ).toBe(false);
        expect(
            isValidAddressFor(
                "USDT_POLYGON",
                "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
            )
        ).toBe(false);
        expect(isValidAddressFor("LBTC", "")).toBe(false);
        expect(isValidAddressFor("UNKNOWN", "whatever")).toBe(false);
    });

    it("exposes one select option per supported leg", () => {
        expect(ASSET_OPTIONS.map((option) => option.value)).toEqual([
            "BTC",
            "LBTC",
            "USDT_LIQUID",
            "USDT_ETHEREUM",
            "USDT_POLYGON",
        ]);
    });
});
