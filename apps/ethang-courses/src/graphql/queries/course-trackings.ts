import { and, desc, eq, lt } from "drizzle-orm";

import { courseTrackingTable } from "../../db/schema.ts";
import type { Database } from "../types.ts";

export const courseTrackingsQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      after?: string;
      first?: number;
      userId: string;
    }
  ) => {
    const whereClause = and(
      eq(courseTrackingTable.userId, parameters.userId),
      undefined === parameters.after
        ? undefined
        : lt(courseTrackingTable.id, parameters.after)
    );

    const trackings =
      undefined === parameters.first
        ? await database
            .select()
            .from(courseTrackingTable)
            .where(whereClause)
            .orderBy(desc(courseTrackingTable.id))
        : await database
            .select()
            .from(courseTrackingTable)
            .where(whereClause)
            .orderBy(desc(courseTrackingTable.id))
            .limit(parameters.first + 1);

    const hasNextPage =
      undefined === parameters.first
        ? false
        : trackings.length > parameters.first;
    const items =
      undefined === parameters.first
        ? trackings
        : trackings.slice(0, parameters.first);

    const edges = items.map((item) => {
      return {
        cursor: item.id,
        node: item
      };
    });

    return {
      edges,
      pageInfo: {
        endCursor: edges.at(-1)?.cursor ?? null,
        hasNextPage,
        hasPreviousPage: false,
        startCursor: edges.at(0)?.cursor ?? null
      }
    };
  };
};
