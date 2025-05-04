import { Link } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";

const About = () => {
  return (
    <div className="p-2">
      <Link href="/">Home</Link>
      <h3>Hello from About!</h3>
    </div>
  );
};

export const Route = createFileRoute("/about")({
  component: About,
});
