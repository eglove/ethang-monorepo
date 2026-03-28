import { globalStore } from "../../stores/global-store-properties.ts";
import { DEPLOY_TIME } from "../../utilities/deploy-info.ts";
import { registerScript } from "../../utilities/register-script.ts";
import { MainLayout } from "../layouts/main-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { P } from "../typography/p.tsx";

export const SignIn = async () => {
  registerScript(globalStore, "components/routes/sign-in");

  return (
    <MainLayout updatedAt={DEPLOY_TIME}>
      <H1>Sign In</H1>
      <form id="sign-in-form" class="mx-auto max-w-sm">
        <div class="mb-5">
          <label for="email">
            <span class="text-heading mb-2.5 block text-sm font-medium">
              Email
            </span>
            <input
              required
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="name@gmail.com"
              class="rounded-base border-default-medium bg-neutral-secondary-medium text-heading placeholder:text-body focus:border-brand focus:ring-brand block w-full border px-3 py-2.5 text-sm shadow-xs"
            />
          </label>
        </div>
        <div class="mb-5">
          <label for="password">
            <span class="text-heading mb-2.5 block text-sm font-medium">
              Password
            </span>
            <input
              required
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="rounded-base border-default-medium bg-neutral-secondary-medium text-heading placeholder:text-body focus:border-brand focus:ring-brand block w-full border px-3 py-2.5 text-sm shadow-xs"
            />
          </label>
        </div>
        <button
          type="submit"
          id="sign-in-button"
          class="rounded-base bg-brand hover:bg-brand-strong focus:ring-brand-medium disabled:bg-fg-disabled box-border cursor-pointer border border-transparent px-4 py-2.5 text-sm leading-5 font-medium text-white shadow-xs focus:ring-4 focus:outline-none disabled:cursor-default"
        >
          Submit
        </button>
      </form>
      <div class="mx-auto mt-2 max-w-sm">
        <P id="sign-in-error" className="text-danger"></P>
      </div>
    </MainLayout>
  );
};
