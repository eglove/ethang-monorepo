import { createLazyFileRoute } from "@tanstack/react-router";

const Event = () => {
  return (
    <div>
      <p>
        Event
      </p>
    </div>
  );
};

export const Route = createLazyFileRoute("/admin/event/")({
  component: Event,
});
