import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog.tsx";
import { EyeIcon } from "lucide-react";

import type { api } from "../../../convex/_generated/api";

type CertificationDetailsProperties = {
  certification: (typeof api.certifications.getAll._returnType)[0];
};

export const CertificationDetails = ({
  certification,
}: Readonly<CertificationDetailsProperties>) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label="View Details"
          size="sm"
          variant="ghost"
        >
          <EyeIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <TypographyH2>
            {certification.name}
          </TypographyH2>
        </DialogHeader>
        <DialogDescription>
          {certification.description}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
