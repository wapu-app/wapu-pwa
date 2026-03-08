import { useState, useEffect } from "react";
import { YStack, H6, Paragraph, XStack } from "tamagui";
import { useRouter } from "next/router";
import Image from "next/image";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import { TamaguiSelect } from "../../components/TamaguiSelect";
import NewHeaderButton from "../../components/newHeaderButton";
import ErrorModal from "../../components/ErrorModal";
import ContactsList from "../../components/ContactsList";
import WarningIcon from "../../public/warning_icon.svg";
import { useUserContext } from "../../context/userContext";
import { isValidAmount } from "../../utils/validations";
import NewSendConfirmationModal from "../../components/NewSendConfirmationModal";
import { postInnerTransfer, postWithdrawal } from "../../api/api";

export default function NewWithdrawal() {
    const router = useRouter();
    const { getUser, user } = useUserContext();

    const [step, setStep] = useState(1);
    const [blockchainsOptions, setBlockchainsOptions] = useState([]);
    const [blockchain, setBlockchain] = useState({});
    const [currency, setCurrency] = useState("USDT");
    const [receiverName, setReceiverName] = useState("");
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [receiveAmount, setReceiveAmount] = useState(0);
    const [minimumUSDT, setMinimumUSDT] = useState("");
    const [minimumWithdrawalMessage, setMinimumWithdrawalMessage] =
        useState("");
    const [networkFeeMessage, setNetworkFeeMessage] = useState("");
    const [errorModalState, setErrorModalState] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleReceiverNameChange = (value) => {
        setReceiverName(value);
    };

    const handleAmountChange = (value) => {
        if (isValidAmount(value)) {
            setAmount(value);
            if (
                value === "" ||
                networkFeeMessage === "" ||
                parseFloat(value) < parseFloat(networkFeeMessage)
            ) {
                setReceiveAmount(0);
            } else {
                setReceiveAmount(
                    parseFloat(
                        parseFloat(value) - parseFloat(networkFeeMessage)
                    ).toFixed(2)
                );
            }
        }
    };
    const handleNetworkChange = (index) => {
        const selectedBlockchain = blockchainsOptions.at(index);
        let selectedWithdrawFee = 0;
        setBlockchain(selectedBlockchain);
        if (selectedBlockchain.id != "inner_transfer") {
            selectedWithdrawFee = user.blockchains[index].withdraw_fee;
        }
        setNetworkFeeMessage(selectedWithdrawFee);
        setMinimumWithdrawalMessage(
            parseFloat(minimumUSDT) + parseFloat(selectedWithdrawFee)
        );
        setAmount("");
        setReceiveAmount("");
    };

    const handleAddressChange = (value) => {
        setAddress(value);
    };

    const handleContactSelect = (contact) => {
        // Set receiver name if available
        if (contact.name_label) {
            setReceiverName(contact.name_label);
        }
        
        // Use the selectedAddress which contains the correct address based on priority
        if (contact.selectedAddress) {
            setAddress(contact.selectedAddress);
        }
        
        // Update network selection if contact has network info
        if (contact.network && contact.network !== "Wapu Users") {
            const index = blockchainsOptions.findIndex(
                option => option.name.includes(contact.network)
            );
            if (index !== -1) {
                handleNetworkChange(index);
            }
        } else if (contact.name_label_id) {
            // For Wapu users, select the "Wapu users" network
            const index = blockchainsOptions.findIndex(
                option => option.id === "inner_transfer"
            );
            if (index !== -1) {
                handleNetworkChange(index);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        try {
            const withdrawalData = {
                address: address,
                network: blockchain.id,
                currency: currency,
                amount: amount,
                receiver_name: receiverName,
                receiver_username: address,
            };

            let res;
            if (blockchain.id === "inner_transfer") {
                res = await postInnerTransfer(withdrawalData);
            } else {
                res = await postWithdrawal(withdrawalData);
            }

            const data = res.data;
            if (res.status === 201 && blockchain.id != "inner_transfer") {
                router.push({
                    pathname: "/newTransactionPending",
                    query: {
                        id: data.transaction_id,
                        transaction_type: "withdraw",
                    },
                });
            } else if (
                res.status === 201 &&
                blockchain.id === "inner_transfer"
            ) {
                router.push({
                    pathname: "/newTransactionComplete",
                    query: {
                        id: data.transaction_id,
                        transaction_type: "send_digital",
                    },
                });
            } else {
                setErrorMessage(data.error);
                setErrorModalState(true);
            }
        } catch (error) {
            setErrorMessage(
                "There has been an error. Please, try again in a few minutes."
            );
            setErrorModalState(true);
        }
    };

    const handleNext = async (e) => {
        setStep(step + 1);
    };

    const getBlockchainsOptions = () => {
        if (user && user.blockchains) {
            const blockchainsOptions = user.blockchains.map((blockchain) => ({
                id: blockchain.network,
                name: blockchain.network_name,
            }));
            blockchainsOptions.push({
                id: "inner_transfer",
                name: "Wapu users",
            });
            setBlockchainsOptions(blockchainsOptions);
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        getBlockchainsOptions();
        setMinimumUSDT(user.minimumWithdrawalAmountUsdt);
    }, [user]);

    return (
        <YStack
            width={"$width100"}
            height={"$height100"}
            alignItems="center"
            alignContent="center"
        >
            <YStack padding={"$4"} width={"$width100"}>
                <NewHeaderButton onClick={handleBack}>
                    Send Digital Dollars
                </NewHeaderButton>
            </YStack>

            {step === 1 ? (
                <YStack
                    height={"$height100"}
                    width={"$width90"}
                    gap={"$3"}
                    alignItems="left"
                    alignContent="center"
                >
                    <H6 color={"$neutral13"}>
                        Transfer Digital Dollars
                    </H6>
                    
                    <YStack gap="$1">
                        <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                            Receiver name
                        </Paragraph>
                        <TamaguiInput
                            value={receiverName}
                            onChange={handleReceiverNameChange}
                            placeholder="Name of receiver (optional)"
                        />
                    </YStack>
                    
                    <YStack gap="$1">
                        <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                            Network
                        </Paragraph>
                        <TamaguiSelect
                            value={blockchain.name}
                            onChange={handleNetworkChange}
                            items={blockchainsOptions} // Agregar Wapu
                            placeholder={"Select network"}
                        />
                    </YStack>
                    
                    <YStack gap="$1">
                        <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                            Address of receiver
                        </Paragraph>
                        <TamaguiInput
                            value={address}
                            onChange={handleAddressChange}
                            placeholder="Address or Wapu ID"
                        />
                    </YStack>
                    
                    {/* Contacts Section */}
                    {user.showRecentFavContacts && (
                        <ContactsList 
                            filterBy="CRIPTO"
                            onContactSelect={handleContactSelect}
                        />
                    )}
                    
                    <YStack />
                    <TamaguiButton
                        text="Next"
                        onClick={handleNext}
                        isDisabled={!blockchain.name || !address}
                    />
                </YStack>
            ) : step === 2 ? (
                <YStack
                    height={"$height100"}
                    width={"$width90"}
                    gap={"$3.5"}
                    alignItems="left"
                    alignContent="center"
                >
                    <H6 color={"$neutral13"}>How much do you want to send?</H6>
                    <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                        Amount
                    </Paragraph>
                    <TamaguiInput
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter Amount"
                        keyboardType="decimal-pad"
                    />
                    <XStack justifyContent="space-between" width={"$width90"}>
                        <Paragraph
                            color={"$neutral11"}
                            textAlign="center"
                            size={"$4"}
                            weight={"$2"}
                        >
                            Network
                        </Paragraph>
                        <Paragraph
                            color={"$neutral11"}
                            textAlign="center"
                            size={"$4"}
                            weight={"$2"}
                        >
                            {blockchain.name}
                        </Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between" width={"$width90"}>
                        <Paragraph
                            color={"$neutral11"}
                            textAlign="center"
                            size={"$4"}
                            weight={"$2"}
                        >
                            Transaction fee
                        </Paragraph>
                        <Paragraph
                            color={"$neutral11"}
                            textAlign="center"
                            size={"$4"}
                            weight={"$2"}
                        >
                            {networkFeeMessage} USDT
                        </Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between" width={"$width90"}>
                        <Paragraph
                            color={"$neutral13"}
                            weight={"$2"}
                            size={"$3"}
                        >
                            Receive amount
                        </Paragraph>
                        <Paragraph
                            color={"$neutral13"}
                            weight={"$2"}
                            size={"$3"}
                        >
                            {receiveAmount ? receiveAmount : 0} USDT
                        </Paragraph>
                    </XStack>
                    <YStack
                        backgroundColor={"$neutral3"}
                        padding={"$4"}
                        borderRadius={"$8"}
                    >
                        <XStack
                            gap={"$2"}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Image src={WarningIcon} alt="warning_icon" />
                            <Paragraph
                                color={"$neutral11"}
                                weight={"$1"}
                                size={"$4"}
                            >
                                You have to send minimum{" "}
                                {minimumWithdrawalMessage} USDT.
                            </Paragraph>
                        </XStack>
                    </YStack>
                    <TamaguiButton
                        text="Next"
                        onClick={handleNext}
                        isDisabled={amount < minimumWithdrawalMessage}
                    />
                </YStack>
            ) : step === 3 ? (
                <NewSendConfirmationModal
                    amount={receiveAmount}
                    fee={networkFeeMessage}
                    receiverName={receiverName}
                    receiverAccount={address}
                    onConfirm={handleWithdrawal}
                    currency={currency}
                    network={blockchain.name}
                    totalAmount={amount}
                />
            ) : (
                <></>
            )}
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
        </YStack>
    );
}
