import type { Component } from "solid-js";

import logo from "./logo.svg";

const App: Component = () => {
  return (
    <div>
      <header>
        <img
          alt="logo"
          src={logo}
        />
        <p>
          Edit
          {" "}
          <code>
            src/App.tsx
          </code>
          {" "}
          and save to reload.
        </p>
        <a
          href="https://github.com/solidjs/solid"
          rel="noopener noreferrer"
          target="_blank"
        >
          Learn Solid
        </a>
      </header>
    </div>
  );
};

export default App;
