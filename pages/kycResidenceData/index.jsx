import { useState, useEffect } from "react";
import {
    InputContainer,
    CustomTitle,
    Form,
    FormContainer,
    ButtonContainer,
    CustomDescription,
} from "./styled";
import { CustomInput } from "../../components/Input";
import { CustomSelect } from "../../components/Select";
import { ButtonRequest } from "../../components/ButtonRequest";
import { useRouter } from "next/navigation";
import ErrorModal from "../../components/ErrorModal";
import {
    getCountries,
    getUserResidenceData,
    updateUserResidenceData,
} from "../../api/api";

function kycResidenceData() {
    const router = useRouter();
    const [adressStreet, setAdressStreet] = useState("");
    const [addressDetails, setAddressDetails] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [city, setCity] = useState("");
    const [provinceState, setProvinceState] = useState("");
    const [countryID, setCountryID] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [countries, setCountries] = useState([]);
    const [buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: countriesData } = await getCountries();
                setCountries(countriesData);

                const { data, status } = await getUserResidenceData();

                if (status === 200) {
                    setAdressStreet(data.address_street);
                    setAddressDetails(data.address_details);
                    setPostalCode(data.postal_code);
                    setCity(data.city);
                    setProvinceState(data.province_state);
                    setCountryID(data.country_id);
                } else if (status !== 404) {
                    if (status === 400 || status === 401) {
                        setErrorMessage(
                            data.message ||
                                "Failed to fetch user residence data."
                        );
                    } else {
                        setErrorMessage(
                            "There has been a problem. Please try again later or contact support."
                        );
                    }
                    setErrorModalState(true);
                }
            } catch (error) {
                setErrorMessage(error.message);
                setErrorModalState(true);
            }
        };

        fetchData();
    }, []);

    const handleAdressStreetChange = (e) => {
        setAdressStreet(e.target.value);
    };
    const handleAddressDetailsChange = (e) => {
        setAddressDetails(e.target.value);
    };
    const handlePostalCodeChange = (e) => {
        setPostalCode(e.target.value);
    };
    const handleCityChange = (e) => {
        setCity(e.target.value);
    };
    const handleProvinceStateChange = (e) => {
        setProvinceState(e.target.value);
    };
    const handleCountryIDChange = (e) => {
        setCountryID(e.target.value);
    };

    const handleConfirmSend = async () => {
        if (
            !adressStreet ||
            adressStreet.trim() === "" ||
            !addressDetails ||
            addressDetails.trim() === "" ||
            !postalCode ||
            postalCode.trim() === "" ||
            !city ||
            city.trim() === "" ||
            !provinceState ||
            provinceState.trim() === "" ||
            !countryID ||
            countryID === ""
        ) {
            setErrorMessage("You need to complete all the fields.");
            setErrorModalState(true);
            return;
        }
        try {
            const residenceData = {
                address_street: adressStreet,
                address_details: addressDetails,
                postal_code: postalCode,
                city: city,
                province_state: provinceState,
                country_id: countryID,
            };

            await updateUserResidenceData(residenceData);
            router.push("/kycIDFrontPhoto");
        } catch (error) {
            setErrorMessage(error.message);
            setErrorModalState(true);
        }
    };

    useEffect(() => {
        if (
            adressStreet !== undefined &&
            adressStreet !== "" &&
            addressDetails !== undefined &&
            addressDetails !== "" &&
            postalCode !== undefined &&
            postalCode !== "" &&
            city !== undefined &&
            city !== "" &&
            provinceState !== undefined &&
            provinceState !== "" &&
            countryID !== undefined &&
            countryID !== ""
        ) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [
        adressStreet,
        addressDetails,
        postalCode,
        city,
        provinceState,
        countryID,
    ]);

    return (
        <>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <FormContainer>
                <CustomTitle>Current residence</CustomTitle>
                <Form onSubmit={handleConfirmSend}>
                    <InputContainer>
                        <CustomDescription>Address Street</CustomDescription>
                        <CustomInput
                            label={"Address Street"}
                            name={"address_street"}
                            type={"text"}
                            value={adressStreet}
                            onChange={handleAdressStreetChange}
                            required
                            autoComplete={"off"}
                        />
                        <CustomDescription>
                            Address number / floor
                        </CustomDescription>
                        <CustomInput
                            label={"Address Details"}
                            name={"address_details"}
                            type={"text"}
                            value={addressDetails}
                            onChange={handleAddressDetailsChange}
                            required
                            autoComplete="off"
                        />
                        <CustomDescription>Postal Code</CustomDescription>
                        <CustomInput
                            label={"Postal Code"}
                            name={"postal_code"}
                            type={"text"}
                            value={postalCode}
                            onChange={handlePostalCodeChange}
                            required
                            autoComplete={"off"}
                        />
                        <CustomDescription>City</CustomDescription>
                        <CustomInput
                            label={"City"}
                            name={"city"}
                            type={"text"}
                            value={city}
                            onChange={handleCityChange}
                            required
                            autoComplete={"off"}
                        />
                        <CustomDescription>Province/State</CustomDescription>
                        <CustomInput
                            label={"Province State"}
                            name={"province_state"}
                            type={"text"}
                            value={provinceState}
                            onChange={handleProvinceStateChange}
                            required
                            autoComplete={"off"}
                        />
                        <CustomDescription>Country</CustomDescription>
                        <CustomSelect
                            value={countryID}
                            label={"Select an option"}
                            onChange={handleCountryIDChange}
                            options={countries}
                        ></CustomSelect>
                    </InputContainer>
                </Form>
                <ButtonContainer>
                    <ButtonRequest
                        isDisabled={buttonDisabled}
                        type="submit"
                        text="Continue"
                        onClick={handleConfirmSend}
                    />
                </ButtonContainer>
            </FormContainer>
        </>
    );
}

export default kycResidenceData;
