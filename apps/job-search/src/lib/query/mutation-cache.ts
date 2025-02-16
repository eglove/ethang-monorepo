import type { mutationMetaTypes } from "@/data/mutations.ts";

import { userStore } from "@/components/stores/user-store.ts";
import { deleteItem, upsert } from "@/lib/query/backup.ts";
import { MutationCache } from "@tanstack/react-query";
import get from "lodash/get";

export const mutationCache = new MutationCache({
  onSuccess: (data, variables, _, mutation) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const type = get(mutation, ["meta", "type"]) as
      | (typeof mutationMetaTypes)[keyof typeof mutationMetaTypes]
      | undefined;

    if (userStore.get().isSyncing) {
      switch (type) {
        case "addApplication": {
          upsert({ method: "POST", path: "/applications", variables });
          break;
        }

        case "addQa": {
          upsert({
            method: "POST",
            path: "/question-answers",
            variables,
          });
          break;
        }

        case "deleteApplication": {
          deleteItem(variables);
          break;
        }

        case "deleteQa": {
          deleteItem(variables);
          break;
        }

        case undefined: {
          break;
        }

        case "updateApplication": {
          upsert({ method: "PUT", path: "/applications", variables });
          break;
        }

        case "updateQa": {
          upsert({ method: "PUT", path: "/question-answers", variables });
          break;
        }
      }
    }

    return data;
  },
});
