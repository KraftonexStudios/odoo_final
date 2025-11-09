"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { onSignupUser, updateClerkUserMetadata } from "@/actions/auth.action";
import { useMutation } from "@tanstack/react-query";
import { SignUpSchema } from "@/components/forms/sign-up/schema";
import { SignInSchema } from "@/components/forms/sign-in/schema";
import { ResetPasswordSchema } from "@/components/forms/reset-pass/schema";

export const useSignUpMethod = () => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const {
    formState: { errors },
    register,
    handleSubmit,
    getValues,
  } = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    mode: "onTouched",
  });

  const router = useRouter();

  const [verifying, setVerifying] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const onGenerateCode = async ({
    email,
    password,
    firstName,
    lastName,
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifying(true);
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        const { firstName, emailAddress, createdUserId } = signUpAttempt;

        if (!emailAddress || !createdUserId || !firstName) {
          return;
        }

        setVerifying(false);

        await onSignupUser({
          firstName,
          lastName: getValues("lastName"),
          email: emailAddress,
          clerkUserId: createdUserId,
          role: "TEAM_MEMBER",
        });

        await updateClerkUserMetadata(createdUserId, "TEAM_MEMBER");

        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              return;
            }
            router.push("/dashboard");
          },
        });
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const onSignUpUser = handleSubmit(() => handleVerifyCode(code));

  return {
    onGenerateCode,
    onSignUpUser,
    register,
    loading,
    errors,
    verifying,
    code,
    setCode,
    getValues,
  };
};

export const useSignInMethod = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    mode: "onBlur",
  });

  const onClerkAuth = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    if (!isLoaded) {
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              return;
            }

            router.push("/dashboard");
          },
        });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  const { mutate: InitialteLoginFlow, isPending } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      onClerkAuth({ email, password }),
  });

  const onAuthenticateUser = handleSubmit((values) =>
    InitialteLoginFlow(values)
  );

  return {
    onAuthenticateUser,
    isPending,
    register,
    errors,
  };
};

export const useForgotPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const {
    formState: { errors },
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
  } = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "onBlur",
  });

  const InitializeResetPasswordFlow = async ({ email }: { email: string }) => {
    if (!signIn) {
      throw new Error("SignIn not loaded");
    }

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      return true; // Return success indicator
    } catch (err: any) {
      console.error("error", err.errors?.[0]?.longMessage || err.message);
      throw err; // Re-throw to trigger onError
    }
  };

  const ResetPassword = async ({
    code,
    password,
  }: {
    code: string;
    password: string;
  }) => {
    if (!isLoaded || !signIn) {
      throw new Error("SignIn not loaded");
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      // Check if 2FA is required
      if (result.status === "complete") {
        setActive({
          session: result.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              return;
            }
            router.push("/");
          },
        });
      } else {
        console.log(result);
      }

      return result;
    } catch (err: any) {
      console.error("error", err.errors?.[0]?.longMessage || err.message);
      throw err; // Re-throw to trigger onError
    }
  };

  const { mutate: initializeResetPasswordFlow, isPending: isInitializing } =
    useMutation({
      mutationFn: InitializeResetPasswordFlow,
      onError: (error) => {
        console.error("Failed to initialize reset password flow:", error);
      },
    });

  const { mutate: handleVerifyCode, isPending: isVerifying } = useMutation({
    mutationFn: () =>
      ResetPassword({ code: getValues().code, password: getValues().password }),
    onError: (error) => {
      console.error("Failed to verify code:", error);
    },
  });

  const handleResetPassword = handleSubmit(() => handleVerifyCode());

  return {
    initializeResetPasswordFlow,
    handleResetPassword,
    isInitializing,
    isVerifying,
    showPassword,
    setShowPassword,
    register,
    errors,
    reset,
    setValue,
    getValues,
  };
};
