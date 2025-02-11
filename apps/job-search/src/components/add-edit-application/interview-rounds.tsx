import type { formSchema } from "@/components/add-edit-application/add-edit-application.tsx";
import type { z } from "zod";

import { FormInput } from "@/components/form/form-input.tsx";
import { Button } from "@/components/ui/button.tsx";
import map from "lodash/map.js";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

type InterviewRoundsProperties = Readonly<{
  form: UseFormReturn<z.infer<typeof formSchema>>;
}>;

export const InterviewRounds = ({ form }: InterviewRoundsProperties) => {
  const fieldArray = useFieldArray({
    control: form.control,
    name: "interviewRounds",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Interview Rounds</div>
        <Button
          onClick={() => {
            fieldArray.append({ date: "" });
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          Add Round
        </Button>
      </div>
      {map(fieldArray.fields, (field, index) => (
        <div className="flex gap-2" key={field.id}>
          <FormInput
            form={form}
            label={`Round ${index + 1} Date`}
            name={`interviewRounds.${index}.date`}
            type="date"
          />
          <Button
            onClick={() => {
              fieldArray.remove(index);
            }}
            className="self-center mt-[24px]"
            size="sm"
            type="button"
            variant="destructive"
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
};
