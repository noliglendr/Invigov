"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setNeedsVerification(false);
      const res = await api.post("/auth/login", data);

      // Save to localStorage for API calls
      localStorage.setItem("access_token", res.data.access_token);

      // Save to cookie for middleware authentication
      document.cookie = `access_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days

      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string } } };
      const detail = e.response?.data?.detail ?? "";

      // Check if the error is about unverified email
      if (e.response?.status === 403 && detail.toLowerCase().includes("verify")) {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email);
      } else {
        toastError(detail || "Invalid email or password.", "Sign in failed");
      }
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: unverifiedEmail });
      toastSuccess("Verification email sent. Please check your inbox.", "Email sent");
    } catch {
      toastError("Failed to resend verification email.", "Error");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Federal compliance automation for small businesses"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Create account
          </Link>
        </>
      }
    >
      {needsVerification && (
        <Alert variant="warning" className="mb-5">
          <div className="space-y-2">
            <p className="text-sm">
              Please verify your email before signing in. Check your inbox for the verification link.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendVerification}
              loading={resending}
            >
              Resend verification email
            </Button>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
