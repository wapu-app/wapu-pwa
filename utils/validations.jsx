export const isValidAmount = (amountValue) => {
    return amountValue === "" || /^\d+(\.\d{0,2})?$/.test(amountValue);
};

export const isAnAuthablePage = (pathname) => {
    const noAuthRequiredPaths = [
        "/signup",
        "/recoverPassword",
        "/resetPassword",
        "/verifyEmail",
        "/login",
        "/newSignUp",
        "/version",
    ];
    return !noAuthRequiredPaths.includes(pathname);
};
