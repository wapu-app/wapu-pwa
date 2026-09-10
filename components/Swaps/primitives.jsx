"use client";
import { useState } from "react";
import { Button, Input, Paragraph, XStack, YStack } from "tamagui";

import { GEIST, GEIST_MONO } from "../../utils/fonts";

// Brand-styled building blocks shared by the three swap phases, plus the asset
// table and the base-unit math the whole flow depends on. The visual language
// mirrors components/ExchangeRateCalculatorModal (Ink background, mono data,
// pink focus ring, pink→purple gradient CTA).

// ---------------------------------------------------------------- assets ---

// The wire speaks integer base units and opaque asset codes; the UI speaks
// human amounts and network names. This table is the only place that maps
// between the two.
export const ASSETS = {
    BTC: { code: "BTC", symbol: "BTC", network: "Bitcoin", decimals: 8, family: "bitcoin" },
    LBTC: { code: "LBTC", symbol: "L-BTC", network: "Liquid", decimals: 8, family: "liquid" },
    USDT_LIQUID: {
        code: "USDT_LIQUID",
        symbol: "USDT",
        network: "Liquid",
        decimals: 8,
        family: "liquid",
    },
    USDT_ETHEREUM: {
        code: "USDT_ETHEREUM",
        symbol: "USDT",
        network: "Ethereum",
        decimals: 6,
        family: "evm",
    },
    USDT_POLYGON: {
        code: "USDT_POLYGON",
        symbol: "USDT",
        network: "Polygon",
        decimals: 6,
        family: "evm",
    },
};

export const ASSET_CODES = Object.keys(ASSETS);

export const ASSET_OPTIONS = ASSET_CODES.map((code) => ({
    value: code,
    label: `${ASSETS[code].symbol} · ${ASSETS[code].network}`,
}));

export const assetOf = (code) => ASSETS[code] || null;

// Client-side mirrors of the backend address checks. They are deliberately
// loose (a full bech32/base58 checksum belongs on the server); the point is to
// catch a pasted address from the wrong network before spending a round trip.
const ADDRESS_PATTERNS = {
    evm: /^0x[0-9a-fA-F]{40}$/,
    bitcoin: /^(bc1|tb1|bcrt1)[a-z0-9]{20,80}$/,
    liquid: /^(lq1|el1|ert1|VJL|VT|AZ)/,
};

export function isValidAddressFor(assetCode, address) {
    const asset = assetOf(assetCode);
    const pattern = asset && ADDRESS_PATTERNS[asset.family];
    if (!pattern) {
        return false;
    }
    return pattern.test(String(address || "").trim());
}

// ------------------------------------------------------------ base units ---

// "0.015" @ 8 decimals -> 1500000. Returns null when the text is not a plain
// decimal number; extra fractional digits are floored (never rounded up, so we
// can't ask the user for more than they typed).
export function toBaseUnits(value, decimals) {
    const text = String(value === null || value === undefined ? "" : value).trim();
    if (!text || !/^\d*(\.\d*)?$/.test(text) || text === ".") {
        return null;
    }
    const [whole, fraction = ""] = text.split(".");
    const padded = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
    const digits = `${whole || "0"}${padded}`;
    const amount = Number(digits);
    return Number.isFinite(amount) ? Math.floor(amount) : null;
}

// 1500000 @ 8 decimals -> "0.015". Trailing zeros are dropped so amounts read
// the way a person would write them.
export function fromBaseUnits(amount, decimals) {
    const numeric = Number(amount);
    if (amount === null || amount === undefined || !Number.isFinite(numeric)) {
        return null;
    }
    const sign = numeric < 0 ? "-" : "";
    const digits = String(Math.trunc(Math.abs(numeric))).padStart(decimals + 1, "0");
    const whole = digits.slice(0, digits.length - decimals);
    const fraction = decimals ? digits.slice(digits.length - decimals).replace(/0+$/, "") : "";
    return `${sign}${whole}${fraction ? `.${fraction}` : ""}`;
}

