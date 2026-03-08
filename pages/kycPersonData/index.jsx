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
    getCredentials,
    getUserData,
    updateUserData,
} from "../../api/api";

function kycPersonData() {
    const router = useRouter();

    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [countries, setCountries] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [credentialNumber, setCredentialNumber] = useState("");
    const [credentialType, setCredentialType] = useState("");
    const [credentialExpirationDate, setCredentialExpirationDate] =
        useState("");
    const [nationalityCountry, setNationalityCountry] = useState("");
    const [phone, setPhone] = useState("");
    const [buttonDisabled, setButtonDisabled] = useState(true);

    useEffect(() => {
        const getData = async () => {
            try {
                const { data: countriesData } = await getCountries();
                setCountries(countriesData);

                const { data: credentialsData } = await getCredentials();
                setCredentials(credentialsData);

                const { data, status } = await getUserData();
                if (status === 200) {
                    setName(data.name);
                    setSurname(data.surname);
                    setBirthDate(data.date_of_birth);
                    setCredentialNumber(data.credential_number);

                    if (data.credential_type) {
                        setCredentialType(
                            data.credential_type.toUpperCase().replace(" ", "_")
                        );
                    }

                    setCredentialNumber(data.credential_number);
                    setCredentialExpirationDate(data.credential_expiration);
                    setNationalityCountry(data.nationality_country_id);
                    setPhone(data.phone);
                } else if (status !== 404) {
                    if (status === 400 || status === 401) {
                        setErrorMessage(
                            data.message || "Failed to fetch user data."
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

        getData();
    }, []);

    const handleNameChange = (e) => {
        setName(e.target.value);
    };
    const handleSurnameChange = (e) => {
        setSurname(e.target.value);
    };
    const handleBirthDateChange = (e) => {
        setBirthDate(e.target.value);
    };
    const handleCredentialExpirationDateChange = (e) => {
        setCredentialExpirationDate(e.target.value);
    };
    const handleNationalityCountryChange = (e) => {
        setNationalityCountry(e.target.value);
    };
    const handleCredentialNumberChange = (e) => {
        setCredentialNumber(e.target.value);
    };
    const handleCredentialTypeChange = (e) => {
        setCredentialType(e.target.value);
    };
    const handlePhoneChange = (e) => {
        setPhone(e.target.value);
    };

    const handleConfirmSend = async () => {
        if (
            name.trim() === "" ||
            surname.trim() === "" ||
            birthDate.trim() === "" ||
            credentialNumber.trim() === "" ||
            credentialType.trim() === "" ||
            credentialExpirationDate.trim() === "" ||
            nationalityCountry === "" ||
            phone.trim() === ""
        ) {
            setErrorMessage("You need to complete all the fields.");
            setErrorModalState(true);
            return;
        }
        try {
            const { data, status } = await updateUserData({
                name,
                surname,
                date_of_birth: birthDate,
                credential_number: credentialNumber,
                credential_type: credentialType,
                credential_expiration: credentialExpirationDate,
                nationality_country_id: nationalityCountry,
                phone,
            });

            if (status === 200 || status === 201) {
                router.push("/kycResidenceData");
            } else {
                if (status === 400) {
                    setErrorMessage(data.message || data.error);
                    setErrorModalState(true);
                } else {
                    setErrorMessage(data.error || "Failed to update user data");
                    setErrorModalState(true);
                }
            }
        } catch (error) {
            setErrorMessage(error.message);
            setErrorModalState(true);
        }
    };

    useEffect(() => {
        if (
            name !== undefined &&
            name !== "" &&
            surname !== undefined &&
            surname !== "" &&
            birthDate !== undefined &&
            birthDate !== "" &&
            credentialNumber !== undefined &&
            credentialNumber !== "" &&
            credentialType !== undefined &&
            credentialType !== "" &&
            credentialExpirationDate !== undefined &&
            credentialExpirationDate !== "" &&
            nationalityCountry !== undefined &&
            nationalityCountry !== "" &&
            phone !== undefined &&
            phone !== ""
        ) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [
        name,
        surname,
        birthDate,
        credentialNumber,
        credentialType,
        credentialExpirationDate,
        nationalityCountry,
        phone,
    ]);

    return (
        <>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <FormContainer>
                <CustomTitle>Personal information</CustomTitle>
                <Form onSubmit={handleConfirmSend}>
                    <InputContainer>
                        <CustomDescription>Name</CustomDescription>
                        <CustomInput
                            label={"Name"}
                            name={"name"}
                            type={"text"}
                            value={name}
                            onChange={handleNameChange}
                            required
                            autoComplete={"off"}
                        />
                        <CustomDescription>Surname</CustomDescription>
                        <CustomInput
                            label={"Surname"}
                            name={"surname"}
                            type={"text"}
                            value={surname}
                            onChange={handleSurnameChange}
                            required
                            autoComplete="off"
                        />
                        <CustomDescription>Birthday Date</CustomDescription>
                        <CustomInput
                            label={"Birthday Date"}
                            name={"birthday_date"}
                            type={"date"}
                            value={birthDate}
                            onChange={handleBirthDateChange}
                            required
                            autoComplete={"off"}
                        />
                        <CustomDescription>Credential Number</CustomDescription>
                        <CustomInput
                            label={"Credential Number"}
                            name={"credential_number"}
                            type={"text"}
                            value={credentialNumber}
                            onChange={handleCredentialNumberChange}
                            required
                            autoComplete="off"
                        />
                        <CustomDescription>Credential type</CustomDescription>
                        <CustomSelect
                            value={credentialType}
                            label={"Select an option"}
                            onChange={handleCredentialTypeChange}
                            options={credentials}
                        ></CustomSelect>
                        <CustomDescription>
                            Credential Expiration
                        </CustomDescription>
                        <CustomInput
                            label={"Credential Expiration"}
                            name={"credential_expiration"}
                            type={"date"}
                            value={credentialExpirationDate}
                            onChange={handleCredentialExpirationDateChange}
                            required
                            autoComplete={"off"}
                        />
                        <CustomDescription>
                            Country Nacionality
                        </CustomDescription>
                        <CustomSelect
                            value={nationalityCountry}
                            label={"Select an option"}
                            onChange={handleNationalityCountryChange}
                            options={countries}
                        ></CustomSelect>
                        <CustomDescription>Phone</CustomDescription>
                        <CustomInput
                            label={"Phone"}
                            name={"phone"}
                            type={"text"}
                            value={phone}
                            onChange={handlePhoneChange}
                            required
                            autoComplete="off"
                        />
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

export default kycPersonData;
