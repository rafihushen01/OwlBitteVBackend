type signupdata = {
  fullname: string;
  email: string;
  gender: string;
  mobile?: string;
  otp: string;
  expires: number;
};

const signupStore = new Map<string, signupdata>();

export const setSignupOtp = (email: string, data: signupdata) => {
  signupStore.set(email, data);
};

export const getSignupOtp = (email: string) => {
  return signupStore.get(email);
};

export const deleteSignupOtp = (email: string) => {
  signupStore.delete(email);
};