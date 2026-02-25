export const NavigationButton = async () => {
  return (
    <button
      type="button"
      aria-expanded="false"
      aria-controls="navbar-default"
      data-collapse-toggle="navbar-default"
      class="inline-flex h-10 w-10 items-center justify-center rounded-base p-2 text-sm text-body hover:bg-neutral-secondary-soft hover:text-heading focus:ring-2 focus:ring-neutral-tertiary focus:outline-none md:hidden"
    >
      <span class="sr-only">Open main menu</span>
      <svg
        width="24"
        fill="none"
        height="24"
        class="h-6 w-6"
        aria-hidden="true"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-width="2"
          stroke="currentColor"
          stroke-linecap="round"
          d="M5 7h14M5 12h14M5 17h14"
        />
      </svg>
    </button>
  );
};
