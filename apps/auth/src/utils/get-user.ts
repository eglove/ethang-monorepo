export const getUser = async (email: string, environment: Env) => {
  return environment.DB.prepare("SELECT * FROM Users where email = ?")
    .bind(email)
    .first();
};
