import { LocalBlog } from "@/components/blog/local-blog.tsx";
import { Code } from "@/components/common/code.tsx";
import {
  TypographyInlineCode,
} from "@/components/typography/typography-inline-code.tsx";
import { TypographyLink } from "@/components/typography/typography-link.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { createLazyFileRoute } from "@tanstack/react-router";

const code1 = `chunk(['a', 'b', 'c', 'd'], 2);
// [[ "a", "b" ], [ "c", "d" ]]

chunk(['a', 'b', 'c', 'd'], 3);
// ["a", "b", "c"]`;

const chunkCode = `function chunk(array, size, guard) {
  if ((guard ? isIterateeCall(array, size, guard) : size === undefined)) {
    size = 1;
  } else {
    size = nativeMax(toInteger(size), 0);
  }
  var length = array == null ? 0 : array.length;
  if (!length || size < 1) {
    return [];
  }
  var index = 0,
      resIndex = 0,
      result = Array(nativeCeil(length / size));

  while (index < length) {
    result[resIndex++] = baseSlice(array, index, (index += size));
  }
  return result;
}`;

const mightNotNeedChunk = `// WARNING: This is not a drop in replacement solution and
// it might not work for some edge cases. Test your code! 
const chunk = (arr, chunkSize = 1, cache = []) => {
  const tmp = [...arr]
  if (chunkSize <= 0) return cache
  while (tmp.length) cache.push(tmp.splice(0, chunkSize))
  return cache
}`;

const RouteComponent = () => {
  return (
    <LocalBlog slug="lodash-chunk">
      <TypographyP>
        Lodash Chunk takes an array and splits it into &ldquo;chunks&rdquo; of a
        given size.
        {" "}
        <TypographyLink href="https://lodash.com/docs/4.17.15#chunk">
          From the docs
        </TypographyLink>
        {" "}
        we see the following examples:
      </TypographyP>
      <Code className="mt-6">
        {code1}
      </Code>
      <TypographyP>
        Let&apos;s take a look at
        {" "}
        <TypographyLink href="https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L6839">
          the source
        </TypographyLink>
        .
      </TypographyP>
      <Code className="mt-6">
        {chunkCode}
      </Code>
      <TypographyP>
        The first thing I see here is an undocumented argument, guard. Digging
        into this deeper, this is just a simple guard to make sure chunk is not
        called in way similar to other methods. We can ignore it until another
        day.
      </TypographyP>
      <TypographyP>
        The other guards are checking if size if undefined, and that the size
        is not negative. A negative number will default to 0 returning an empty
        array. Same if the array is nil or has no length.
      </TypographyP>
      <TypographyP>
        Once all checks have passed, the logic gets pretty simple. Get the
        ceiling of the array length divided by size, create an empty Array of
        that length and fill it with slices.
      </TypographyP>
      <TypographyP>
        The
        {" "}
        <TypographyLink href="https://youmightnotneed.com/lodash">
          You Might Not Need Lodash
        </TypographyLink>
        {" "}
        version looks like this. Which also comes
        with a handy warning.
      </TypographyP>
      <Code className="mt-5">
        {mightNotNeedChunk}
      </Code>
      <TypographyP>
        We can very quickly notice the difference in error and misuse handling.
      </TypographyP>
      <TypographyP>
        In the naive version will throw and if uncaught, error the page:
        <TypographyInlineCode>
          chunk(null)
        </TypographyInlineCode>
        . But in lodash, it will simply return an empty array. Unexpectedly,
        while incorrect usage is not handled, the negative size case does return
        an empty array, but only due to it&apos;s splice usage.
      </TypographyP>
      <TypographyP>
        I would even say the naive version provided by You Might Not Need Lodash
        is far better than the average developer would produce while they're
        focused on product features. Most developers would use TypeScript as
        their guard, forgetting that this has no impact on production code which
        may receive unexpected inputs.
      </TypographyP>
    </LocalBlog>
  );
};

export const Route = createLazyFileRoute("/blog/lodash-chunk")({
  component: RouteComponent,
});
