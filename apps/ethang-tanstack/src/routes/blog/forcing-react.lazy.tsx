import { LocalBlog } from "@/components/blog/local-blog.tsx";
import { Image } from "@/components/image.tsx";
import { TypographyLink } from "@ethang/react-components/src/components/typography/typography-link.tsx";
import { TypographyP } from "@ethang/react-components/src/components/typography/typography-p.tsx";
import { createLazyFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return (
    <LocalBlog slug="forcing-react">
      <TypographyP>
        It's impossible to deny that SolidJS has won the competition of
        performant reactive frameworks. Spending a little time working with it
        you realize the entire concept of the vDOM and managing renders in React
        fooled us all.
        {" "}
        <TypographyLink href="https://svelte.dev/blog/virtual-dom-is-pure-overhead">
          Rich Harris was right
        </TypographyLink>
        .
      </TypographyP>
      <TypographyP>
        While Reacts
        {" "}
        <TypographyLink href="https://youtu.be/8pDqJVdNa44?si=g9fSPcHB0Y4J4OoE&t=542">
          "blow away the entire UI and rerender all of it"
        </TypographyLink>
        {" "}
        model
        helped create consistent, declarative UI. It may have been overkill in
        hindsight. One good idea taken way too far.
      </TypographyP>
      <TypographyP>
        If you've worked with multiple frameworks, it's likely you've grown
        tired of this mental model. As
        {" "}
        <TypographyLink href="https://angular.dev/guide/signals">
          Angular
        </TypographyLink>
        ,
        {" "}
        <TypographyLink href="https://vuejs.org/guide/extras/reactivity-in-depth.html">
          Vue
        </TypographyLink>
        ,
        {" "}
        <TypographyLink href="https://preactjs.com/guide/v10/signals/">
          Preact
        </TypographyLink>
        ,
        {" "}
        <TypographyLink href="https://qwik.dev/docs/components/state/">
          Qwik
        </TypographyLink>
        ,
        {" "}
        <TypographyLink href="https://docs.solidjs.com/concepts/signals">
          Solid
        </TypographyLink>
        , and
        {" "}
        <TypographyLink href="https://svelte.dev/blog/runes">
          Svelte
        </TypographyLink>
        {" "}
        have implemented signals for fine-grained reactivity. It feels
        like React is falling behind. And as a result, falling behind in
        performance.
      </TypographyP>
      <Image
        alt="JS Framework Benchmark"
        src="https://ardent-monitor-908.convex.cloud/api/storage/beff8694-297c-417e-8fac-d668027a5075"
      />
      <TypographyP>
        The React team themselves have never had a preference for client-side
        rendering and complex client-side state. Facebook was never built on the
        pure SPA model we've become familiar with thanks to React. Even today,
        via RSC and recommending NextJS in the getting started docs, React has a
        strong preference for pushing local state to the server.
      </TypographyP>
      <TypographyP>
        It makes sense to view React as a server-first framework because it is
        so weak with client-side state next to its' competitors.
      </TypographyP>
      <TypographyP>
        Yet it can feel like we're stuck with it. Spending an inordinate amount
        of time demanding that it just. stop. rerendering. When it feels like
        {" "}
        <span className="font-bold">
          not
        </span>
        {" "}
        rerendering everything on every change should be the default
        behavior, as it is in every other framework
      </TypographyP>
      <TypographyP>
        With my own state management utility, I went down the path of exploring
        the idea of
        {" "}
        <TypographyLink href="https://github.com/eglove/store">
          using ref's to manipulate the DOM directly
        </TypographyLink>
        . With no
        performance optimizations, it's only a tad faster than Zustand. But
        within the same performance category. Even
        {" "}
        <TypographyLink href="https://github.com/cafreeman/signalis">
          Signalis
        </TypographyLink>
        , which puts a lot of
        work into bringing signals to React, has roughly the same performance as
        my own store and Zustand.
      </TypographyP>
      <TypographyP>
        State managers like Redux, Zustand, and others have put a lot of time
        and effort into trying to make React more performant with local state.
        Primarily by pulling that state outside of Reacts lifecycles and
        controlling its awareness of state changes. Doesn't that seem a bit odd?
        Like we've all been fighting the framework this whole time? This is a
        responsibility that seems more appropriate for React itself.
      </TypographyP>
      <TypographyP>
        useState and Context have never been good enough. Why are there still
        100 libraries and no built-in answer for true reactivity?
      </TypographyP>
      <Image
        alt="React is not reactive according to docs"
        src="https://ardent-monitor-908.convex.cloud/api/storage/1199559d-9af4-4b9d-b5d3-7626252d15fd"
      />
      <TypographyP>
        Legend State recently
        {" "}
        <TypographyLink href="https://www.legendapp.com/open-source/state/v3/">
          released version 3
        </TypographyLink>
        {" "}
        beta which introduces
        synchronization for local-first apps. Which is pretty appealing.
      </TypographyP>
      <TypographyP>
        What's more appealing is digging back into a blog from 2022 in which
        they claim
        {" "}
        <TypographyLink href="https://legendapp.com/open-source/legend-state/">
          it makes React truly reactive
        </TypographyLink>
        . I can't tell you how much
        these talking points appeal to me after experiencing working with
        SolidJS.
      </TypographyP>
      <TypographyP>
        One thing that stood out to me is the performance benchmarks. I'll
        assume that in 2022
        {" "}
        <TypographyLink href="https://github.com/krausest/js-framework-benchmark">
          krausest/js-framework-benchmark
        </TypographyLink>
        {" "}
        did not separate
        keyed and non-keyed frameworks. Because as of today, they are split into
        two categories. And in the "keyed" category Legend State does not
        outperform Zustand, Recoil, MobX or any other.
      </TypographyP>
      <TypographyP>
        As a non-keyed framework, however, it's approaching the performance of
        Angular and Vue. This is very interesting. That a state management
        library can theoretically improve the performance of React. Because
        ultimately, React still controls everything. No matter the optimization,
        it has to go through Reacts' reconciliation process, right?
      </TypographyP>
      <TypographyP>
        That's what I want to look at next, looking into how practical Legend
        State is, by pushing a real React app into non-keyed territory.
      </TypographyP>
      <TypographyP>
        At first glance, it looks like the "state-manager" is just providing a
        lot of utilities for React memoization. Their examples look like an
        unfair comparison in which the React example uses no memoization, and
        their example uses a
        {"<Memo/>"}
        {" "}
        component wrapper. But recreate it, and you realize how handy this
        component really is. Legend state is providing a standard library for
        React in a similar vein to Effect.ts providing a standard library for
        JavaScript.
      </TypographyP>
      <TypographyP>
        But I wouldn't recommend Effect due to its dogmatic functional roots.
        But maybe for React, it needs a dogmatic wrapper to help us get around
        the blatantly poor performance of React itself.
      </TypographyP>
    </LocalBlog>
  );
};

export const Route = createLazyFileRoute("/blog/forcing-react")({
  component: RouteComponent,
});
