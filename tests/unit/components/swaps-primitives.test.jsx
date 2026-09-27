import { describe, expect, it } from "vitest";

import {
    ASSET_OPTIONS,
    convertUnitText,
    displayDecimals,
    displaySymbol,
    effectiveRate,
    explorerTxUrl,
    formatAssetAmount,
    formatBps,
    formatRate,
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

    it("caps the displayed rate at satoshi precision for bitcoin", () => {
        // What the backend actually sends for USDT -> BTC.
        expect(
            formatRate("0.00001202832429805706477613484233", "BTC")
        ).toBe("0.00001202");
        expect(formatRate("0.00001202832429805706477613484233", "LBTC")).toBe(
            "0.00001202"
        );
        expect(formatRate("1", "BTC")).toBe("1");
    });

    it("caps the displayed rate at cents for USDT", () => {
        expect(formatRate("77545.66", "USDT_ETHEREUM")).toBe("77545.66");
        expect(formatRate("26767.6142857", "USDT_LIQUID")).toBe("26767.61");
        expect(formatRate("26767.60000", "USDT_POLYGON")).toBe("26767.6");
        expect(formatRate("26767", "USDT_POLYGON")).toBe("26767");
    });

    it("derives the rate the user actually gets, fee and spread included", () => {
        // 1 L-BTC in, 0.9801 BTC out: the base rate is 1, the effective one is not.
        expect(
            formatRate(effectiveRate(100000000, 98010000, "LBTC", "BTC"), "BTC")
        ).toBe("0.9801");
        // Cross-decimals: 0.00131575 BTC -> 100.000291 USDT (8 dec -> 6 dec).
        expect(
            formatRate(
                effectiveRate(131575, 100000291, "BTC", "USDT_ETHEREUM"),
                "USDT_ETHEREUM"
            )
        ).toBe("76002.5");
        // ...and the other way around, down at satoshi precision.
        expect(
            formatRate(
                effectiveRate(100000000, 1202832, "USDT_ETHEREUM", "BTC"),
                "BTC"
            )
        ).toBe("0.00012028");
    });

    it("has no effective rate without a usable pair of amounts", () => {
        expect(effectiveRate(0, 98010000, "LBTC", "BTC")).toBeNull();
        expect(effectiveRate(null, 98010000, "LBTC", "BTC")).toBeNull();
        expect(effectiveRate(100000000, 98010000, "LBTC", "NOPE")).toBeNull();
    });

    it("returns null for a rate it cannot render", () => {
        expect(formatRate(null, "BTC")).toBeNull();
        expect(formatRate(undefined, "BTC")).toBeNull();
        expect(formatRate("abc", "BTC")).toBeNull();
        expect(formatRate("1", "NOPE")).toBeNull();
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

describe("swaps primitives — explorer links", () => {
    const BITCOIN_TXID =
        "64f8f01c4f523b4464042ee58bed2d777d33425314072c325f656638afc574b8";
    const LIQUID_TXID =
        "3a7c9c29e37144220dcb7fc522846c7243c8a89f8dbc59d5f7b0e4ff7e299566";
    const ETHEREUM_TXID =
        "0xdb04c1ebc7f7698c4271fcb0ac5ca9321b5c6abfdc5cd1e7f4c5b09bba8470bd";
    const POLYGON_TXID =
        "0x7aebdf8d76eb08e8929cfa4899daf9742ec2b5a9d76e69316cbdcb7f04038f2a";

    it("sends every leg to its own chain's explorer", () => {
        expect(explorerTxUrl("BTC", BITCOIN_TXID)).toBe(
            `https://blockstream.info/tx/${BITCOIN_TXID}`
        );
        expect(explorerTxUrl("LBTC", LIQUID_TXID)).toBe(
            `https://blockstream.info/liquid/tx/${LIQUID_TXID}`
        );
        expect(explorerTxUrl("USDT_LIQUID", LIQUID_TXID)).toBe(
            `https://blockstream.info/liquid/tx/${LIQUID_TXID}`
        );
        expect(explorerTxUrl("USDT_ETHEREUM", ETHEREUM_TXID)).toBe(
            `https://etherscan.io/tx/${ETHEREUM_TXID}`
        );
        expect(explorerTxUrl("USDT_POLYGON", POLYGON_TXID)).toBe(
            `https://polygonscan.com/tx/${POLYGON_TXID}`
        );
    });

    it("keeps the two USDT legs apart even though they share a family", () => {
        expect(explorerTxUrl("USDT_ETHEREUM", ETHEREUM_TXID)).not.toContain(
            "polygonscan"
        );
        expect(explorerTxUrl("USDT_POLYGON", POLYGON_TXID)).not.toContain(
            "etherscan"
        );
    });

    it("returns null when there is nothing to link to", () => {
        expect(explorerTxUrl("BTC", null)).toBeNull();
        expect(explorerTxUrl("BTC", "")).toBeNull();
        expect(explorerTxUrl("BTC", "   ")).toBeNull();
        expect(explorerTxUrl("UNKNOWN", BITCOIN_TXID)).toBeNull();
    });

    it("escapes the hash instead of pasting it into the URL raw", () => {
        expect(explorerTxUrl("BTC", "abc/../evil?x=1")).toBe(
            "https://blockstream.info/tx/abc%2F..%2Fevil%3Fx%3D1"
        );
    });
});
