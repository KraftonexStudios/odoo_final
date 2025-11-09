"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/global/loader";
import { Eye, EyeOff } from "lucide-react";
import { useForgotPassword } from "@/hooks/authentication";
import OTPInput from "@/components/global/otp-input";

export default function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    initializeResetPasswordFlow,
    handleResetPassword,
    isInitializing,
    isVerifying,
    register,
    errors,
    showPassword,
    setShowPassword,
    reset,
    setValue,
    getValues,
  } = useForgotPassword();

  const [code, setCode] = useState<string>("");
  const [step, setStep] = useState<"email" | "verify">("email");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValue("code", code);
    handleResetPassword();
  };

  const handleInitializeReset = (e: React.FormEvent) => {
    e.preventDefault();
    const email = getValues("email");
    initializeResetPasswordFlow({ email });
    setStep("verify");
  };
  console.log(step);

  return (
    <form
      onSubmit={step === "email" ? handleInitializeReset : handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        {/* HEADER */}
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-2xl font-bold">
            {step === "email" ? "Forgot your password?" : "Verify your code"}
          </h1>
          <p className="text-sm text-muted-foreground text-balance">
            {step === "email"
              ? "Enter your email and set a new password to get a verification code."
              : "Enter the 6-digit code we sent to your email."}
          </p>
        </div>

        {/* STEP 1: EMAIL + PASSWORD */}
        {step === "email" && (
          <>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
                required
              />
            </Field>

            {/* New Password */}
            <Field>
              <FieldLabel htmlFor="password">New Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...register("password")}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>

            <Button type="submit" disabled={isInitializing} className="w-full">
              <Loader loading={isInitializing}>Send Verification Code</Loader>
            </Button>
          </>
        )}

        {/* STEP 2: OTP ONLY */}
        {step === "verify" && (
          <>
            <Field>
              <FieldLabel>Verification Code</FieldLabel>
              <OTPInput otp={code} setOtp={setCode} />
              {errors.code && (
                <FieldDescription className="text-red-500 text-sm">
                  {errors.code.message}
                </FieldDescription>
              )}
            </Field>

            <Button type="submit" disabled={isVerifying} className="w-full">
              <Loader loading={isVerifying}>Verify & Reset</Loader>
            </Button>

            <FieldDescription className="text-center text-sm mt-3">
              Didn’t receive a code?{" "}
              <button
                type="button"
                onClick={() => {
                  setCode("");
                  reset();
                }}
                className="underline underline-offset-4"
              >
                Try again
              </button>
            </FieldDescription>
          </>
        )}
      </FieldGroup>
    </form>
  );
}
