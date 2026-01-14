import { Divider, Link } from "@heroui/react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { MainLayout } from "../../components/main-layout.tsx";
import { TypographyH1 } from "../../components/typography/typography-h1.tsx";
import { TypographyH2 } from "../../components/typography/typography-h2.tsx";
import { TypographyH3 } from "../../components/typography/typography-h3.tsx";
import { TypographyP } from "../../components/typography/typography-p.tsx";
import { createHead } from "../../util/create-head.ts";

const RouteComponent = () => {
  return (
    <MainLayout>
      <TypographyH1>@ethang/eslint-config 24.3.0</TypographyH1>
      <TypographyP>
        Two new rules have been added to{" "}
        <Link
          isExternal
          href="https://github.com/eglove/ethang-monorepo/tree/master/packages/eslint-config/src"
        >
          my eslint config
        </Link>
        . The first from{" "}
        <Link isExternal href="https://typescript-eslint.io/">
          typescript-eslint
        </Link>{" "}
        is{" "}
        <Link
          isExternal
          href="https://typescript-eslint.io/rules/strict-void-return"
        >
          strict-void-return
        </Link>
        .
      </TypographyP>
      <TypographyH2 className="mt-4">strict-void-return</TypographyH2>
      <TypographyP>
        When functions return a value, the return type of void is considered
        valid. Or the other way, functions that return values are considered
        valid when used as callbacks where they should return void.
      </TypographyP>
      <TypographyP>For example, this is valid:</TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`function doSomething(): number {
    return 42;
}

function callMeMaybe(callback: () => void) {
    callback();
}

callMeMaybe(doSomething);`}</SyntaxHighlighter>
      <TypographyP>
        According to TypeScript,{" "}
        <Link
          isExternal
          href="https://github.com/Microsoft/TypeScript/wiki/FAQ#why-are-functions-returning-non-void-assignable-to-function-returning-void"
        >
          this is on purpose
        </Link>
        . Substituting a function that returns something for a function that
        doesn't is perfectly fine.
      </TypographyP>
      <TypographyP>
        But{" "}
        <Link
          isExternal
          href="https://typescript-eslint.io/rules/strict-void-return"
        >
          as the eslint rule points out
        </Link>
        , this can lead to subtle bugs and crashes.
      </TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`const getNothing: () => void = () => 2137;
const getString: () => string = () => 'Hello';
const maybeString = Math.random() > 0.1 ? getNothing() : getString();
if (maybeString) console.log(maybeString.toUpperCase()); // ❌ Crash if getNothing was called`}</SyntaxHighlighter>
      <TypographyP>
        So it is better to work explicitly with this rule on then it is to
        assume everything is fine without it.
      </TypographyP>
      <TypographyH3 className="mt-4">Monorepo Fixes</TypographyH3>
      <TypographyP>
        In my own monorepo, this rule led to two fixes. In my{" "}
        <Link
          isExternal
          href="https://github.com/eglove/ethang-monorepo/blob/master/packages/hooks/src/use-animation-interval.ts"
        >
          useAnimationInterval
        </Link>{" "}
        hook, I was unnecessarily returning the value of a requestAnimationFrame
        within a setTimeout. setTimeout expects void and therefore does not use
        the return value.
      </TypographyP>
      <TypographyP>Before:</TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`globalThis.setTimeout(() => {
  return globalThis.requestAnimationFrame(frame);
}, delay);`}</SyntaxHighlighter>
      <TypographyP>After:</TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`globalThis.setTimeout(() => {
  globalThis.requestAnimationFrame(frame);
}, delay);`}</SyntaxHighlighter>
      <TypographyP>
        In my{" "}
        <Link
          isExternal
          href="https://github.com/eglove/ethang-monorepo/blob/master/packages/hooks/src/use-event-listener.ts"
        >
          useEventListener
        </Link>{" "}
        hook I had lazily defined the listener return type to unknown. I have a
        bad habit of using overusing unknown. But as with setTimeout,
        addEventListener doesn't expect any return value and thus expects void.
      </TypographyP>
      <TypographyP>Before:</TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`listener: Type extends keyof WindowEventMap
    ? (this: Window, event_: WindowEventMap[Type]) => unknown
    : EventListenerOrEventListenerObject,`}</SyntaxHighlighter>
      <TypographyP>After:</TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`listener: Type extends keyof WindowEventMap
    ? (this: Window, event_: WindowEventMap[Type]) => void
    : EventListenerOrEventListenerObject,`}</SyntaxHighlighter>
      <TypographyP>
        As a side note, today I would generally avoid React hooks altogether in
        favor of a simpler external store pattern that I have developed into my{" "}
        <Link
          isExternal
          href="https://github.com/eglove/ethang-monorepo/tree/master/packages/store"
        >
          state management library
        </Link>
        .
      </TypographyP>
      <TypographyP>
        In the case of setting up an animation interval or event listener, I
        would not put these into hooks within the scope of a component. Instead
        I would manage them as such:
      </TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`const initialState = {
  count: 0,
  windowWidth: globalThis.innerWidth,
};

class EventStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  protected override onFirstSubscriber() {
    globalThis.addEventListener(
      "resize",
      () => {
        this.update((draft) => {
          draft.windowWidth = globalThis.innerWidth;
        });
      },
      {
        signal: this.cleanupSignal,
      },
    );

    animationInterval(1000, this.cleanupSignal, () => {
      this.update((draft) => {
        draft.count += 1;
      });
    });
  }
}

const eventStore = new EventStore();

const { count, windowWidth } = useStore(eventStore, (state) => {
  return {
    count: state.count,
    windowWidth: state.windowWidth,
  };
});`}</SyntaxHighlighter>
      <TypographyP>
        This uses cleanup signals to clean up events when React unmounts all
        subscribers and cleanly organizes all state and logic into an instance
        of a class. Rather than, often confusingly, the instance of a component.
        More than "global management," but fine-grained control.
      </TypographyP>
      <TypographyH2 className="mt-4">no-unnecessary-ref</TypographyH2>
      <TypographyP>
        The second rule added to my config is{" "}
        <Link
          isExternal
          href="https://www.eslint-react.xyz/docs/rules/no-unnecessary-use-ref"
        >
          no-unnecessary-ref
        </Link>{" "}
        from{" "}
        <Link isExternal href="https://www.eslint-react.xyz/">
          ESLint React
        </Link>
        . Simply, if a ref is only used within an effect, it does not need to be
        a ref. It can be defined within the effect.
      </TypographyP>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`import React, { useEffect, useRef } from "react";

function MyComponent() {
  const ref = useRef<number | null>(null);
  //    🟡 Avoid: Unnecessary use of \`useRef\`. Instead, co-locate the value inside the effect that uses it.

  useEffect(() => {
    ref.current = requestAnimationFrame(() => {});
    return () => {
      if (ref.current != null) {
        cancelAnimationFrame(ref.current);
      }
    };
  }, []);
}`}</SyntaxHighlighter>
      <Divider className="mt-4" />
      <SyntaxHighlighter
        style={nightOwl}
        language="typescript"
      >{`import React, { useEffect } from "react";

function MyComponent() {
  useEffect(() => {
    let ref: number | null = requestAnimationFrame(() => {});
    //  ✅ Good: Using a local variable to co-locate the value inside the effect that uses it.
    return () => {
      if (ref != null) {
        cancelAnimationFrame(ref);
      }
    };
  }, []);
}`}</SyntaxHighlighter>
      <TypographyH2 className="mt-4">Updated Rule Count</TypographyH2>
      <TypographyP>
        These new rules bring{" "}
        <Link
          isExternal
          href="https://github.com/eglove/ethang-monorepo/tree/master/packages/eslint-config/src"
        >
          my config
        </Link>{" "}
        up to a total of 773 base rules and 92 rules for React.
      </TypographyP>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
  head: createHead({
    description: "@ethang/eslint-config. Relentless. Unapologetic.",
    imageUrl: "/images/strict-void-return.png",
    title: "@ethang/eslint-config 24.3.0",
  }),
});
