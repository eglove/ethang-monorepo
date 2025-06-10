import { OptimizedApp } from "./components/optimized-app.tsx";
import { TraditionalApp } from "./components/traditional-app.tsx";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {/*<style>*/}
      {/*  {`*/}
      {/*    body {*/}
      {/*      font-family: 'Inter', sans-serif;*/}
      {/*    }*/}
      {/*  `}*/}
      {/*</style>*/}
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">
        React Performance Comparison: Prop Drilling vs. ID Lookup
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <TraditionalApp />
        <OptimizedApp />
      </div>
    </div>
  );
};

export default App;
