import { Effect, Schema } from "effect";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import lastIndexOf from "lodash/lastIndexOf.js";
import map from "lodash/map.js";
import sortBy from "lodash/sortBy.js";
import split from "lodash/split.js";
import trimEnd from "lodash/trimEnd.js";
import trimStart from "lodash/trimStart.js";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/u;

const blogRoot = path.resolve(import.meta.dirname, "../src/content/blog");

const GROQ = `*[_type == "blog"]{"slug": slug.current, description, "featuredImage": featuredImage { alt, "asset": asset->{url}}}`;
const api = `https://3rkvshhk.api.sanity.io/v2023-01-01/data/query/production?query=${encodeURIComponent(GROQ)}`;

type featuredAsset = {
  url?: null | string | undefined;
};

type featuredImage = {
  alt?: null | string | undefined;
  asset?: featuredAsset | null | undefined;
};

type featuredRow = {
  description?: null | string | undefined;
  featuredImage?: featuredImage | null | undefined;
  slug: string;
};

const featuredAssetSchema = Schema.Struct({
  url: Schema.optional(Schema.NullOr(Schema.String))
});
const featuredImageSchema = Schema.Struct({
  alt: Schema.optional(Schema.NullOr(Schema.String)),
  asset: Schema.optional(Schema.NullOr(featuredAssetSchema))
});
const featuredRowSchema = Schema.Struct({
  description: Schema.optional(Schema.NullOr(Schema.String)),
  featuredImage: Schema.optional(Schema.NullOr(featuredImageSchema)),
  slug: Schema.String
});
const apiResponseSchema = Schema.Struct({
  result: Schema.Array(featuredRowSchema)
});

const getExtension = (assetUrl: string) => {
  const last = split(assetUrl, "/").at(-1) ?? "";
  const dot = lastIndexOf(last, ".");
  return 0 < dot && dot < last.length - 1
    ? last.slice(dot + 1).toLowerCase()
    : "jpg";
};

const fileExists = (filePath: string) => {
  return Effect.tryPromise(async () => {
    return access(filePath);
  }).pipe(
    Effect.matchEffect({
      onFailure: () => {
        return Effect.succeed(false);
      },
      onSuccess: () => {
        return Effect.succeed(true);
      }
    })
  );
};

const downloadImage = (assetUrl: string, destinationFile: string) => {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise(async () => {
      return fetch(assetUrl);
    });
    if (!response.ok) {
      yield* Effect.logWarning(`HTTP ${response.status} fetching ${assetUrl}`);
      return false;
    }
    yield* Effect.tryPromise(async () => {
      return mkdir(path.dirname(destinationFile), { recursive: true });
    });
    const bytes = yield* Effect.tryPromise(async () => {
      return response.arrayBuffer();
    });
    yield* Effect.tryPromise(async () => {
      return writeFile(destinationFile, new Uint8Array(bytes));
    });
    return true;
  }).pipe(
    Effect.catchAll((error) => {
      return Effect.logWarning(
        `Failed to download ${assetUrl}: ${String(error)}`
      ).pipe(Effect.as(false));
    })
  );
};

const buildFrontmatter = (
  source: string,
  row: featuredRow,
  featuredPath: null | string
) => {
  const match = FRONTMATTER_PATTERN.exec(source);
  if (isNil(match)) return source;
  const rest = source.slice(match[0].length);
  const existing = match[1] ?? "";
  const kept = filter(
    map(split(existing, "\n"), (line) => {
      return trimEnd(line);
    }),
    (line) => {
      const key = split(trimStart(line), ":", 1)[0] ?? "";
      return (
        "description" !== key &&
        "featuredImage" !== key &&
        "featuredImageAlt" !== key
      );
    }
  );
  const additions: string[] = [];
  const description = row.description;
  if (!isNil(description)) {
    additions.push(`description: ${JSON.stringify(description)}`);
  }
  if (!isNil(featuredPath)) {
    additions.push(`featuredImage: ${featuredPath}`);
  }
  const alt = row.featuredImage?.alt ?? null;
  if (!isNil(alt)) {
    additions.push(`featuredImageAlt: ${JSON.stringify(alt)}`);
  }
  const patched = sortBy([...kept, ...additions]).join("\n");
  return `---\n${patched}\n---\n${rest}`;
};

const processRow = (row: featuredRow) => {
  return Effect.gen(function* () {
    const indexFile = path.resolve(blogRoot, row.slug, "index.mdx");
    const source = yield* Effect.tryPromise(async () => {
      return readFile(indexFile, "utf8");
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null);
      })
    );
    if (isNil(source)) return { downloaded: 0, patched: 0 };

    let featuredPath: null | string = null;
    let downloaded = 0;
    const url = row.featuredImage?.asset?.url ?? null;
    if (!isNil(url)) {
      const extension = getExtension(url);
      const relative = `./images/featured.${extension}`;
      const destinationFile = path.resolve(
        blogRoot,
        row.slug,
        "images",
        `featured.${extension}`
      );
      const isAlreadyExists = yield* fileExists(destinationFile);
      if (isAlreadyExists) {
        featuredPath = relative;
      } else {
        const isOk = yield* downloadImage(url, destinationFile);
        if (isOk) {
          downloaded = 1;
          featuredPath = relative;
        }
      }
    }

    const patched = buildFrontmatter(source, row, featuredPath);
    if (patched === source) return { downloaded, patched: 0 };
    yield* Effect.tryPromise(async () => {
      return writeFile(indexFile, patched, "utf8");
    });
    return { downloaded, patched: 1 };
  });
};

const main = Effect.gen(function* () {
  const response = yield* Effect.tryPromise(async () => {
    return fetch(api);
  });
  if (!response.ok) {
    const body = yield* Effect.tryPromise(async () => {
      return response.text();
    });
    yield* Effect.logError(`Sanity API ${response.status}: ${body}`);
    yield* Effect.die(new Error(`Sanity API returned ${response.status}`));
  }
  const text = yield* Effect.tryPromise(async () => {
    return response.text();
  });
  const decoded = yield* Schema.decodeUnknown(
    Schema.parseJson(apiResponseSchema)
  )(text).pipe(
    Effect.mapError((error) => {
      return new Error(`Invalid Sanity response: ${String(error)}`);
    })
  );
  const results = yield* Effect.all(
    map(decoded.result, (row) => {
      return processRow(row);
    }),
    {
      concurrency: "unbounded"
    }
  );
  const downloaded = filter(results, (result) => {
    return 0 !== result.downloaded;
  }).length;
  const patched = filter(results, (result) => {
    return 0 !== result.patched;
  }).length;
  yield* Effect.logInfo(
    `Sanity featured images: downloaded ${downloaded}, patched ${patched} of ${decoded.result.length} posts`
  );
});

await Effect.runPromise(main);
