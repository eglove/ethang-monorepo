export const NavigationButton = async () => {
  return (
    <button
      type="button"
      aria-expanded="false"
      aria-controls="navbar-default"
      data-collapse-toggle="navbar-default"
      class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-base md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary"
    >
      <span class="sr-only">Open main menu</span>
      <svg
        width="24"
        fill="none"
        height="24"
        class="w-6 h-6"
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
