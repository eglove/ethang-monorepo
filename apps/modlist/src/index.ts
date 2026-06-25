import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import type { Database } from "./data/types.ts";

import {
  addConflictMutation,
  removeConflictMutation
} from "./data/mutations/conflicts.ts";
import {
  createModificationListMutation,
  deleteModificationListMutation,
  updateModificationListMutation
} from "./data/mutations/modlist.ts";
import {
  createModificationMutation,
  deleteModificationMutation,
  updateModificationMutation
} from "./data/mutations/mods.ts";
import {
  addPatchMutation,
  removePatchMutation
} from "./data/mutations/patches.ts";
import {
  addRequirementMutation,
  removeRequirementMutation
} from "./data/mutations/requirements.ts";
import {
  modificationListQuery,
  modificationListsQuery
} from "./data/queries/modlist.ts";
import {
  conflictQuery,
  conflictsQuery,
  modificationQuery,
  modsQuery,
  patchesQuery,
  patchQuery,
  requirementQuery,
  requirementsQuery
} from "./data/queries/mods.ts";
import {
  conflictTable,
  modificationListTable,
  modificationTable,
  patchTable,
  requirementTable
} from "./db/schema.ts";

// eslint-disable-next-line unicorn/no-anonymous-default-export
export default class extends WorkerEntrypoint<Env> {
  public async addConflict(parameters: { modAId: string; modBId: string }) {
    return addConflictMutation(this.getDb(), parameters);
  }

  public async addPatch(parameters: {
    modAId: string;
    modBId: string;
    patchedById: string;
  }) {
    return addPatchMutation(this.getDb(), parameters);
  }

  public async addRequirement(parameters: {
    parentModId: string;
    requiresModId: string;
  }) {
    return addRequirementMutation(this.getDb(), parameters);
  }

  public async conflict(parameters: { id: string }) {
    return conflictQuery(this.getDb(), parameters);
  }

  public async conflicts(parameters: { modListId: string }) {
    return conflictsQuery(this.getDb(), parameters);
  }

  public async createMod(parameters: {
    modListId: string;
    title: string;
    url: string;
  }) {
    return createModificationMutation(this.getDb(), parameters);
  }

  public async createModList(parameters: { name: string }) {
    return createModificationListMutation(this.getDb(), parameters);
  }

  public async deleteMod(parameters: { id: string }) {
    return deleteModificationMutation(this.getDb(), parameters);
  }

  public async deleteModList(parameters: { id: string }) {
    return deleteModificationListMutation(this.getDb(), parameters);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async fetch(): Promise<Response> {
    return new Response("OK", { status: 200 });
  }

  public async mod(parameters: { id: string }) {
    return modificationQuery(this.getDb(), parameters);
  }

  public async modList(parameters: { id: string }) {
    return modificationListQuery(this.getDb(), parameters);
  }

  public async modLists() {
    return modificationListsQuery(this.getDb());
  }

  public async mods(parameters: { modListId: string }) {
    return modsQuery(this.getDb(), parameters);
  }

  public async patch(parameters: { id: string }) {
    return patchQuery(this.getDb(), parameters);
  }

  public async patches(parameters: { modListId: string }) {
    return patchesQuery(this.getDb(), parameters);
  }

  public async removeConflict(parameters: { id: string }) {
    return removeConflictMutation(this.getDb(), parameters);
  }

  public async removePatch(parameters: { id: string }) {
    return removePatchMutation(this.getDb(), parameters);
  }

  public async removeRequirement(parameters: { id: string }) {
    return removeRequirementMutation(this.getDb(), parameters);
  }

  public async requirement(parameters: { id: string }) {
    return requirementQuery(this.getDb(), parameters);
  }

  public async requirements(parameters: { modListId: string }) {
    return requirementsQuery(this.getDb(), parameters);
  }

  public async updateMod(parameters: {
    id: string;
    title: string;
    url: string;
  }) {
    return updateModificationMutation(this.getDb(), parameters);
  }

  public async updateModList(parameters: { id: string; name: string }) {
    return updateModificationListMutation(this.getDb(), parameters);
  }

  private getDb(): Database {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return drizzle(this.env.ethang_modlist, {
      schema: {
        conflictTable,
        modListTable: modificationListTable,
        modTable: modificationTable,
        patchTable,
        requirementTable
      }
    });
  }
}
