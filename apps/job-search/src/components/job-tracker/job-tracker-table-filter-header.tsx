import {
  applicationFormStore,
  setCompanyFilter,
  toggleIsShowingInterviewing,
  toggleIsShowingNoStatus,
  toggleIsShowingRejected,
} from "@/components/job-tracker/table-state.ts";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { XIcon } from "lucide-react";

export const JobTrackerTableFilterHeader = () => {
  const store = useStore(applicationFormStore);

  return (
    <div className="flex justify-between my-4">
      <div className="flex gap-4 items-center">
        <Label className="flex items-center gap-1">
          <Checkbox
            checked={store.isShowingNoStatus}
            onClick={toggleIsShowingNoStatus}
          />
          Show No Status
        </Label>
        <Label className="flex items-center gap-1">
          <Checkbox
            checked={store.isShowingInterviewing}
            onClick={toggleIsShowingInterviewing}
          />
          Show Interviewing
        </Label>
        <Label className="flex items-center gap-1">
          <Checkbox
            checked={store.isShowingRejected}
            onClick={toggleIsShowingRejected}
          />
          Show Rejected
        </Label>
        <div className="flex gap-1">
          <Input
            onChange={(event) => {
              setCompanyFilter(event.target.value);
            }}
            className="max-w-36"
            placeholder="Filter by Company"
            value={store.companyFilter}
          />
          <Button
            onClick={() => {
              setCompanyFilter("");
            }}
            size="icon"
            variant="outline"
          >
            <XIcon />
          </Button>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to="/upsert-application">Add Application</Link>
      </Button>
    </div>
  );
};
