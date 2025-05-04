import { Link } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";

const Index = () => {
  return (
    <div className="p-2">
      <Link href="/about">About</Link>
      <h3>Welcome Home!</h3>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
