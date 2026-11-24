import { z } from "zod";
import { ORDER_STATUSES, PLAN_IDS, PRODUCT_IMAGE_TYPES, SUBSCRIPTION_STATUSES } from "./constants";

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} caractères`)
    .optional()
    .transform((v) => (v ? v : null));

export const emailSchema = z
  .string()
  .trim()
  .min(1, "L'email est requis")
  .email("Adresse email invalide")
  .max(255)
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(72, "Le mot de passe est trop long")
  .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Votre nom est requis").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    companyName: z.string().trim().min(2, "Le nom de l'entreprise est requis").max(160),
    sector: z.string().trim().min(2, "Le secteur est requis").max(80),
    phone: z.string().trim().min(6, "Le téléphone est requis").max(30),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Vous devez accepter les conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export const companySettingsSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(160),
  sector: optionalText(80),
  description: optionalText(1000),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: z.union([emailSchema, z.literal("")]).optional().transform((v) => (v ? v : null)),
  address: optionalText(300),
  city: optionalText(80),
  ice: optionalText(30),
  website: optionalText(200),
});
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Le nom est requis").max(80),
  description: optionalText(300),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Le nom du produit est requis").max(180),
  sku: z
    .string()
    .trim()
    .min(1, "La référence est requise")
    .max(64)
    .regex(/^[A-Za-z0-9._\-/]+$/, "Référence invalide (lettres, chiffres, . _ - /)"),
  categoryId: z.string().uuid().nullable().optional(),
  description: optionalText(2000),
  basePrice: z
    .string()
    .trim()
    .min(1, "Le prix est requis")
    .refine((v) => /^\d+([.,]\d{1,2})?$/.test(v.replace(/\s/g, "")), "Prix invalide (ex: 1250.00)"),
  minOrderQty: z.coerce.number().int().min(1, "Minimum 1").max(100000),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});
export type ProductInput = z.infer<typeof productSchema>;

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  companyName: z.string().trim().min(2, "Le nom de l'entreprise est requis").max(160),
  contactName: optionalText(120),
  email: emailSchema,
  phone: optionalText(30),
  city: optionalText(80),
  address: optionalText(300),
  ice: optionalText(30),
  groupId: z.string().uuid().nullable().optional(),
  notes: optionalText(1000),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const customerStatusSchema = z.object({
  customerId: z.string().uuid(),
  status: z.enum(["invited", "pending", "active", "suspended"]),
});

export const inviteAcceptSchema = z
  .object({
    token: z.string().min(10),
    fullName: z.string().trim().min(2, "Votre nom est requis").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export const groupPriceSchema = z.object({
  productId: z.string().uuid(),
  groupId: z.string().uuid(),
  price: z.string().trim().min(1, "Prix requis"),
});

export const customerPriceSchema = z.object({
  productId: z.string().uuid(),
  customerId: z.string().uuid(),
  price: z.string().trim().min(1, "Prix requis"),
});

export const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(100000),
      })
    )
    .min(1, "Votre panier est vide")
    .max(100, "Trop d'articles dans la commande"),
  notes: z.string().trim().max(1000).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const subscriptionSchema = z.object({
  companyId: z.string().uuid(),
  plan: z.enum(PLAN_IDS),
  status: z.enum(SUBSCRIPTION_STATUSES),
  expiresAt: z.string().min(1, "La date d'expiration est requise"),
});

export const companyStatusSchema = z.object({
  companyId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

export const imageFileSchema = z
  .custom<File>((v) => typeof File !== "undefined" && v instanceof File, "Fichier requis")
  .refine((file) => file.size > 0, "Fichier vide")
  .refine((file) => file.size <= 2 * 1024 * 1024, "L'image ne doit pas dépasser 2 Mo")
  .refine((file) => PRODUCT_IMAGE_TYPES.includes(file.type), "Format accepté : JPG, PNG ou WebP");

export const csvRowSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(180),
  sku: z
    .string()
    .trim()
    .min(1, "Référence requise")
    .max(64)
    .regex(/^[A-Za-z0-9._\-/]+$/, "Référence invalide"),
  category: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  base_price: z.string().trim().min(1, "Prix requis"),
  min_order_qty: z.string().trim().optional(),
  is_active: z.string().trim().optional(),
});
export type CsvRowInput = z.infer<typeof csvRowSchema>;
