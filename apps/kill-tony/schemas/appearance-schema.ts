import z from "zod";

export const appearanceSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  isBucketPull: z.boolean(),
  isGoldenTicketWinner: z.boolean(),
  isGuest: z.boolean(),
  isHallOfFame: z.boolean(),
  isRegular: z.boolean(),
  name: z.string(),
});

export const appearancesSchema = z.array(appearanceSchema);

export const createAppearanceSchema = appearanceSchema.omit({ id: true });
