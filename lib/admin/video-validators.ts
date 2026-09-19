import { z } from "zod";

const thumbnailUrlSchema = z
  .string()
  .max(1000)
  .refine((v) => v.startsWith("/") || v.startsWith("http"), "URL לא תקין")
  .nullable()
  .optional();

export const ContentPackageCreateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9\-]+$/, "Slug: a-z 0-9 - בלבד"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  thumbnailUrl: thumbnailUrlSchema,
  priceDisplay: z.string().min(1).max(50),
  displayOrder: z.number().int().min(0).max(999).default(0),
  published: z.boolean().default(false),
});
export type ContentPackageCreateInput = z.infer<typeof ContentPackageCreateSchema>;

export const ContentPackageUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  thumbnailUrl: thumbnailUrlSchema,
  priceDisplay: z.string().min(1).max(50),
  displayOrder: z.number().int().min(0).max(999).default(0),
  published: z.boolean().default(false),
});
export type ContentPackageUpdateInput = z.infer<typeof ContentPackageUpdateSchema>;

export const VideoCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  muxAssetId: z.string().min(1).max(255),
  muxPlaybackId: z.string().min(1).max(255),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  thumbnailUrl: thumbnailUrlSchema,
  thumbnailTime: z.number().min(0).nullable().optional(),
  displayOrder: z.number().int().min(0).max(999).default(0),
});
export type VideoCreateInput = z.infer<typeof VideoCreateSchema>;

export const VideoUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  muxAssetId: z.string().min(1).max(255),
  muxPlaybackId: z.string().min(1).max(255),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  thumbnailUrl: thumbnailUrlSchema,
  thumbnailTime: z.number().min(0).nullable().optional(),
  displayOrder: z.number().int().min(0).max(999).default(0),
});
export type VideoUpdateInput = z.infer<typeof VideoUpdateSchema>;

export const PackageVideoAssignSchema = z.object({
  packageId: z.string().uuid(),
  videoId: z.string().uuid(),
  displayOrder: z.number().int().min(0).max(999).default(0),
});
export type PackageVideoAssignInput = z.infer<typeof PackageVideoAssignSchema>;
