import { z } from "zod";

const emptyToUndefined = (val) => (typeof val === 'string' && val.trim() === '') ? undefined : val;

export const userRegistrationSchema = z.object({
  fullname: z
    .string()
    .min(3, "Fullname must be at least 3 characters long")
    .max(100, "Fullname must be at most 100 charcters long")
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Fullname can only contain letters and spaces",
    }),

  username: z.preprocess(emptyToUndefined, z.string()
    .min(3, {message: "Username must be at least 3 characters long"})
    .max(30, {message: "Username must be at most 30 characters long"})
    .regex(/^[a-zA-Z0-9_]+$/, {message: "Username can only contain letters, numbers, and underscores"}).optional()),

    email: z.preprocess(emptyToUndefined, z.string().email({message: "Invalid email address"}).optional()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/,
      {
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    ),

  confirmPassword: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/,
      {
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    ).optional(),

  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine(
      (val) => {
        const mobile = val.startsWith("91") ? val.slice(2) : val;
        return /^[6-9]\d{9}$/.test(mobile);
      },
      {
        message: "Invalid Indian mobile number",
      },
    )
    .transform((val) => {
      const mobile = val.startsWith("91") ? val.slice(2) : val;
      return `+91${mobile}`; // normalized format
    }),

  role: z.enum(["Driver", "Passenger"]),
  vehicleName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  yearOfExperience: z.number().optional(),
});

export const userLoginSchema = z.object({
    username: z.preprocess(emptyToUndefined, z.string()
    .min(3, {message: "Username must be at least 3 characters long"})
    .max(30, {message: "Username must be at most 30 characters long"})
    .regex(/^[a-zA-Z0-9_]+$/, {message: "Username can only contain letters, numbers, and underscores"}).optional()),

    email: z.preprocess(emptyToUndefined, z.string().email({message: "Invalid email address"}).optional()),

    password: z.string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/,
    {message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character"})
})

export const userUpdateSchema = z.object({
  fullname: z
    .string()
    .min(3, "Fullname must be at least 3 characters long")
    .max(100, "Fullname must be at most 100 charcters long")
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Fullname can only contain letters and spaces",
    })
    .optional(),

  email: z.string().email({ message: "Invalid email address" }).optional(),

  mobile: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine(
      (val) => {
        const mobile = val.startsWith("91") ? val.slice(2) : val;
        return /^[6-9]\d{9}$/.test(mobile);
      },
      {
        message: "Invalid Indian mobile number",
      },
    )
    .transform((val) => {
      const mobile = val.startsWith("91") ? val.slice(2) : val;
      return `+91${mobile}`; // normalized format
    })
    .optional(),
});
