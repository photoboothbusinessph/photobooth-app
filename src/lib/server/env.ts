import "server-only";
import { z } from "zod";

const requiredValue = z.string().trim().min(1);
const optionalValue = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), schema.optional());

const databaseEnvironmentSchema = z.object({
  MONGODB_URI: requiredValue,
  MONGODB_DB: requiredValue.default("dev"),
});

const cloudinaryEnvironmentSchema = z.object({
  CLOUDINARY_CLOUD_NAME: requiredValue,
  CLOUDINARY_API_KEY: requiredValue,
  CLOUDINARY_API_SECRET: requiredValue,
});

const applicationEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const superAdminBootstrapEnvironmentSchema = z.object({
  SUPER_ADMIN_EMAIL: optionalValue(z.email()),
  SUPER_ADMIN_PASSWORD: optionalValue(
    z.string().min(12).refine(
      (value) => !/^(?:replace|change|example|securepass)/i.test(value),
      "SUPER_ADMIN_PASSWORD must not be a placeholder.",
    ),
  ),
}).refine(
  (environment) => Boolean(environment.SUPER_ADMIN_EMAIL) === Boolean(environment.SUPER_ADMIN_PASSWORD),
  "Set both super-admin bootstrap variables or neither.",
);

function parseEnvironment<T>(schema: z.ZodType<T>): T {
  const result = schema.safeParse(process.env);
  if (!result.success) throw new Error("Server environment is not configured.");
  return result.data;
}

export function getDatabaseEnvironment() {
  return parseEnvironment(databaseEnvironmentSchema);
}

export function getCloudinaryEnvironment() {
  return parseEnvironment(cloudinaryEnvironmentSchema);
}

export function getApplicationEnvironment() {
  return parseEnvironment(applicationEnvironmentSchema);
}

export function getSuperAdminBootstrapEnvironment() {
  return parseEnvironment(superAdminBootstrapEnvironmentSchema);
}
