import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string({ required_error: "Adres e-mail jest wymagany." }).email("Nieprawidłowy format adresu e-mail."),
  password: z.string({ required_error: "Hasło jest wymagane." }).min(1, "Hasło jest wymagane."),
});

export type LoginSchemaInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    email: z.string({ required_error: "Adres e-mail jest wymagany." }).email("Nieprawidłowy format adresu e-mail."),
    password: z.string({ required_error: "Hasło jest wymagane." }).min(8, "Hasło musi mieć co najmniej 8 znaków."),
  })
  .strict();

export type RegisterSchemaInput = z.infer<typeof RegisterSchema>;
