import { MainLayout } from "../layouts/main-layout.tsx";
import { P } from "../typography/p.tsx";

export const SignIn = async () => {
  return (
    <MainLayout>
      <script type="module" src="/scripts/sign-in/sign-in.js" />
      <form id="sign-in-form" class="mx-auto max-w-sm">
        <div class="mb-5">
          <label for="email">
            <span class="mb-2.5 block text-sm font-medium text-heading">
              Email
            </span>
            <input
              required
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="name@gmail.com"
              class="block w-full rounded-base border border-default-medium bg-neutral-secondary-medium px-3 py-2.5 text-sm text-heading shadow-xs placeholder:text-body focus:border-brand focus:ring-brand"
            />
          </label>
        </div>
        <div class="mb-5">
          <label for="password">
            <span class="mb-2.5 block text-sm font-medium text-heading">
              Password
            </span>
            <input
              required
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="block w-full rounded-base border border-default-medium bg-neutral-secondary-medium px-3 py-2.5 text-sm text-heading shadow-xs placeholder:text-body focus:border-brand focus:ring-brand"
            />
          </label>
        </div>
        <button
          type="submit"
          class="box-border rounded-base border border-transparent bg-brand px-4 py-2.5 text-sm leading-5 font-medium text-white shadow-xs hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium focus:outline-none"
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
