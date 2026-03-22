import { NO_DRAFTS, sterettSanityClient } from "../clients/sanity-client.ts";

export type TrusteeRecord = {
  _id: string;
  duties: string;
  image: {
    asset: {
      metadata: { dimensions: { height: number; width: number } };
      url: string;
    };
  };
  name: string;
  phoneNumber: string;
};

export const getTrustees = async (): Promise<TrusteeRecord[]> => {
  const trusteesQuery = `*[_type == "trustee" && ${NO_DRAFTS}] | order(orderRank asc) {_id, order, orderRank, duties, name, phoneNumber, image{asset->{url, metadata{dimensions{height, width}}}}}`;

  return sterettSanityClient.fetch<TrusteeRecord[]>(trusteesQuery);
};
