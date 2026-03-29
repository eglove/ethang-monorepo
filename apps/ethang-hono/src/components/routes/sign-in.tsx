import { globalStore } from "../../stores/global-store-properties.ts";
import { DEPLOY_TIME } from "../../utilities/deploy-info.ts";
import { MainLayout } from "../layouts/main-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { P } from "../typography/p.tsx";

export const SignIn = async () => {
  const { pathname } = globalStore;

  return (
    <MainLayout pathname={pathname} updatedAt={DEPLOY_TIME}>
      <H1>Sign In</H1>
      <form
        id="sign-in-form"
        class="mx-auto max-w-sm"
        data-script="components/routes/sign-in"
      >
        <div class="mb-5">
          <label for="email">
            <span class="mb-2.5 block text-sm font-medium text-slate-100">
              Email
            </span>
            <input
              required
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="name@gmail.com"
              class="block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 transition-colors placeholder:text-slate-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/15 focus:outline-none"
            />
          </label>
        </div>
        <div class="mb-5">
          <label for="password">
            <span class="mb-2.5 block text-sm font-medium text-slate-100">
              Password
            </span>
            <input
              required
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="block w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 transition-colors placeholder:text-slate-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/15 focus:outline-none"
            />
          </label>
        </div>
        <button
          type="submit"
          id="sign-in-button"
          class="box-border w-full cursor-pointer rounded-lg border border-sky-300/30 bg-sky-300/10 px-4 py-2.5 text-sm leading-5 font-medium text-sky-300 transition-colors hover:border-sky-300/50 hover:bg-sky-300/20 focus:ring-4 focus:ring-sky-300/30 focus:outline-none disabled:cursor-default disabled:opacity-40"
        >
          Submit
        </button>
      </form>
      <div class="mx-auto mt-2 max-w-sm">
        <P id="sign-in-error" className="text-red-400"></P>
      </div>
    </MainLayout>
  );
};
