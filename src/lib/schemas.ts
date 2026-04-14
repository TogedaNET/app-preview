import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const verifySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).optional(),
  code: z.string().length(6),
});

export const resendSchema = z.object({
  email: z.string().email(),
});

export const googleAuthSchema = z.object({
  code: z.string().min(1, "Missing authorization code"),
});

export const refreshSchema = z.object({
  username: z.string().min(1),
});

export const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.string().min(1),
  birthDate: z.string().min(1),
  visibleGender: z.boolean(),
  occupation: z.string(),
  phoneNumber: z.string(),
  profilePhotos: z.array(z.string()),
  subToEmail: z.boolean(),
  referralCodeUsed: z.string(),
  location: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  interests: z.array(
    z.object({
      name: z.string(),
      icon: z.string(),
      category: z.string(),
    }),
  ),
});

// ── Actions ─────────────────────────────────────────────────────────────────────

export const joinSchema = z.object({
  type: z.enum(["event", "club"]),
  id: z.string().min(1),
});

export const leaveSchema = z.object({
  type: z.enum(["event", "club"]),
  id: z.string().min(1),
});

export const cancelJoinSchema = z.object({
  type: z.enum(["event", "club"]).optional(),
  id: z.string().min(1),
});

export const confirmArrivalSchema = z.object({
  postId: z.string().min(1),
});

// ── Query params ────────────────────────────────────────────────────────────────

export const postIdParamSchema = z.object({
  postId: z.string().min(1),
});

export const clubIdParamSchema = z.object({
  clubId: z.string().min(1),
});
