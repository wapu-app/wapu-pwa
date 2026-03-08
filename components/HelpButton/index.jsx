import React from "react";
import { Button } from "./styled";
export default function HelpButton({ onClick, text }) {
    return <Button onClick={onClick}>{text}</Button>;
}
