"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

const schema = z
  .object({
    workspace_name: z
      .string()
      .min(1, "Workspace name is required")
      .min(3, "Workspace name must be at least 3 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password cannot be longer than 72 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/auth/register", {
        workspace_name: data.workspace_name,
        email: data.email,
        password: data.password,
      });

      // Show verification prompt instead of auto-login
      setRegisteredEmail(data.email);
    } catch (err: unknown) {
      const e = err as {
        response?: {
          data?: {
            detail?: string | Array<{ msg: string; loc: string[] }>
          }
        }
      };

      let errorMessage = "Registration failed. Please try again.";

      if (e.response?.data?.detail) {
        if (typeof e.response.data.detail === "string") {
          errorMessage = e.response.data.detail;
        } else if (Array.isArray(e.response.data.detail)) {
          errorMessage = e.response.data.detail
            .map((err) => err.msg)
            .join(", ");
        }
      }

      toastError(errorMessage, "Account creation failed");
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: registeredEmail });
      toastSuccess("Verification email sent. Please check your inbox.", "Email sent");
    } catch {
      toastError("Failed to resend verification email. Please try again.", "Error");
    } finally {
      setResending(false);
    }
  };

  // Show email verification prompt after successful registration
  if (registeredEmail) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent a verification link to complete your registration"
        footer={
          <>
            Already verified?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </>
        }
      >
        <div className="text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
            <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-700">
              We sent a verification email to
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{registeredEmail}</p>
          </div>
          <p className="text-xs text-gray-500">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>
          <div className="pt-2 space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResendVerification}
              loading={resending}
            >
              Resend verification email
            </Button>
            <p className="text-xs text-gray-400">
              Didn&apos;t receive it? Check your spam folder.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your federal contracting journey with INVIGOV"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Workspace name"
          type="text"
          autoComplete="organization"
          placeholder="Your company name"
          error={errors.workspace_name?.message}
          {...register("workspace_name")}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          hint="Must include uppercase letter and number"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>

        <p className="text-xs text-center text-gray-400">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
