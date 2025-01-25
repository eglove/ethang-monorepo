import { store } from "../index.js";

type SendData = {
  data?: unknown;
  error?: string;
};

export const sendToClients = (type: string, data: SendData) => {
  for (const [, ws] of store.connections) {
    ws.send(
      JSON.stringify({
        payload: data,
        type,
      }),
    );
  }
};
