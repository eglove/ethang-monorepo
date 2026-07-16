declare const response: { json(): unknown };
export const handler = async () => response.json();
