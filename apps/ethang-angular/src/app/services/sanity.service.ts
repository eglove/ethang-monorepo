import { Injectable } from "@angular/core";
import { createClient } from "@sanity/client";

export type GetPaths = {
  _id: string;
  courseCount: number;
  courses: {
    _id: string;
    author: string;
    name: string;
    url: string;
  }[];
  name: string;
  swebokFocus: string;
  url: string;
}[];

@Injectable({
  providedIn: "root",
})
export class SanityService {
  private readonly sanityClient = createClient({
    apiVersion: "1",
    dataset: "production",
    // eslint-disable-next-line cspell/spellchecker
    projectId: "3rkvshhk",
    useCdn: true,
  });

  public async getPaths() {
    return this.sanityClient.fetch<GetPaths>(
      `*[_type == "learningPath"] | order(orderRank) {
        _id,
        name,
        url,
        swebokFocus,
        "courseCount": count(courses),
        "courses": courses[]-> {
          _id,
          name,
          author,
          url
        }
      }`,
    );
  }
}
