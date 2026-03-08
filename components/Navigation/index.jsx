import {
    List,
    ListItem,
    CustomLink,
    IconWrapper,
    DesktopContainer,
    NavigationContainer
} from "./styled";
import Icon from "@mdi/react";
import { mdiHome, mdiArrowDown, mdiArrowUp, mdiQrcodeScan } from "@mdi/js";
import { useUserContext } from "../../context/userContext";
import { Button } from "../Button";

export const Navigation = () => {
    const { setIsOpen, setTransactionChoiceIsOpen } = useUserContext();
    const toDeposit = () => {
        setIsOpen(true);
        setTransactionChoiceIsOpen(false);
    };

    const toTransactionChoice = () => {
        setTransactionChoiceIsOpen(true);
    };

    const fromTransactionChoice = () => {
        setTransactionChoiceIsOpen(false);
    };

    const links = [
        {
            label: "Home",
            route: "/oldHome",
            iconName: mdiHome,
            to: fromTransactionChoice,
        },
        {
            label: "Pay QR",
            route: "/qrPayment",
            iconName: mdiQrcodeScan,
            to: fromTransactionChoice,
        },
        {
            label: "Deposit",
            route: "",
            iconName: mdiArrowDown,
            to: toDeposit,
        },
        {
            label: "Send",
            route: "",
            iconName: mdiArrowUp,
            to: toTransactionChoice,
        },
    ];
    return (
        <NavigationContainer>
            <List>
                {links.map((item) => (
                    <ListItem key={item.label} onClick={item.to}>
                        {/* <- despliega el modal */}
                        <CustomLink href={item.route}>
                            <IconWrapper>
                                <Icon
                                    path={item.iconName}
                                    size={1.2}
                                    color={"black"}
                                />
                            </IconWrapper>
                            {item.label}
                        </CustomLink>
                    </ListItem>
                ))}
            </List>
            <DesktopContainer>
                <Button text="Deposit" onClick={toDeposit} secondary />
                <Button text="Send" onClick={toTransactionChoice} secondary />
            </DesktopContainer>
        </NavigationContainer>
    );
};
