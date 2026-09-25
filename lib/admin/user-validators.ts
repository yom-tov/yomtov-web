"use strict";

import { z } from "zod";

export const UserRegistrationSchema = z
  .object({
    email: z.string().email("כתובת מייל לא תקינה"),
    password: z
      .string()
      .min(8, "סיסמה חייבת להכיל לפחות 8 תווים")
      .refine(
        (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
        "סיסמה חייבת להכיל לפחות אות אחת וספרה אחת",
      ),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "שם פרטי נדרש").max(100),
    lastName: z.string().min(1, "שם משפחה נדרש").max(100),
    phone: z
      .string()
      .max(30)
      .refine(
        (v) => !v || /^0\d{8,9}$/.test(v.replace(/[-\s]/g, "")),
        "מספר טלפון לא תקין",
      )
      .optional()
      .or(z.literal("")),
    institution: z.string().max(200).optional().or(z.literal("")),
    agreedToTerms: z.literal("on", {
      errorMap: () => ({ message: "יש לאשר את תנאי השימוש" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirmPassword"],
  });

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;

export const UserLoginSchema = z.object({
  email: z.string().email("כתובת מייל לא תקינה"),
  password: z.string().min(1, "יש להזין סיסמה"),
});

export type UserLoginInput = z.infer<typeof UserLoginSchema>;

export const PurchaseGrantSchema = z.object({
  userId: z.string().uuid(),
  packageId: z.string().uuid(),
  expiresAt: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().max(50).optional().or(z.literal("")),
  paymentNote: z.string().max(500).optional().or(z.literal("")),
  adminNotes: z.string().max(500).optional().or(z.literal("")),
});

export type PurchaseGrantInput = z.infer<typeof PurchaseGrantSchema>;

export const UserUpdateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal("")),
  institution: z.string().max(200).optional().or(z.literal("")),
});

export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
