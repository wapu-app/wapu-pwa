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
    Overline,
    assetOf,
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
    const [amount, setAmount] = useState("");

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
        const fromAsset = assetOf(from);
        const amountIn = fromAsset ? toBaseUnits(amount, fromAsset.decimals) : null;
        if (!amountIn || amountIn <= 0) {
            setQuote(null);
            setQuoteError(null);
            setQuoteLoading(false);
            return undefined;
        }

        let cancelled = false;
        setQuoteLoading(true);
        const timer = setTimeout(async () => {
            try {
                const { data, status } = await getSwapQuote(from, to, amountIn);
                if (cancelled) {
                    return;
                }
                if (status === 200 && data && !data.error) {
                    setQuote(data);
                    setQuoteError(null);
                } else {
                    setQuote(null);
                    setQuoteError(
                        data && data.error
                            ? { message: data.error }
                            : { key: "quoteFailed" }
                    );
                }
            } catch {
                if (!cancelled) {
                    setQuote(null);
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
    }, [phase, from, to, amount]);

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

    const handleAmountChange = (value) => {
        if (AMOUNT_PATTERN.test(value)) {
            setAmount(value);
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

    const handleSwitch = () => {
        setFrom(to);
        setTo(from);
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
                            quote={quote}
                            loading={quoteLoading}
                            errorText={translateError(quoteError)}
                            onFromChange={handleFromChange}
                            onToChange={handleToChange}
                            onAmountChange={handleAmountChange}
                            onSwitch={handleSwitch}
                            onContinue={handleContinue}
                        />
                    ) : null}

                    {phase === 2 ? (
                        <AddressForm
                            t={t}
                            from={from}
                            to={to}
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
