"use client";
import QRCode from "qrcode.react";
import { useState, useEffect } from "react";
import {
    Container,
    InputContainer,
    Form,
    CustomIcon,
    CustomTitle,
    ButtonContainer,
    QRContainer,
    CopyButton,
    NetworkContainer,
    ContentContainer,
    PText,
    PTextMin,
} from "./styled";
import { Button } from "../../components/Button";
import { CustomSelect } from "../../components/Select";
import ErrorModal from "../../components/ErrorModal";
import { CustomInput } from "../../components/Input";
import CopyIcon from "../../public/icons/content_copy_FILL0_wght400_GRAD0_opsz24.svg";
import { CustomInputReadOnly } from "../../components/InputReadOnly";
import { useUserContext } from "../../context/userContext";
import { useRouter } from "next/router";
import { isValidAmount } from "../../utils/validations";
import { Navbar } from "../../components/Navbar";
import MediaIcons from "../../components/MediaIcons";
import { ButtonRequest } from "../../components/ButtonRequest";
import { postDeposit } from "../../api/api";

export default function DepositPage() {
    const { getUser, user, setIsOpen } = useUserContext();
    const [amount, setAmount] = useState("");
    const [network, setNetwork] = useState("");
    const [networkName, setNetworkName] = useState("");
    const [address, setAddress] = useState("");
    const [blockchainsOptions, setBlockchainsOptions] = useState([]);
    const [minDepositMessage, setMinDepositMessage] = useState("");
    const [currency, setCurrency] = useState("");
    const [currencyName, setCurrencyName] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(true);
    const [confirmationMessage, setConfirmationMessage] = useState(
        "It will take a couple minutes to process. You can check the status in the Movements page."
    );
    const [id, setId] = useState(null);
    const router = useRouter();
    useEffect(() => {
        setIsOpen(false);
    }, []);
    const currencyOptions = [
        { id: 1, name: "USDT" },
        { id: 2, name: "USDC" },
    ];
    const getBlockchainsOptions = () => {
        if (user && user.blockchains) {
            const blockchainsOptions = user.blockchains.map((blockchain) => ({
                id: blockchain.network,
                name: blockchain.network_name,
            }));
            setBlockchainsOptions(blockchainsOptions);
        }
    };
   
    const handleConfirmWallet = () => {
        setShowWalletModal(false);
        router.push(
            `/transactionComplete?message=${confirmationMessage}&trx_id=${id}`
        );
    };
    const handleAmountChange = (e) => {
        if (isValidAmount(e.target.value)) {
            setAmount(e.target.value);
        }
    };
    const handleNetworkChange = (e) => {
        setNetwork(e.target.value);
        setNetworkName(
            user.blockchains[e.target.options.selectedIndex - 1].network_name
        );
        setAddress(
            user.blockchains[e.target.options.selectedIndex - 1].address
        );
    };
    const handleCurrencyChange = (e) => {
        setCurrency(e.target.value);
        setCurrencyName(
            currencyOptions[e.target.options.selectedIndex - 1].name
        );
    };
    const handleContinueButton = async (e) => {
        e.preventDefault();

        if (!network) {
            setErrorMessage("You have to choose a network before continuing");
            setErrorModalState(true);
        } else if (amount <= 0 || amount < user.minDepositUsdt) {
            setErrorMessage(
                "You must enter an amount greater than the minimum deposit to proceed."
            );
            setErrorModalState(true);
        } else {
            try {
                await handleConfirmDeposit();
            } catch (error) {
                setErrorMessage(error.message);
                setErrorModalState(true);
            }
        }
    };

    const handleConfirmDeposit = async () => {
        const payload = {
            amount: amount,
            currency: currencyName,
            network: network,
        };

        try {
            const { data, status } = await postDeposit(payload);

            if (status === 200 || status === 201) {
                setId(data.transaction_id);
                setShowDepositModal(false);
                setShowWalletModal(true);
            } else {
                throw new Error("Unexpected response status");
            }
        } catch (error) {
            setConfirmationMessage("We had a problem");
            if (error.message === "Invalid token") {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("We can't perform this transaction right now");
            }
            setErrorModalState(true);
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        getBlockchainsOptions();
        setMinDepositMessage(
            `Minimun deposit: ${user.minDepositUsdt} ${currencyName}`
        );
    }, [user, currency]);

    return (
        <>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            {showDepositModal && (
                <>
                    <Container>
                        <Navbar />
                        <MediaIcons />
                        <CustomTitle>Deposit</CustomTitle>
                        <Form onSubmit={handleContinueButton}>
                            <CustomSelect
                                label={"Select currency"}
                                name={"currency"}
                                value={currency}
                                options={currencyOptions}
                                onChange={handleCurrencyChange}
                            />
                            <CustomSelect
                                label={"Select Network"}
                                name={"network"}
                                value={network}
                                onChange={handleNetworkChange}
                                options={blockchainsOptions}
                            />
                            <CustomInput
                                label={"Amount to deposit"}
                                name={"amount"}
                                value={amount}
                                onChange={handleAmountChange}
                                required
                                autoComplete={"off"}
                            />
                        </Form>
                        <PTextMin>
                            Enter the amount this wallet will receive. Sender
                            wallet may apply fees.
                        </PTextMin>
                        <PTextMin>{minDepositMessage}</PTextMin>
                        <ButtonContainer>
                            <ButtonRequest
                                type="submit"
                                text="Continue"
                                onClick={handleContinueButton}
                            />
                        </ButtonContainer>
                    </Container>
                </>
            )}
            {showWalletModal && (
                <Container
                    state={showWalletModal}
                    onRequestClose={() => setShowWalletModal(false)}
                >
                    <CustomTitle>Wallet Address</CustomTitle>
                    <QRContainer>
                        <QRCode value={address} />
                    </QRContainer>
                    <NetworkContainer>
                        <PTextMin>
                            Send only {currencyName} to this address using the{" "}
                            {networkName} network to avoid losing funds.
                        </PTextMin>
                        <ContentContainer>
                            <PText>Network</PText>
                            <PText>{networkName}</PText>
                        </ContentContainer>
                    </NetworkContainer>
                    <InputContainer>
                        <CustomInputReadOnly
                            label="Wallet Address"
                            name="address"
                            type="text"
                            autoComplete="off"
                            value={address}
                        />
                        <CopyButton
                            onClick={() =>
                                navigator.clipboard.writeText(address)
                            }
                        >
                            <CustomIcon
                                width={22}
                                height={22}
                                src={CopyIcon}
                                alt="Copy to clipboard"
                            />
                        </CopyButton>
                    </InputContainer>
                    <PTextMin>
                        Ensure to confirm the operation in Wapu after you sent
                        the coins.{" "}
                    </PTextMin>
                    <ButtonContainer>
                        <Button
                            onClick={handleConfirmWallet}
                            text="Confirm"
                        ></Button>
                    </ButtonContainer>
                </Container>
            )}
        </>
    );
}
