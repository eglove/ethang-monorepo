import { Alert, Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import { dexieDatabase } from "../../dexie/dexie.ts";
import { focusStore } from "../../stores/focus-store.ts";

export const MedicationAlert = () => {
  const medicationLog = useLiveQuery(async () => {
    const results = await dexieDatabase.medicationLog
      .where({ id: "id" })
      .toArray();

    return results[0];
  });

  const isToday = isNil(medicationLog)
    ? null
    : DateTime.fromJSDate(medicationLog.date).hasSame(DateTime.now(), "day");

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      await focusStore.updateMedicationLog();
    },
  });

  return (
    <Alert color={true === isToday ? "success" : "danger"}>
      <div className="flex w-full items-center justify-between">
        <div>Medication Not Logged</div>
        <div>
          <Button
            isLoading={isPending}
            isDisabled={true === isToday}
            color={true === isToday ? "success" : "danger"}
            onPress={() => {
              mutate();
            }}
          >
            {true === isToday ? "Medication Logged" : "Log Medication"}
          </Button>
        </div>
      </div>
    </Alert>
  );
};