// Human amount + ticker, e.g. "0.98010000 sats" -> "0.9801 BTC".
export function formatAssetAmount(amount, assetCode) {
    const asset = assetOf(assetCode);
    if (!asset) {
        return "—";
    }
    const human = fromBaseUnits(amount, asset.decimals);
    return human === null ? "—" : `${human} ${asset.symbol}`;
}

// 100 bps -> "1%". Kept out of the components so the quote card and the
// summary can't drift apart.
export function formatBps(bps) {
    const numeric = Number(bps);
    if (bps === null || bps === undefined || !Number.isFinite(numeric)) {
        return "—";
    }
    const percent = numeric / 100;
    const text = Number.isInteger(percent) ? String(percent) : percent.toFixed(2);
    return `${text}%`;
}

// Middle-truncates an address/txid so it fits a 375px viewport without wrapping
// into an unreadable block.
export function shortenHash(value, head = 10, tail = 8) {
    const text = String(value || "");
    if (text.length <= head + tail + 1) {
        return text;
    }
    return `${text.slice(0, head)}…${text.slice(-tail)}`;
}

// ---------------------------------------------------------------- styles ---

export const mono = (fontSize, extra) => ({ fontFamily: GEIST_MONO, fontSize, ...extra });
export const sans = (fontSize, extra) => ({ fontFamily: GEIST, fontSize, ...extra });

// --------------------------------------------------------------- pieces ----

// Mono uppercase overline (brand manual: "Overline — Geist Mono · 600 · 0.14em").
export function Overline({ children, color = "$neutral11", size = 11 }) {
    return (
        <Paragraph
            color={color}
            style={{
                fontFamily: GEIST_MONO,
                fontWeight: 600,
                fontSize: size,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
            }}
        >
            {children}
        </Paragraph>
    );
}

