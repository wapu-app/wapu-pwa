"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button, Paragraph, XStack, YStack } from "tamagui";

import AddressForm from "../../components/Swaps/AddressForm";
import QuoteCard from "../../components/Swaps/QuoteCard";
import SwapStatus, { TERMINAL_STATUSES } from "../../components/Swaps/SwapStatus";
import { SUPPORTED_LANGS, useSwapsLang } from "../../components/Swaps/i18n";
import {
    BrandGlow,
    DEFAULT_BTC_UNIT,
    Overline,
    convertUnitText,
    displayDecimals,
    fromBaseUnits,
    sans,
    toBaseUnits,
} from "../../components/Swaps/primitives";
import { createSwap, getSwap, getSwapQuote } from "../../api/api";

const QUOTE_DEBOUNCE_MS = 500;
const POLL_INTERVAL_MS = 10000;
const DEFAULT_FROM = "LBTC";
const DEFAULT_TO = "BTC";

// Only digits and a single dot: the amount is parsed into integer base units,
// so anything else is rejected at the keystroke instead of at the request.
const AMOUNT_PATTERN = /^\d*(\.\d*)?$/;

const LANG_LABELS = { es: "ES", en: "EN" };

// The BTC/SAT preference is one setting for the whole card (clicking either
// ticker flips both fields) and outlives the visit, like the language.
const BTC_UNIT_STORAGE_KEY = "wapu.swaps.btcUnit";

function readStoredBtcUnit() {
    try {
        const stored = window.localStorage.getItem(BTC_UNIT_STORAGE_KEY);
        return stored === "SAT" || stored === "BTC" ? stored : DEFAULT_BTC_UNIT;
    } catch {
        // Private mode / blocked storage: the default is perfectly usable.
        return DEFAULT_BTC_UNIT;
    }
}

// Small pill at the very top of the page. The swaps flow is the first public
// surface a non-Spanish visitor can land on, so the language switch has to be
// reachable before anything else on the page.
function LanguageSelector({ t, lang, setLang }) {
    return (
        <XStack alignItems="center" gap={"$2.5"}>
            <Overline>{t.langLabel}</Overline>
            <XStack
                padding={"$1"}
                gap={"$1"}
                borderRadius={"$8"}
                borderWidth={"$1"}
                borderColor={"$neutral8"}
                backgroundColor={"$brandSurfaceDeep"}
            >
                {SUPPORTED_LANGS.map((code) => {
                    const active = code === lang;
                    return (
                        <Button
                            key={code}
                            onPress={() => setLang(code)}
                            aria-label={LANG_LABELS[code]}
                            aria-pressed={active}
                            height={26}
                            paddingHorizontal={"$2.5"}
                            borderWidth={0}
                            borderRadius={"$8"}
                            backgroundColor={active ? "$pink500" : "transparent"}
                            color={active ? "$brandOffWhite" : "$neutral11"}
                            style={{
                                fontFamily: "inherit",
                                fontSize: 12,
                                fontWeight: active ? 700 : 500,
                                letterSpacing: "0.08em",
                            }}
                        >
                            {LANG_LABELS[code]}
                        </Button>
                    );
                })}
            </XStack>
        </XStack>
    );
}

