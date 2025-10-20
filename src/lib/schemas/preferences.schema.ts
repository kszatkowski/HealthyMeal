import { z } from "zod";

export const PreferenceTypeEnum = z.enum(["like", "dislike", "allergen"]);

export const PreferenceListQuerySchema = z
  .object({
    type: PreferenceTypeEnum.optional(),
  })
  .strict();

export type PreferenceListQueryInput = z.infer<typeof PreferenceListQuerySchema>;
