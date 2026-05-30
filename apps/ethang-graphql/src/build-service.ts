import { RemoteGraphQLDataSource } from "@apollo/gateway";
import isNil from "lodash/isNil.js";
import convertToString from "lodash/toString.js";

import { subgraphs } from "./subgraphs/index.ts";

export const buildService = (environment: Env) => {
  return ({ name, url }: { name: string; url?: string }) => {
    return new RemoteGraphQLDataSource({
      async fetcher(fetchUrl, init) {
        const parsedUrl = new URL(fetchUrl);
        const requestUrl = `https://${name}${parsedUrl.pathname}${parsedUrl.search}`;
        // @ts-expect-error bypass strict init type check
        const gatewayRequest = new Request(requestUrl, init);

        const subgraphFetcher = subgraphs[name];

        if (!isNil(subgraphFetcher)) {
          return subgraphFetcher(environment, gatewayRequest);
        }

        return fetch(gatewayRequest);
      },
      url: url ?? "",
      willSendRequest({ context: gatewayContext, request: outgoingRequest }) {
        const { token } = gatewayContext;
        if (!isNil(token)) {
          outgoingRequest.http?.headers.set("X-Token", convertToString(token));
        }
      }
    });
  };
};
