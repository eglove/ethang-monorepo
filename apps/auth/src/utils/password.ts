import bcrypt from "bcryptjs";

export const getHashedPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
};

export const validatePassword = async (
  passwordInput: string, password: string,
) => {
  return bcrypt.compare(
    passwordInput, password,
  );
};
