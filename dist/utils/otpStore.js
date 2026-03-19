const signupStore = new Map();
export const setSignupOtp = (email, data) => {
    signupStore.set(email, data);
};
export const getSignupOtp = (email) => {
    return signupStore.get(email);
};
export const deleteSignupOtp = (email) => {
    signupStore.delete(email);
};
//# sourceMappingURL=otpStore.js.map