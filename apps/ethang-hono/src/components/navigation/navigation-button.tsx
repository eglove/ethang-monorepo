export const NavigationButton = async () => {
  return (
    <button
      type="button"
      aria-expanded="false"
      aria-controls="navbar-default"
      class="inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-slate-100 focus:ring-2 focus:ring-slate-400/30 focus:outline-none md:hidden"
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
