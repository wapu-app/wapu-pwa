"use client";
import { useCallback, useEffect, useState } from "react";

// The app has no i18n framework, and /swaps is the first public page that has
// to work for a visitor who never picked a locale. So this module carries its
// own dictionary plus a tiny hook: every string rendered by the swaps flow
// comes from here, keyed by the language the visitor picked in the pill at the
// top of the page.

export const DEFAULT_LANG = "es";
export const SUPPORTED_LANGS = ["es", "en"];
export const LANG_STORAGE_KEY = "wapu-swaps-lang";

export const TRANSLATIONS = {
    es: {
        langLabel: "Idioma",
        badge: "Intercambio",
        title: "Intercambiá Bitcoin en minutos",
        subtitle:
            "Sin KYC, sin custodia. Cotizá, enviá el depósito y recibí en la red que elijas.",

        quote: {
            youSend: "Vos enviás",
            youGet: "Recibís",
            amountAria: "Monto a enviar",
            amountOutAria: "Monto a recibir",
            unitAria: (unit) => `Mostrar los montos en ${unit}`,
            switchAria: "Invertir el par",
            loading: "Calculando cotización…",
            rate: "Tasa efectiva",
            fee: "Comisión (ya incluida)",
            minAmount: "Mínimo",
            expiration: "Validez",
            confirmations: "Confirmaciones",
            minutes: (value) => `${value} min`,
            confirmationsValue: (value) => `${value} confirmación(es)`,
            noLiquidity:
                "No hay liquidez para este monto en este momento. Probá con un monto menor.",
            cta: "Continuar",
            empty: "Ingresá un monto para ver la cotización.",
        },

        addresses: {
            title: "¿A dónde enviamos los fondos?",
            subtitle:
                "Necesitamos una dirección de destino y una de reembolso por si el swap no se completa.",
            payoutLabel: (asset, network) =>
                `Dirección de destino (${asset} · ${network})`,
            payoutPlaceholder: "Pegá tu dirección de destino",
            refundLabel: (asset, network) =>
                `Dirección de reembolso (${asset} · ${network})`,
            refundPlaceholder: "Pegá tu dirección de reembolso",
            refundHelp:
                "Si el swap expira o falla, devolvemos el depósito a esta dirección.",
            required: "Este campo es obligatorio.",
            invalid: (network) =>
                `La dirección no parece válida para la red ${network}.`,
            back: "Volver",
            submit: "Crear swap",
            submitting: "Creando swap…",
            summary: "Resumen",
        },

        status: {
            title: "Depositá para iniciar el swap",
            swapId: "ID del swap",
            depositAddress: "Dirección de depósito",
            sendExactly: "Enviá exactamente",
            youReceive: "Vas a recibir",
            expiresIn: "Expira en",
            expired: "Expirado",
            qrAlt: "QR de la dirección de depósito",
            steps: {
                waiting: "Depósito",
                confirming: "Confirmando",
                sending: "Enviando",
                done: "Listo",
            },
            confirmationsProgress: (current, required) =>
                `${current}/${required} confirmaciones`,
            depositTxid: "TXID del depósito",
            payoutTxid: "TXID del pago",
            refundTxid: "TXID del reembolso",
            copied: "Copiado",
            copyAria: (what) => `Copiar ${what}`,
            explorerAria: (what) => `Ver ${what} en el explorador`,
            refundNotice:
                "Estamos devolviendo tu depósito a la dirección de reembolso.",
            refundedNotice: "El depósito fue devuelto a tu dirección de reembolso.",
            expiredNotice:
                "El swap expiró. Si depositaste, el monto se devuelve a tu dirección de reembolso.",
            failedNotice: "El swap falló. Contactanos si depositaste fondos.",
            completedNotice: "¡Listo! El swap se completó.",
            newSwap: "Iniciar otro swap",
            loading: "Cargando swap…",
            notFound: "No encontramos ese swap.",
            statusLabel: {
                WAITING_DEPOSIT: "Esperando depósito",
                CONFIRMING: "Confirmando depósito",
                SENDING: "Enviando fondos",
                COMPLETED: "Completado",
                EXPIRED: "Expirado",
                REFUNDING: "Reembolsando",
                REFUNDED: "Reembolsado",
                FAILED: "Fallido",
            },
        },

        errors: {
            samePair: "Elegí dos activos distintos.",
            quoteFailed: "No pudimos calcular la cotización.",
            createFailed: "No pudimos crear el swap.",
            network: "Error de red. Intentá de nuevo.",
            rateLimited: "Demasiados intentos. Esperá un momento e intentá de nuevo.",
            noLiquidity: "No hay liquidez para el monto solicitado.",
            notFound: "No encontramos ese swap.",
            authRequired: "Iniciá sesión para operar con pesos.",
            fundingFailed: "No pudimos generar las instrucciones de depósito.",
        },

        closeAria: "Cerrar",

        arsQuote: {
            lnFee: "Fee de red estimado",
            lnFeeValue: (sats) => `~${sats} sats`,
            sellFee: "Comisión (ya incluida)",
            sellRate: "Tasa USDT/ARS",
            sellInputHint: "Ingresá cuántos pesos querés recibir.",
        },

        arsBuyAddress: {
            lightningLabel: (asset, network) => `Lightning address (${asset} · ${network})`,
            lightningPlaceholder: "usuario@dominio.com",
            invalidLightning: "Ingresá una lightning address válida (usuario@dominio).",
            finalAmountHint:
                "Monto estimado. Al crear la orden te mostramos el monto exacto a transferir, con centavos.",
            submit: "Crear orden",
            submitting: "Creando orden…",
        },

        fiatDetails: {
            title: "¿A qué cuenta enviamos los pesos?",
            subtitle: "La transferencia sale por transferencia rápida a la cuenta que indiques.",
            aliasLabel: "Alias, CBU o CVU",
            aliasPlaceholder: "mi.alias.banco",
            nameLabel: "Nombre del titular (opcional)",
            namePlaceholder: "Nombre y apellido",
            required: "Este campo es obligatorio.",
            submit: "Crear orden",
            submitting: "Creando orden…",
        },

        arsPayment: {
            title: "Transferí los pesos",
            orderId: "ID de la orden",
            alias: "Alias de destino",
            amount: "Monto exacto a transferir",
            exactWarning:
                "Es importante que el pago sea exacto, incluyendo los centavos, o no será detectado.",
            paymentRef: "Referencia del pago",
            paymentHash: "Payment hash",
            payoutTxid: "TXID del envío",
            steps: {
                waiting: "Pago",
                confirming: "Recibido",
                sending: "Enviando",
                done: "Listo",
            },
            statusLabel: {
                WAITING_DEPOSIT: "Esperando tu transferencia",
                CONFIRMING: "Pago recibido",
                SENDING: "Enviando tus fondos",
                COMPLETED: "Completado",
                EXPIRED: "Expirada",
                FAILED: "Fallida",
            },
            sendingNotice: "Recibimos tu pago. Estamos enviando tus fondos.",
            completedNotice: "¡Listo! Enviamos tus fondos.",
            reviewTitle: "En revisión",
            reviewNotice:
                "Recibimos tu pago y la orden quedó en revisión. Te contactamos pronto. Guardá el ID de la orden.",
            expiredNotice:
                "La orden expiró. Si ya transferiste, contactanos con el ID de la orden.",
            failedNotice: "La orden falló. Contactanos con el ID de la orden.",
            newOrder: "Iniciar otra operación",
        },

        fiatPayout: {
            title: "Enviá el depósito",
            orderId: "ID de la orden",
            invoice: "Factura Lightning",
            address: "Dirección de depósito",
            sendExactly: "Enviá exactamente",
            assetId: "Asset ID (Liquid)",
            youReceive: "Vas a recibir",
            alias: "Cuenta de destino",
            qrAlt: "QR del depósito",
            retry: "Generar las instrucciones de nuevo",
            statusLabel: {
                CREATED: "Preparando las instrucciones",
                FUNDING_ISSUED: "Esperando tu depósito",
                EXECUTED: "Enviando los pesos",
                COMPLETED: "Completado",
                EXPIRED: "Expirada",
                SETTLED_TO_BALANCE: "Acreditado en tu saldo",
                FAILED: "Fallida",
                PROCESSING_REFUND: "Reembolsando",
                REFUNDED: "Reembolsado",
            },
            executedNotice: "Recibimos tu depósito. Estamos enviando los pesos.",
            completedNotice: "¡Listo! Enviamos los pesos a tu cuenta.",
            expiredNotice:
                "La orden expiró. Si depositaste después del vencimiento, el monto se acredita en tu saldo.",
            settledNotice: "El depósito llegó fuera de término y se acreditó en tu saldo.",
            failedNotice: "La orden falló. Contactanos con el ID de la orden.",
            refundNotice: "Estamos devolviendo tu depósito.",
            refundedNotice: "Tu depósito fue devuelto.",
        },
    },

    en: {
        langLabel: "Language",
        badge: "Swap",
        title: "Swap Bitcoin in minutes",
        subtitle:
            "No KYC, no custody. Get a quote, send the deposit and receive on the network you pick.",

        quote: {
            youSend: "You send",
            youGet: "You get",
            amountAria: "Amount to send",
            amountOutAria: "Amount to receive",
            unitAria: (unit) => `Show amounts in ${unit}`,
            switchAria: "Reverse the pair",
            loading: "Fetching quote…",
            rate: "Effective rate",
            fee: "Fee (already included)",
            minAmount: "Minimum",
            expiration: "Valid for",
            confirmations: "Confirmations",
            minutes: (value) => `${value} min`,
            confirmationsValue: (value) => `${value} confirmation(s)`,
            noLiquidity:
                "There is no liquidity for this amount right now. Try a smaller amount.",
            cta: "Continue",
            empty: "Enter an amount to see the quote.",
        },

        addresses: {
            title: "Where do we send the funds?",
            subtitle:
                "We need a payout address and a refund address in case the swap does not complete.",
            payoutLabel: (asset, network) =>
                `Payout address (${asset} · ${network})`,
            payoutPlaceholder: "Paste your payout address",
            refundLabel: (asset, network) =>
                `Refund address (${asset} · ${network})`,
            refundPlaceholder: "Paste your refund address",
            refundHelp:
                "If the swap expires or fails, we send the deposit back to this address.",
            required: "This field is required.",
            invalid: (network) =>
                `That address does not look valid for the ${network} network.`,
            back: "Back",
            submit: "Create swap",
            submitting: "Creating swap…",
            summary: "Summary",
        },

        status: {
            title: "Deposit to start the swap",
            swapId: "Swap ID",
            depositAddress: "Deposit address",
            sendExactly: "Send exactly",
            youReceive: "You will receive",
            expiresIn: "Expires in",
            expired: "Expired",
            qrAlt: "Deposit address QR code",
            steps: {
                waiting: "Deposit",
                confirming: "Confirming",
                sending: "Sending",
                done: "Done",
            },
            confirmationsProgress: (current, required) =>
                `${current}/${required} confirmations`,
            depositTxid: "Deposit TXID",
            payoutTxid: "Payout TXID",
            refundTxid: "Refund TXID",
            copied: "Copied",
            copyAria: (what) => `Copy ${what}`,
            explorerAria: (what) => `View ${what} on the explorer`,
            refundNotice: "We are sending your deposit back to the refund address.",
            refundedNotice: "The deposit was sent back to your refund address.",
            expiredNotice:
                "The swap expired. If you deposited, the amount goes back to your refund address.",
            failedNotice: "The swap failed. Contact us if you deposited funds.",
            completedNotice: "Done! The swap completed.",
            newSwap: "Start a new swap",
            loading: "Loading swap…",
            notFound: "We could not find that swap.",
            statusLabel: {
                WAITING_DEPOSIT: "Waiting for deposit",
                CONFIRMING: "Confirming deposit",
                SENDING: "Sending funds",
                COMPLETED: "Completed",
                EXPIRED: "Expired",
                REFUNDING: "Refunding",
                REFUNDED: "Refunded",
                FAILED: "Failed",
            },
        },

        errors: {
            samePair: "Pick two different assets.",
            quoteFailed: "We could not get a quote.",
            createFailed: "We could not create the swap.",
            network: "Network error. Please try again.",
            rateLimited: "Too many attempts. Wait a moment and try again.",
            noLiquidity: "No liquidity for the requested amount.",
            notFound: "We could not find that swap.",
            authRequired: "Log in to trade with pesos.",
            fundingFailed: "We could not issue the deposit instructions.",
        },

        closeAria: "Close",

        arsQuote: {
            lnFee: "Estimated network fee",
            lnFeeValue: (sats) => `~${sats} sats`,
            sellFee: "Fee (already included)",
            sellRate: "USDT/ARS rate",
            sellInputHint: "Enter how many pesos you want to receive.",
        },

        arsBuyAddress: {
            lightningLabel: (asset, network) => `Lightning address (${asset} · ${network})`,
            lightningPlaceholder: "user@domain.com",
            invalidLightning: "Enter a valid lightning address (user@domain).",
            finalAmountHint:
                "Estimated amount. When the order is created we show the exact amount to transfer, cents included.",
            submit: "Create order",
            submitting: "Creating order…",
        },

        fiatDetails: {
            title: "Which account do we send the pesos to?",
            subtitle: "The pesos go out as a fast transfer to the account you enter.",
            aliasLabel: "Alias, CBU or CVU",
            aliasPlaceholder: "my.bank.alias",
            nameLabel: "Account holder name (optional)",
            namePlaceholder: "Full name",
            required: "This field is required.",
            submit: "Create order",
            submitting: "Creating order…",
        },

        arsPayment: {
            title: "Transfer the pesos",
            orderId: "Order ID",
            alias: "Destination alias",
            amount: "Exact amount to transfer",
            exactWarning:
                "It is important that the payment is exact, including the cents, or it will not be detected.",
            paymentRef: "Payment reference",
            paymentHash: "Payment hash",
            payoutTxid: "Payout TXID",
            steps: {
                waiting: "Payment",
                confirming: "Received",
                sending: "Sending",
                done: "Done",
            },
            statusLabel: {
                WAITING_DEPOSIT: "Waiting for your transfer",
                CONFIRMING: "Payment received",
                SENDING: "Sending your funds",
                COMPLETED: "Completed",
                EXPIRED: "Expired",
                FAILED: "Failed",
            },
            sendingNotice: "We received your payment. We are sending your funds.",
            completedNotice: "Done! We sent your funds.",
            reviewTitle: "Under review",
            reviewNotice:
                "We received your payment and the order is under review. We will contact you soon. Keep the order ID.",
            expiredNotice:
                "The order expired. If you already transferred, contact us with the order ID.",
            failedNotice: "The order failed. Contact us with the order ID.",
            newOrder: "Start another operation",
        },

        fiatPayout: {
            title: "Send the deposit",
            orderId: "Order ID",
            invoice: "Lightning invoice",
            address: "Deposit address",
            sendExactly: "Send exactly",
            assetId: "Asset ID (Liquid)",
            youReceive: "You will receive",
            alias: "Destination account",
            qrAlt: "Deposit QR code",
            retry: "Issue the instructions again",
            statusLabel: {
                CREATED: "Preparing the instructions",
                FUNDING_ISSUED: "Waiting for your deposit",
                EXECUTED: "Sending the pesos",
                COMPLETED: "Completed",
                EXPIRED: "Expired",
                SETTLED_TO_BALANCE: "Credited to your balance",
                FAILED: "Failed",
                PROCESSING_REFUND: "Refunding",
                REFUNDED: "Refunded",
            },
            executedNotice: "We received your deposit. We are sending the pesos.",
            completedNotice: "Done! We sent the pesos to your account.",
            expiredNotice:
                "The order expired. A deposit made after expiry is credited to your balance.",
            settledNotice: "The deposit arrived late and was credited to your balance.",
            failedNotice: "The order failed. Contact us with the order ID.",
            refundNotice: "We are sending your deposit back.",
            refundedNotice: "Your deposit was sent back.",
        },
    },
};

const readStoredLang = () => {
    try {
        const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
        return SUPPORTED_LANGS.includes(stored) ? stored : null;
    } catch {
        // Private mode / storage disabled: fall back to the default language.
        return null;
    }
};

// Keeps the picked language in state and mirrors it to localStorage. The stored
// value is read after mount (never during render) so the server HTML and the
// first client render agree and hydration does not fail.
export function useSwapsLang() {
    const [lang, setLangState] = useState(DEFAULT_LANG);

    useEffect(() => {
        const stored = readStoredLang();
        if (stored) {
            setLangState(stored);
        }
    }, []);

    const setLang = useCallback((next) => {
        if (!SUPPORTED_LANGS.includes(next)) {
            return;
        }
        setLangState(next);
        try {
            window.localStorage.setItem(LANG_STORAGE_KEY, next);
        } catch {
            // Persistence is a convenience, not a requirement.
        }
    }, []);

    return { lang, setLang, t: TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG] };
}