export default function SwapsPage() {
    const router = useRouter();
    const { lang, setLang, t } = useSwapsLang();

    const [phase, setPhase] = useState(1);
    const [from, setFrom] = useState(DEFAULT_FROM);
    const [to, setTo] = useState(DEFAULT_TO);
    // Both amount fields are editable. `side` records which one the user is
    // driving: "in" quotes forward, "out" asks the backend to solve for the
    // input. The other field is filled in from the answer.
    const [amount, setAmount] = useState("");
    const [amountOut, setAmountOut] = useState("");
    const [side, setSide] = useState("in");
    const [btcUnit, setBtcUnit] = useState(DEFAULT_BTC_UNIT);

    // Read after mount: localStorage does not exist during SSR.
    useEffect(() => {
        setBtcUnit(readStoredBtcUnit());
    }, []);

    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    // Errors are kept as an i18n key OR a raw backend message, never as
    // already-translated text: switching the language has to retranslate what
    // is on screen without refetching.
    const [quoteError, setQuoteError] = useState(null);

    const [payoutAddress, setPayoutAddress] = useState("");
    const [refundAddress, setRefundAddress] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    const [swapId, setSwapId] = useState(null);
    const [swap, setSwap] = useState(null);
    const [swapLoading, setSwapLoading] = useState(false);
    const [swapError, setSwapError] = useState(null);

    // The status phase must survive a refresh or a shared link, so the swap id
    // lives in the URL and is read back once the router has hydrated its query.
    useEffect(() => {
        if (!router.isReady) {
            return;
        }
        const queryId = router.query && router.query.id;
        const id = Array.isArray(queryId) ? queryId[0] : queryId;
        if (id) {
            setSwapId(id);
            setPhase(3);
        }
    }, [router.isReady, router.query]);

    // Whichever field the user typed in is the one we send; the other one is an
    // output of the quote. Only the pinned text is a dependency of the fetch —
    // mirroring the answer into the other field must not trigger a second
    // round trip.
    const pinnedCode = side === "in" ? from : to;
    const pinnedText = side === "in" ? amount : amountOut;

    const clearMirroredAmount = useCallback(() => {
        if (side === "in") {
            setAmountOut("");
        } else {
            setAmount("");
        }
    }, [side]);

    // Debounced quote. Runs only in phase 1: once the user moves on, the quote
    // shown in the summary is the one they accepted.
    useEffect(() => {
        if (phase !== 1) {
            return undefined;
        }
        if (from === to) {
            setQuote(null);
            setQuoteError({ key: "samePair" });
            setQuoteLoading(false);
            return undefined;
        }
        const pinnedAmount = toBaseUnits(pinnedText, displayDecimals(pinnedCode, btcUnit));
        if (!pinnedAmount || pinnedAmount <= 0) {
            setQuote(null);
            setQuoteError(null);
            setQuoteLoading(false);
            clearMirroredAmount();
            return undefined;
        }

        let cancelled = false;
        setQuoteLoading(true);
        const timer = setTimeout(async () => {
            try {
                const { data, status } = await getSwapQuote(from, to, pinnedAmount, side);
                if (cancelled) {
                    return;
                }
                if (status === 200 && data && !data.error) {
                    setQuote(data);
                    setQuoteError(null);
                    // Mirror the resolved counterpart into the other field.
                    if (side === "in") {
                        setAmountOut(
                            fromBaseUnits(data.amount_out, displayDecimals(to, btcUnit)) || ""
                        );
                    } else {
                        setAmount(
                            fromBaseUnits(data.amount_in, displayDecimals(from, btcUnit)) || ""
                        );
                    }
                } else {
                    setQuote(null);
                    // A stale mirrored figure next to a failed quote reads as a
                    // live price, so it goes with the quote.
                    clearMirroredAmount();
                    setQuoteError(
                        data && data.error
                            ? { message: data.error }
                            : { key: "quoteFailed" }
                    );
                }
            } catch {
                if (!cancelled) {
                    setQuote(null);
                    clearMirroredAmount();
                    setQuoteError({ key: "network" });
                }
            } finally {
                if (!cancelled) {
                    setQuoteLoading(false);
                }
            }
        }, QUOTE_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [phase, from, to, side, pinnedText, pinnedCode, btcUnit, clearMirroredAmount]);

    const isTerminal = Boolean(swap) && TERMINAL_STATUSES.includes(swap.status);

    // Poll the swap while it is alive. `isTerminal` is a dependency (not a read
    // inside the callback) so reaching a final status tears the interval down
    // through the effect cleanup instead of leaving it running.
    const swapRef = useRef(null);
    swapRef.current = swap;
    useEffect(() => {
        if (!swapId || isTerminal) {
            return undefined;
        }
        let cancelled = false;

        const fetchSwap = async () => {
            if (!swapRef.current) {
                setSwapLoading(true);
            }
            try {
                const { data, status } = await getSwap(swapId);
                if (cancelled) {
                    return;
                }
                if (status === 200 && data && data.swap_id) {
                    setSwap(data);
                    setSwapError(null);
                } else if (status === 404) {
                    setSwapError({ key: "notFound" });
                } else {
                    setSwapError(
                        data && data.error
                            ? { message: data.error }
                            : { key: "network" }
                    );
                }
            } catch {
                if (!cancelled) {
                    setSwapError({ key: "network" });
                }
            } finally {
                if (!cancelled) {
                    setSwapLoading(false);
                }
            }
        };

        fetchSwap();
        const interval = setInterval(fetchSwap, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [swapId, isTerminal]);

    const translateError = useCallback(
        (error) => {
            if (!error) {
                return null;
            }
            if (error.key) {
                return t.errors[error.key] || t.errors.network;
            }
            return error.message;
        },
        [t]
    );

    // Typing in a field pins that side of the quote.
    const handleAmountChange = (value) => {
        if (AMOUNT_PATTERN.test(value)) {
            setSide("in");
            setAmount(value);
        }
    };

    const handleAmountOutChange = (value) => {
        if (AMOUNT_PATTERN.test(value)) {
            setSide("out");
            setAmountOut(value);
        }
    };

    // BTC <-> SAT. Both fields are rewritten so the numbers on screen keep
    // their value instead of silently changing by 10^8.
    const handleToggleBtcUnit = () => {
        const next = btcUnit === "BTC" ? "SAT" : "BTC";
        setAmount((current) => convertUnitText(current, from, btcUnit, next));
        setAmountOut((current) => convertUnitText(current, to, btcUnit, next));
        setBtcUnit(next);
        try {
            window.localStorage.setItem(BTC_UNIT_STORAGE_KEY, next);
        } catch {
            // Non-fatal: the choice just won't survive the visit.
        }
    };

    // Picking the asset that already sits on the other leg swaps the pair
    // instead of leaving the form in an impossible state.
    const handleFromChange = (next) => {
        if (next === to) {
            setTo(from);
        }
        setFrom(next);
    };

    const handleToChange = (next) => {
        if (next === from) {
            setFrom(to);
        }
        setTo(next);
    };

    // Reversing the pair carries the amounts along with their assets, so the
    // figure the user pinned stays pinned to the same coin.
    const handleSwitch = () => {
        setFrom(to);
        setTo(from);
        setAmount(amountOut);
        setAmountOut(amount);
        setSide(side === "in" ? "out" : "in");
    };

    const handleContinue = () => {
        if (quote && quote.liquidity_ok) {
            setCreateError(null);
            setPhase(2);
        }
    };

    const handleCreate = async () => {
        if (!quote) {
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            const { data, status } = await createSwap({
                from,
                to,
                amount_in: quote.amount_in,
                payout_address: payoutAddress.trim(),
                refund_address: refundAddress.trim(),
            });
            if (status === 201 && data && data.swap_id) {
                setSwap(data);
                setSwapId(data.swap_id);
                setPhase(3);
                router.push(`/swaps?id=${data.swap_id}`, undefined, {
                    shallow: true,
                });
                return;
            }
            if (status === 429) {
                setCreateError({ key: "rateLimited" });
            } else if (data && data.error) {
                setCreateError({ message: data.error });
            } else {
                setCreateError({ key: "createFailed" });
            }
        } catch {
            setCreateError({ key: "network" });
        } finally {
            setCreating(false);
        }
    };

    const handleNewSwap = () => {
        setPhase(1);
        setSwapId(null);
        setSwap(null);
        setSwapError(null);
        setCreateError(null);
        setPayoutAddress("");
        setRefundAddress("");
        setAmount("");
        setAmountOut("");
        setSide("in");
        setQuote(null);
        setQuoteError(null);
        router.push("/swaps");
    };

    return (
        <>
            <Head>
                <title>Wapu · Swaps</title>
            </Head>
            <YStack
                flex={1}
                width={"100%"}
                position="relative"
                overflow="hidden"
                backgroundColor={"$brandInk"}
            >
                <BrandGlow />
                <YStack
                    width={"100%"}
                    maxWidth={520}
                    alignSelf="center"
                    paddingHorizontal={"$4"}
                    paddingTop={"$5"}
                    paddingBottom={"$8"}
                    gap={"$4"}
                >
                    <LanguageSelector t={t} lang={lang} setLang={setLang} />

                    <YStack gap={"$2.5"}>
                        <XStack
                            alignSelf="flex-start"
                            alignItems="center"
                            gap={"$2"}
                            paddingVertical={"$1.5"}
                            paddingHorizontal={"$2.5"}
                            borderRadius={"$8"}
                            borderWidth={"$1"}
                            borderColor={"$neutral8"}
                            backgroundColor={"$brandSurfaceDeep"}
                        >
                            <YStack
                                width={7}
                                height={7}
                                borderRadius={"$10"}
                                backgroundColor={"$brandMint"}
                            />
                            <Overline>{t.badge}</Overline>
                        </XStack>
                        <Paragraph
                            color={"$brandOffWhite"}
                            style={sans(26, { fontWeight: 800, lineHeight: "30px" })}
                        >
                            {t.title}
                        </Paragraph>
                        <Paragraph
                            color={"$neutral11"}
                            style={sans(13, { lineHeight: "18px" })}
                        >
                            {t.subtitle}
                        </Paragraph>
                    </YStack>

                    {phase === 1 ? (
                        <QuoteCard
                            t={t}
                            from={from}
                            to={to}
                            amount={amount}
                            amountOut={amountOut}
                            btcUnit={btcUnit}
                            quote={quote}
                            loading={quoteLoading}
                            errorText={translateError(quoteError)}
                            onFromChange={handleFromChange}
                            onToChange={handleToChange}
                            onAmountChange={handleAmountChange}
                            onAmountOutChange={handleAmountOutChange}
                            onToggleBtcUnit={handleToggleBtcUnit}
                            onSwitch={handleSwitch}
                            onContinue={handleContinue}
                        />
                    ) : null}

                    {phase === 2 ? (
                        <AddressForm
                            t={t}
                            from={from}
                            to={to}
                            btcUnit={btcUnit}
                            quote={quote}
                            payoutAddress={payoutAddress}
                            refundAddress={refundAddress}
                            onPayoutChange={setPayoutAddress}
                            onRefundChange={setRefundAddress}
                            onBack={() => setPhase(1)}
                            onSubmit={handleCreate}
                            submitting={creating}
                            submitError={translateError(createError)}
                        />
                    ) : null}

                    {phase === 3 ? (
                        <SwapStatus
                            t={t}
                            btcUnit={btcUnit}
                            swap={swap}
                            loading={swapLoading}
                            errorText={translateError(swapError)}
                            onNewSwap={handleNewSwap}
                        />
                    ) : null}
                </YStack>
            </YStack>
        </>
    );
}
