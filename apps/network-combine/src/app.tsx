import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

import reactLogo from "./assets/react.svg";

export const App = () => {
  const [greetMessage, setGreetMessage] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMessage(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img alt="Vite logo" className="logo vite" src="/vite.svg" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img alt="Tauri logo" className="logo tauri" src="/tauri.svg" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img alt="React logo" className="logo react" src={reactLogo} />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
        className="row"
      >
        <input
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
          id="greet-input"
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMessage}</p>
    </main>
  );
};
