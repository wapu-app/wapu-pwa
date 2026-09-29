"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button, Paragraph, XStack, YStack } from "tamagui";

import TamaguiIconButton from "../../components/TamaguiIconButton";
import AddressForm from "../../components/Swaps/AddressForm";
import FiatDetailsForm from "../../components/Swaps/FiatDetailsForm";
import FiatPayoutStatus, {
    TENTATIVE_TERMINAL_STATUSES,
} from "../../components/Swaps/FiatPayoutStatus";
import PurchaseStatus from "../../components/Swaps/PurchaseStatus";
import QuoteCard from "../../components/Swaps/QuoteCard";
import SwapStatus, { TERMINAL_STATUSES } from "../../components/Swaps/SwapStatus";
import { SUPPORTED_LANGS, useSwapsLang } from "../../components/Swaps/i18n";
import {
    BrandGlow,
    DEFAULT_BTC_UNIT,
    Overline,
    arsCentsToPlain,
    convertUnitText,
    directFiatDepositBaseUnits,
    displayDecimals,
    flowOf,
    fromBaseUnits,
    fundingRailOf,
    isSupportedPair,
    normalizePair,
    receiveOptions,
    resolveLoggedIn,
    sans,
    sendOptions,
    toBaseUnits,
} from "../../components/Swaps/primitives";
import {
    createArsSwap,
    createDirectFiatTentative,
    createSwap,
    getDirectFiatQuote,
    getDirectFiatTentative,
    getSwap,
    getSwapQuote,
    requestDirectFiatFunding,
} from "../../api/api";
import closeIcon from "../../public/closeIcon.svg";

const QUOTE_DEBOUNCE_MS = 500;
const POLL_INTERVAL_MS = 10000;
const DEFAULT_FROM = "LBTC";
const DEFAULT_TO = "BTC";

// Only digits and a single dot: the amount is parsed into integer base units,
// so anything else is rejected at the keystroke instead of at the request.
const AMOUNT_PATTERN = /^\d*(\.\d*)?$/;

const LANG_LABELS = { es: "ES", en: "EN" };

// Crypto -> ARS always pays out as a fast transfer; the user does not pick.
const DIRECT_FIAT_TYPE = "fast_fiat_transfer";

// An EXPIRED ARS purchase can still execute until `late_watch_until`; without it,
// fall back to the plan's `ars_swap_late_watch_minutes` (60) after `expires_at`.
// See docs/swaps-page.md.
const ARS_LATE_WATCH_MS = 60 * 60 * 1000;

function lateWatchEnd(swap) {
    if (swap.late_watch_until) {
        return new Date(swap.late_watch_until).getTime();
    }
    return new Date(swap.expires_at).getTime() + ARS_LATE_WATCH_MS;
}

function isSwapTerminal(swap) {
    if (!swap || !TERMINAL_STATUSES.includes(swap.status)) {
        return false;
    }
    if (swap.from === "ARS" && swap.status === "EXPIRED" && (swap.late_watch_until || swap.expires_at)) {
        const end = lateWatchEnd(swap);
        return !Number.isFinite(end) || Date.now() > end;
    }
    return true;
}

const firstQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

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
    // Session-only UI (ARS legs, close button); read after mount, no cookies in SSR.
    const [loggedIn, setLoggedIn] = useState(false);

    // Read after mount: localStorage does not exist during SSR.
    useEffect(() => {
        setBtcUnit(readStoredBtcUnit());
        let cancelled = false;
        resolveLoggedIn().then((value) => {
            if (!cancelled) {
                setLoggedIn(value);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const flow = flowOf(from, to);

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
    // A 401/404 will not fix itself: stop polling until the user acts, or an
    // anonymous visitor on ?tentative=<id> fires GET /users/refresh every tick.
    const [swapPollStopped, setSwapPollStopped] = useState(false);

    // Crypto -> ARS: bank account details and the direct-fiat tentative.
    const [alias, setAlias] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [tentativeId, setTentativeId] = useState(null);
    const [tentative, setTentative] = useState(null);
    const [tentativeLoading, setTentativeLoading] = useState(false);
    const [tentativeError, setTentativeError] = useState(null);
    const [retryingFunding, setRetryingFunding] = useState(false);
    const [tentativePollStopped, setTentativePollStopped] = useState(false);

    // The status phase must survive a refresh or a shared link, so the order id
    // lives in the URL and is read back once the router has hydrated its query.
    // Swaps (crypto and ARS purchases) use `?id=`; crypto -> ARS orders are
    // direct-fiat tentatives, a different resource, and use `?tentative=`.
    useEffect(() => {
        if (!router.isReady) {
            return;
        }
        const id = firstQueryValue(router.query && router.query.id);
        const queryTentative = firstQueryValue(router.query && router.query.tentative);
        if (id) {
            setSwapId(id);
            setPhase(3);
        } else if (queryTentative) {
            setTentativeId(queryTentative);
            setPhase(3);
        }
    }, [router.isReady, router.query]);

    // Once the session is known, drop a pair that needs one (ARS legs) or that
    // the lists no longer offer.
    useEffect(() => {
        const next = normalizePair(from, to, loggedIn);
        if (next.from !== from || next.to !== to) {
            setFrom(next.from);
            setTo(next.to);
        }
        // Only on session changes: selector handlers normalize on their own.
    }, [loggedIn]);

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
                const isArsSell = flowOf(from, to) === "arsSell";
                const rail = fundingRailOf(from);
                // Direct-fiat quote: priced from the ARS amount only, in pesos.
                const { data, status } = isArsSell
                    ? await getDirectFiatQuote({
                          amountArs: arsCentsToPlain(pinnedAmount),
                          fundingCurrency: rail.funding_currency,
                          fundingNetwork: rail.network,
                          type: DIRECT_FIAT_TYPE,
                      })
                    : await getSwapQuote(from, to, pinnedAmount, side);
                if (cancelled) {
                    return;
                }
                if (status === 200 && data && !data.error) {
                    setQuote(data);
                    setQuoteError(null);
                    // Mirror the resolved counterpart into the other field.
                    if (isArsSell) {
                        setAmount(
                            fromBaseUnits(
                                directFiatDepositBaseUnits(data, from),
                                displayDecimals(from, btcUnit)
                            ) || ""
                        );
                    } else if (side === "in") {
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
                        status === 401
                            ? { key: "authRequired" }
                            : data && data.error
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

    const isTerminal = isSwapTerminal(swap);

    // Poll the swap while it is alive. `isTerminal` is a dependency (not a read
    // inside the callback) so reaching a final status tears the interval down
    // through the effect cleanup instead of leaving it running.
    const swapRef = useRef(null);
    swapRef.current = swap;
    useEffect(() => {
        if (!swapId || isTerminal || swapPollStopped) {
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
                } else if (status === 404 || status === 401) {
                    setSwapError({ key: status === 404 ? "notFound" : "authRequired" });
                    setSwapPollStopped(true);
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
    }, [swapId, isTerminal, swapPollStopped]);

    // Same polling for a crypto -> ARS order, on its own resource.
    const isTentativeTerminal =
        Boolean(tentative) && TENTATIVE_TERMINAL_STATUSES.includes(tentative.status);
    const tentativeRef = useRef(null);
    tentativeRef.current = tentative;
    useEffect(() => {
        if (!tentativeId || isTentativeTerminal || tentativePollStopped) {
            return undefined;
        }
        let cancelled = false;

        const fetchTentative = async () => {
            if (!tentativeRef.current) {
                setTentativeLoading(true);
            }
            try {
                const { data, status } = await getDirectFiatTentative(tentativeId);
                if (cancelled) {
                    return;
                }
                if (status === 200 && data && data.tentative_id) {
                    setTentative(data);
                    setTentativeError(null);
                } else if (status === 404 || status === 401) {
                    setTentativeError({ key: status === 404 ? "notFound" : "authRequired" });
                    setTentativePollStopped(true);
                } else {
                    setTentativeError(
                        data && data.error ? { message: data.error } : { key: "network" }
                    );
                }
            } catch {
                if (!cancelled) {
                    setTentativeError({ key: "network" });
                }
            } finally {
                if (!cancelled) {
                    setTentativeLoading(false);
                }
            }
        };

        fetchTentative();
        const interval = setInterval(fetchTentative, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [tentativeId, isTentativeTerminal, tentativePollStopped]);

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
    // A comma is read as the decimal mark ("15000,30"), the way an
    // Argentine user types pesos. Thousands separators are still rejected.
    const handleAmountChange = (raw) => {
        const value = raw.replace(",", ".");
        if (AMOUNT_PATTERN.test(value)) {
            setSide("in");
            setAmount(value);
        }
    };

    const handleAmountOutChange = (raw) => {
        const value = raw.replace(",", ".");
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

    // Crypto -> ARS can only be priced from the ARS side: entering it pins "you get".
    const applyPair = (nextFrom, nextTo, nextSide) => {
        const pair = normalizePair(nextFrom, nextTo, loggedIn);
        setFrom(pair.from);
        setTo(pair.to);
        setSide(flowOf(pair.from, pair.to) === "arsSell" ? "out" : nextSide);
    };

    // Picking the asset that already sits on the other leg swaps the pair
    // instead of leaving the form in an impossible state.
    const handleFromChange = (next) => {
        applyPair(next, next === to ? from : to, side);
    };

    const handleToChange = (next) => {
        applyPair(next === from ? to : from, next, side);
    };

    // Reversing the pair carries the amounts along with their assets, so the
    // figure the user pinned stays pinned to the same coin. A reversed pair
    // that is not offered (ARS -> USDT Ethereum) is normalized instead.
    const handleSwitch = () => {
        const reversedSide = side === "in" ? "out" : "in";
        const pair = normalizePair(to, from, loggedIn);
        if (pair.from === to && pair.to === from) {
            setAmount(amountOut);
            setAmountOut(amount);
        } else {
            setAmount("");
            setAmountOut("");
        }
        applyPair(pair.from, pair.to, reversedSide);
    };

    // Top-right X, only with a session: always home. Going back would land on
    // an earlier /swaps entry of the same flow and look like nothing happened.
    const handleClose = () => {
        router.push("/home");
    };

    const handleContinue = () => {
        if (quote && (flow === "arsSell" || quote.liquidity_ok)) {
            setCreateError(null);
            setPhase(2);
        }
    };

    const errorOf = (status, data, fallbackKey) => {
        if (status === 401) {
            return { key: "authRequired" };
        }
        if (status === 429) {
            return { key: "rateLimited" };
        }
        if (data && data.error) {
            return { message: data.error };
        }
        if (status === 409) {
            return { key: "noLiquidity" };
        }
        return { key: fallbackKey };
    };

    // Idempotent on the backend, so the status screen can retry it.
    const issueFunding = async (id) => {
        try {
            const { data, status } = await requestDirectFiatFunding(id);
            if (status === 201 && data && data.tentative_id) {
                setTentative(data);
                setTentativeError(null);
                return;
            }
            setTentativeError(errorOf(status, data, "fundingFailed"));
        } catch {
            setTentativeError({ key: "network" });
        }
    };

    const handleRetryFunding = async () => {
        if (!tentativeId) {
            return;
        }
        setRetryingFunding(true);
        await issueFunding(tentativeId);
        setTentativePollStopped(false);
        setRetryingFunding(false);
    };

    // A failed /funding leaves the tentative in CREATED; the status screen offers the retry.
    const handleCreateTentative = async () => {
        const rail = fundingRailOf(from);
        const body = {
            amount_ars: quote.amount_ars,
            type: DIRECT_FIAT_TYPE,
            alias: alias.trim(),
            funding_currency: rail.funding_currency,
        };
        if (rail.network) {
            body.network = rail.network;
        }
        if (receiverName.trim()) {
            body.receiver_name = receiverName.trim();
        }
        const { data, status } = await createDirectFiatTentative(body);
        if (status !== 201 || !data || !data.tentative_id) {
            setCreateError(errorOf(status, data, "createFailed"));
            return;
        }
        // Funding first, then the status screen: starting the poll earlier
        // lets a stale CREATED read land after the 201 of /funding.
        setTentative(data);
        await issueFunding(data.tentative_id);
        setTentativeId(data.tentative_id);
        setPhase(3);
        router.push(`/swaps?tentative=${data.tentative_id}`, undefined, { shallow: true });
    };

    const handleCreate = async () => {
        if (!quote) {
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            if (flow === "arsSell") {
                await handleCreateTentative();
                return;
            }
            // ARS purchases send the pinned side: `amount_ars` (centavos) or
            // `amount_out` (base units); the amount to transfer comes back in the swap.
            const { data, status } =
                flow === "arsBuy"
                    ? await createArsSwap({
                          to_asset: to,
                          payout_address: payoutAddress.trim(),
                          ...(side === "out"
                              ? { amount_out: quote.amount_out }
                              : { amount_ars: quote.amount_in }),
                      })
                    : await createSwap({
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
            setCreateError(errorOf(status, data, "createFailed"));
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
        setAlias("");
        setReceiverName("");
        setTentativeId(null);
        setTentative(null);
        setTentativeError(null);
        setTentativePollStopped(false);
        setSwapPollStopped(false);
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
                {/* The glows hang off the frame on every side. They live in
                    their own clipped layer so the negative bottom/right
                    offsets cannot add scrollable slack to the column that
                    actually scrolls. */}
                <YStack
                    position="absolute"
                    top={0}
                    right={0}
                    bottom={0}
                    left={0}
                    overflow="hidden"
                    pointerEvents="none"
                >
                    <BrandGlow />
                </YStack>
                {/* The app shell (body + <CustomMain/>) is a fixed-height
                    frame, so a page taller than the viewport has to carry its
                    own scroll — the three phases all overflow a phone screen.
                    Same pattern as /newSignUp and /newTransactionPending. */}
                <YStack
                    flex={1}
                    minHeight={0}
                    width={"100%"}
                    overflow="auto"
                    scrollbarWidth="thin"
                >
                    <YStack
                        width={"100%"}
                        maxWidth={520}
                        alignSelf="center"
                        paddingHorizontal={"$4"}
                        paddingTop={"$5"}
                        paddingBottom={"$8"}
                        gap={"$4"}
                    >
                        <XStack justifyContent="space-between" alignItems="center">
                            <LanguageSelector t={t} lang={lang} setLang={setLang} />
                            {loggedIn ? (
                                <TamaguiIconButton
                                    icon={closeIcon}
                                    onClick={handleClose}
                                    ariaLabel={t.closeAria}
                                />
                            ) : null}
                        </XStack>

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
                            {/* The pitch belongs to the quote only; later phases are about this order. */}
                            {phase === 1 ? (
                                <Paragraph
                                    color={"$neutral11"}
                                    style={sans(13, { lineHeight: "18px" })}
                                >
                                    {t.subtitle}
                                </Paragraph>
                            ) : null}
                        </YStack>

                        {phase === 1 ? (
                            <QuoteCard
                                t={t}
                                lang={lang}
                                flow={flow}
                                sendOptions={sendOptions(loggedIn)}
                                canSwitch={isSupportedPair(to, from, loggedIn)}
                                receiveOptions={receiveOptions(from, loggedIn)}
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

                        {phase === 2 && flow === "arsSell" ? (
                            <FiatDetailsForm
                                t={t}
                                lang={lang}
                                from={from}
                                btcUnit={btcUnit}
                                quote={quote}
                                alias={alias}
                                receiverName={receiverName}
                                onAliasChange={setAlias}
                                onReceiverNameChange={setReceiverName}
                                onBack={() => setPhase(1)}
                                onSubmit={handleCreate}
                                submitting={creating}
                                submitError={translateError(createError)}
                            />
                        ) : null}

                        {phase === 2 && flow !== "arsSell" ? (
                            <AddressForm
                                t={t}
                                lang={lang}
                                flow={flow}
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

                        {phase === 3 && tentativeId ? (
                            <FiatPayoutStatus
                                t={t}
                                lang={lang}
                                tentative={tentative}
                                btcUnit={btcUnit}
                                loading={tentativeLoading}
                                errorText={translateError(tentativeError)}
                                onRetryFunding={handleRetryFunding}
                                retrying={retryingFunding}
                                showNewSwap={Boolean(
                                    tentative && TENTATIVE_TERMINAL_STATUSES.includes(tentative.status)
                                )}
                                onNewSwap={handleNewSwap}
                            />
                        ) : null}

                        {phase === 3 && !tentativeId && swap && swap.from === "ARS" ? (
                            <PurchaseStatus
                                t={t}
                                lang={lang}
                                btcUnit={btcUnit}
                                swap={swap}
                                errorText={translateError(swapError)}
                                showNewSwap={isTerminal}
                                onNewSwap={handleNewSwap}
                            />
                        ) : null}

                        {phase === 3 && !tentativeId && !(swap && swap.from === "ARS") ? (
                            <SwapStatus
                                t={t}
                                btcUnit={btcUnit}
                                swap={swap}
                                loading={swapLoading}
                                errorText={translateError(swapError)}
                                showNewSwap={isTerminal}
                                onNewSwap={handleNewSwap}
                            />
                        ) : null}
                    </YStack>
                </YStack>
            </YStack>
        </>
    );
}
