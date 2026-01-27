import { FocusTabs } from "../components/focus/focus-tabs.tsx";
import { MedicationAlert } from "../components/focus/medication-alert.tsx";

const RouteComponent = () => {
  return (
    <div className="m-4 grid gap-4">
      <MedicationAlert />
      <FocusTabs />
    </div>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
