import { Image } from "../../../image.tsx";
import { MainLayout } from "../../layouts/main-layout.tsx";
import { Link } from "../../typography/link.tsx";

export const wtfIsVinextPublished = new Date("Feb. 25, 2026");

export const WtfIsVinext = async () => {
  return (
    <MainLayout
      title="WTF is vinext?"
      imageUrl="/images/blog/here-we-go-again.gif"
      classNames={{ main: "format format-invert mx-auto" }}
      description='Is vinext real innovation or just "vibe-coded slop"?'
    >
      <h1>WTF is vinext?</h1>
      <p>
        I love Cloudflare. I use it for all of my hosting. I give its blog a
        heavy bias in my newsletter. I let its runtime decide which frameworks I
        use. It's the only reason I have no Angular SSR projects despite wanting
        to try it out.
      </p>
      <p>
        Cloudflare is the reason I am rewriting this blog with Hono. It's
        entirely native to Cloudflare's edge runtime without adapters.
      </p>
      <p>
        But{" "}
        <Link isExternal={true} href="https://blog.cloudflare.com/vinext/">
          wtf is vinext
        </Link>
        ? The announcement post says it's a vibe coded rebuild of NextJS that
        deploys to Cloudflare Workers.
      </p>
      <Image
        width={498}
        height={498}
        alt="Ah shit, here we go again..."
        src="/images/blog/here-we-go-again.gif"
      />
      <p>
        We've seen{" "}
        <Link isExternal href="https://opennext.js.org/">
          OpenNext
        </Link>
        , we've seen{" "}
        <Link isExternal href="https://blitzjs.com/">
          Blitz.js
        </Link>
        . The wrappers, the abstractions, the fixes, the forks. All of them
        misunderstand the key philosophy of Next. The first thing you must
        consider before choosing it.{" "}
        <Link
          isExternal
          href="https://vercel.com/blog/framework-defined-infrastructure"
        >
          Framework-defined infrastructure
        </Link>
        .
      </p>
      <p>
        NextJS is a Vercel framework built by Vercel, for Vercel. Just as
        Amplify is an AWS framework. Just as Hydrogen is a Shopify framework.
        Just as Firebase is a Google Cloud framework.
      </p>
      <p>
        But you don't see the same wild attempts at making these something
        they're not. I understand that these things are good. They tempt you
        into using the platform. When you don't want to use the platform, you
        want the tool without the platform. But they are built to pull you into
        the platform.
      </p>
      <p>
        What doesn't make sense to me is wrapping, adapting, forking, and now
        vibing copies just to take these frameworks out of their natural
        habitat. It's a lot of work to no good end.
      </p>
      <p>
        If you're using Cloudflare you're dealing with light workers and CDN. It
        does exceptionally well with Vita SPA, Astro, and open React SSR
        frameworks like TanStack.
      </p>
      <p>
        If you're using a VPS on another provider you get the benefit of using
        more than just JavaScript. Spring, ASP.NET, Ruby on Rails, Django, Go,
        Rust, it's all open. Dozens of solutions that are just as good, if not
        better than NextJS.
      </p>
      <p>
        The only time choosing Next makes sense is to take advantage of{" "}
        <Link
          isExternal
          href="https://vercel.com/blog/framework-defined-infrastructure"
        >
          Framework-defined infrastructure
        </Link>
        .
      </p>
      <p>
        Now, instead of forking, we're vibe coding copies. But for all intents
        and purposes it's still a fork.
      </p>
      <p>
        What got my undies in a special sort of bunch is the surrounding dialog.
        Over on GitHub someone asked if this project is serious. A legitimate
        question any reasonable person would have. Immediately asking if this is
        meant to improve on NextJS API's, using it as a starting point. To be
        something unique. (Spoiler: The answer to that is no.)
      </p>
      <p>
        Seeing someone thinking the same as I am, I added another question.
        There are still issues with Angular SSR and TanStack Start on
        Cloudflare. Why do we need a new framework when these can be improved?
      </p>
      <p>
        This comment was marked as spam. Then from the viber in chief we get
        this comment.
      </p>
      <blockquote class="border-default bg-neutral-secondary-soft p-4">
        <p>
          I can say that with some authority. Yes, I'm the one who wrote most of
          this project, but I'm also the director in charge of the entire
          Cloudflare Workers org, almost 80+ people at this point. I'm not just
          an IC engineer who has to find time to justify continuing to work on
          this. I can literally put people on it, and I've already been talking
          to the team about how to do exactly that.
        </p>
        <footer>
          - <span>Steve Faulkner</span>,{" "}
          <cite>
            <a href="https://github.com/cloudflare/vinext/issues/21#issuecomment-3956481929">
              GitHub
            </a>
          </cite>
        </footer>
      </blockquote>
      <p>
        Listen, everyone has their space. Everyone is allowed to moderate their
        online spaces however they want. But we have to talk about how funny
        this paragraph is. I don't know how to respond to this without being
        mean. I'm not Jon Stewart. But "I'm the director in charge, I can
        literally put people on it." Well millennials, we made it. We're old and
        we still talk like this. Millennial core at its finest.
      </p>
      <blockquote class="border-default bg-neutral-secondary-soft p-4">
        <p>
          As far as Next.js's APIs: the current goal is to maintain parity with
          Next. I've definitely heard from people that there are things about
          Next they don't like, and I appreciate that perspective. But right
          now, diverging significantly from Next's API surface isn't really in
          scope. Obviously, we already me an exception with TPR, which is an
          alternative take on pre-rendering, but the bulk of the Next.js APIs
          we're trying to match 1:1. The reason is straightforward: we're trying
          to give customers who are having a hard time hosting Next on
          Cloudflare a better time.
        </p>
        <footer>
          - <span>Steve Faulkner</span>,{" "}
          <cite>
            <a href="https://github.com/cloudflare/vinext/issues/21#issuecomment-3956481929">
              GitHub
            </a>
          </cite>
        </footer>
      </blockquote>
      <p>
        Feature parity is a classic fork killer problem. Especially when the
        fork is not maintained by the internal team based on the same
        conversations. And it's never worth the maintenance. But considering the
        project is just vibed against forked tests, it's not built on a stable,
        reliable foundation to begin with. Cloudflare, please consider the depth
        and accuracy of the Microslop meme.
      </p>
      <p>
        Being labeled as spam by a millennial core director of literally 80+
        people at this point hurt by butt a lot. So I responded with an angrier
        attempt at getting my point on this thread. Not speaking to Mr. Director
        himself but anyone naive enough to place their bets on a vibe-fork.
      </p>
      <p>
        I should make it clear at this point that I do not consider myself to be
        in this little JavaScript web framework club. Which seems to be
        shrinking by the year. The drama and strange behavior is worse than that
        of YouTube influencers.
      </p>
      <p>Here comes Tanner Linsley in an odd defense:</p>
      <blockquote class="border-default bg-neutral-secondary-soft p-4">
        <p>I’m flattered to see the FanStack out in full force...</p>
        <footer>
          - <span>Tanner Linsley</span>,{" "}
          <cite>
            <a href="https://github.com/cloudflare/vinext/issues/21#issuecomment-3956638369">
              GitHub
            </a>
          </cite>
        </footer>
      </blockquote>
      <p>
        Excuse me? Where? This is the type of ego that really puts me in a bad
        headspace. And ironically faintly representative of how{" "}
        <Link
          isExternal
          href="https://harpers.org/archive/2026/03/childs-play-sam-kriss-ai-startup-roy-lee/"
        >
          out of touch and condescending a lot of tech has become
        </Link>
        .
      </p>
      <p>
        I like TanStack almost as much as I like Cloudflare. But I think Start
        is mediocre. Good enough, but mediocre. How's that for "FanStack"?
      </p>
      <p>
        It's interesting that Tanner is so deep in the JavaScript fandom that
        when he sees mere reference to a TanStack library he pictures a "fan"
        with the manic energy of a young woman at a Michael Jackson concert.
      </p>
      <Image
        width={400}
        height={217}
        caption="This is how people see me, right? -Tanner"
        src="/images/blog/michael-jackson-fan-on-knees.jpg"
        alt="Michael Jackson at concert, a fan on stage on her knees in front of him"
      />
      <p>
        Getting comments hidden, trying again, being put into a creepy little
        box, and then seeing the conversation locked is the perfect condition
        for an ADHD+C-PTSD brain to ruminate at 2 AM. And its also a way to miss
        feedback.
      </p>
      <blockquote class="border-default bg-neutral-secondary-soft p-4">
        <p>
          We're going to see where this project goes, what kind of feedback we
          get, and figure out where to take it from there. Hopefully that
          answers some of your questions.
        </p>
        <footer>
          - <span>Steve Faulkner</span>,{" "}
          <cite>
            <a href="https://github.com/cloudflare/vinext/issues/21#issuecomment-3956481929">
              GitHub
            </a>
          </cite>
        </footer>
      </blockquote>
      <blockquote class="border-default bg-neutral-secondary-soft p-4">
        <p>
          The last thing I'll say is this: if I could create a copy of Next in a
          week using only AI, you could probably build a framework that mirrors
          Next in the ways you like and solves the problems you're describing in
          even less time. Honestly you should just try. The hard parts of
          framework development has gotten a lot easier.
        </p>
        <footer>
          - <span>Steve Faulkner</span>,{" "}
          <cite>
            <a href="https://github.com/cloudflare/vinext/issues/21#issuecomment-3956481929">
              GitHub
            </a>
          </cite>
        </footer>
      </blockquote>
      <p>
        NextJS is a great framework on Vercel and a terrible one everywhere
        else. The answer isn't a vibe-fork.
      </p>
      <p>
        I would love to see Steve Faulkner put his money where is mouth is and
        try creating his own. I would love to see Cloudflare actually build
        their own framework designed from the ground up for the platform. Not
        take from someone else and maintain feature parity. They could have
        easily created another OpenNext for Cloudflare. It's not as if hosting
        Next on Cloudflare was impossible before. Instead, he chose the more
        complicated but more shiny and new path, a vibe-fork.
      </p>
      <p>
        Real innovation. A client-centric framework built for Workers and the
        Cloudflare platform would be great. Hono makes for a good server. Astro
        is extraordinary for static sites. But there is nothing Cloudflare
        centric like React.
      </p>
      <p>
        Is it necessary to create a new framework? No. React already works.
        React frameworks (I shall not name any for fear for being talked past
        and down to as a "fan") already exist.
      </p>
      <p>
        So what niche does vinext actually fulfill? Next syntax on workers?
        Already exists. With lack of open conversation and only "you're doing
        great" gold sticker comments allowed, we have to let our imaginations
        fly for a moment.
      </p>
      <p>
        It seems to me we have someone who sees a lot of people trying to put
        NextJS where it doesn't belong. This is common, I've seen it and dealt
        with it. It's been a problem since NextJS was added to the React docs.
        Before that it was a lowly niche framework for bloggers. When working
        with a Sitecore migration, speaking to the Sitecore team, I realized
        they were forced into it even though Sitecore already had a server side
        framework built on top of React. Including NextJS for no good reason
        only caused more problems, and never really solved any. They seemed
        baffled why they were being made to make it work to begin with.
      </p>
      <p>
        So this person who sees these problems decided to try to vibe code a
        solution for over $1,000 over a weekend. (Boasting as if that were a
        small amount of money, I might add.) They then jumped to the
        announcement Monday morning when they saw that ever so trustworthy AI
        spit out passing tests.
      </p>
      <p>
        It's exciting. I get it. I understand. But I'm nobodies fanboy. And I
        think this is{" "}
        <Link
          isExternal
          href="https://www.psychologytoday.com/us/blog/urban-survival/202507/the-emerging-problem-of-ai-psychosis"
        >
          frankly a little delusional
        </Link>
        .
      </p>
      <p>
        Will hobbyists use it? Yes. Will people complain that it's broken? Yes.
        Will a few of these literally 80+ people be made to fix it? Yes.
      </p>
      <p>
        And boy there we have the image of our industry in 2026. A weekend
        vibe-fork floating its way to the company blog and maintained with extra
        overhead over existing frameworks or even a new one.
      </p>
      <p>
        I'm tired. The JavaScript ecosystem has always been an oddball bunch
        inventing problems. But at least for a few periods in time it was fun.
        Today we see less innovation, less systems thinking, less problem
        solving. I look around and see people at the slot machines of AI turning
        silly weekend thoughts into pointless slop. I miss developers.
      </p>
    </MainLayout>
  );
};