// Large mono number field; the border turns pink on focus and the ticker is
// pinned to the right edge.
export function AmountField({
    value,
    onChange,
    placeholder = "0",
    unit,
    autoFocus,
    ariaLabel,
    readOnly,
}) {
    const [focus, setFocus] = useState(false);
    return (
        <XStack
            alignItems="center"
            gap={"$2"}
            height={58}
            paddingHorizontal={"$3.5"}
            backgroundColor={"$brandSurfaceDeep"}
            borderWidth={"$1"}
            borderColor={focus ? "$pink500" : "$neutral8"}
            borderRadius={"$5"}
        >
            <Input
                flex={1}
                value={value}
                onChange={(event) => onChange && onChange(event.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                aria-label={ariaLabel}
                readOnly={readOnly}
                inputMode={"decimal"}
                backgroundColor={"transparent"}
                color={readOnly ? "$neutral11" : "$brandOffWhite"}
                placeholderTextColor={"$neutral9"}
                borderWidth={0}
                outlineWidth={0}
                paddingHorizontal={0}
                focusVisibleStyle={{ outlineWidth: 0 }}
                style={mono(24, { fontWeight: 500 })}
            />
            {unit ? (
                <Paragraph color={"$neutral10"} style={mono(14)}>
                    {unit}
                </Paragraph>
            ) : null}
        </XStack>
    );
}

// Single-line text field for addresses: mono, small, same focus treatment.
export function TextField({ value, onChange, placeholder, ariaLabel, invalid }) {
    const [focus, setFocus] = useState(false);
    const borderColor = invalid ? "$semanticRed" : focus ? "$pink500" : "$neutral8";
    return (
        <XStack
            alignItems="center"
            height={50}
            paddingHorizontal={"$3.5"}
            backgroundColor={"$brandSurfaceDeep"}
            borderWidth={"$1"}
            borderColor={borderColor}
            borderRadius={"$5"}
        >
            <Input
                flex={1}
                value={value}
                onChange={(event) => onChange && onChange(event.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                placeholder={placeholder}
                aria-label={ariaLabel}
                autoCapitalize={"none"}
                autoCorrect={"off"}
                spellCheck={false}
                backgroundColor={"transparent"}
                color={"$brandOffWhite"}
                placeholderTextColor={"$neutral9"}
                borderWidth={0}
                outlineWidth={0}
                paddingHorizontal={0}
                focusVisibleStyle={{ outlineWidth: 0 }}
                style={mono(13)}
            />
        </XStack>
    );
}

// One line of a breakdown card: muted label left, mono value right.
export function BreakdownRow({ label, value, valueColor = "$brandOffWhite" }) {
    return (
        <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
            <Paragraph color={"$neutral11"} style={sans(13)}>
                {label}
            </Paragraph>
            <Paragraph color={valueColor} style={mono(13)} textAlign="right">
                {value}
            </Paragraph>
        </XStack>
    );
}

// The card surface every phase renders inside.
export function Card({ children, gap = "$4" }) {
    return (
        <YStack
            width={"100%"}
            padding={"$4"}
            gap={gap}
            borderRadius={"$6"}
            borderWidth={"$1"}
            borderColor={"$neutral7"}
            backgroundColor={"$brandSurface"}
        >
            {children}
        </YStack>
    );
}

// Primary CTA: pink→purple gradient, white 800 label (brand manual).
export function PrimaryButton({ children, onPress, disabled, ariaLabel }) {
    return (
        <Button
            onPress={onPress}
            disabled={disabled}
            aria-label={ariaLabel}
            height={52}
            width={"100%"}
            borderWidth={0}
            borderRadius={"$5"}
            opacity={disabled ? 0.45 : 1}
            pressStyle={{ opacity: disabled ? 0.45 : 0.85 }}
            style={{
                background: "linear-gradient(120deg, #E7357C 0%, #7309B6 100%)",
                fontFamily: GEIST,
                fontWeight: 800,
                fontSize: 16,
                color: "#FFFFFF",
                cursor: disabled ? "not-allowed" : "pointer",
            }}
        >
            {children}
        </Button>
    );
}

// Secondary/ghost action (back, start over).
export function GhostButton({ children, onPress, ariaLabel }) {
    return (
        <Button
            onPress={onPress}
            aria-label={ariaLabel}
            height={52}
            width={"100%"}
            backgroundColor={"transparent"}
            borderWidth={"$1"}
            borderColor={"$neutral8"}
            borderRadius={"$5"}
            color={"$brandOffWhite"}
            hoverStyle={{ borderColor: "$pink500" }}
            pressStyle={{ borderColor: "$pink500", opacity: 0.85 }}
            style={sans(15, { fontWeight: 600 })}
        >
            {children}
        </Button>
    );
}

// Amber notice used for the "no liquidity" case and other soft warnings.
export function WarningBanner({ children }) {
    return (
        <XStack
            role="alert"
            gap={"$2.5"}
            padding={"$3"}
            borderRadius={"$4"}
            borderWidth={"$1"}
            borderColor={"$semanticYellow"}
            backgroundColor={"rgba(245, 217, 10, 0.10)"}
        >
            <Paragraph color={"$semanticYellow"} style={mono(13)}>
                !
            </Paragraph>
            <Paragraph flex={1} color={"$semanticYellow"} style={sans(13)}>
                {children}
            </Paragraph>
        </XStack>
    );
}

// Hard error (failed request, invalid field).
export function ErrorText({ children }) {
    return (
        <Paragraph role="alert" color={"$semanticRed"} style={sans(12)}>
            {children}
        </Paragraph>
    );
}

// Low-opacity radial glows behind the content ("glow reactivo" in the manual).
export function BrandGlow() {
    return (
        <>
            <YStack
                position="absolute"
                top={-140}
                right={-120}
                width={360}
                height={360}
                style={{
                    background:
                        "radial-gradient(circle, rgba(231,53,124,0.22) 0%, rgba(115,9,182,0.12) 42%, rgba(10,7,18,0) 70%)",
                    pointerEvents: "none",
                }}
            />
            <YStack
                position="absolute"
                bottom={-160}
                left={-130}
                width={340}
                height={340}
                style={{
                    background:
                        "radial-gradient(circle, rgba(124,255,216,0.08) 0%, rgba(10,7,18,0) 68%)",
                    pointerEvents: "none",
                }}
            />
        </>
    );
}
