import { createLazyFileRoute } from "@tanstack/react-router";

const HomeComponent = () => {
  return (
    <div className="bg-red-500 text-white">
      <h3>
        Welcome Home!
      </h3>
    </div>
  );
};

export const Route = createLazyFileRoute("/")({
  component: HomeComponent,
});
