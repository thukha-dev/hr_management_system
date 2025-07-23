"use client";

import React, { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormState, initialFormState } from "@/types/auth";
import { useTranslations } from "next-intl";

const authenticate = async (
  email: string,
  password: string,
  remember: boolean,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "login.errors.invalidCredentials",
      };
    }

    // Store user data in localStorage if remember me is checked
    if (remember && data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    } else if (data.user) {
      // For session storage
      sessionStorage.setItem("user", JSON.stringify(data.user));
    }

    return {
      success: true,
      message: "login.success",
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "login.errors.networkError",
    };
  }
};

const createLoginAction = (t: any) => {
  return async function loginAction(
    prevState = initialFormState,
    formData: FormData,
  ): Promise<FormState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";

    const errors: FormState["errors"] = {};

    // Email validation
    if (!email) {
      errors.email = [t("login.errors.emailRequired")];
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = [t("login.errors.invalidEmail")];
    }

    // Password validation
    if (!password) {
      errors.password = [t("login.errors.passwordRequired")];
    } else if (password.length < 6) {
      errors.password = [t("login.errors.passwordMinLength")];
    }

    if (Object.keys(errors).length > 0) {
      return {
        ...initialFormState,
        errors,
        values: { email, password, remember },
      };
    }

    try {
      const result = await authenticate(email, password, remember);

      if (result.success) {
        return {
          ...initialFormState,
          message: t("login.success"),
          values: { email, password, remember },
        };
      } else {
        return {
          ...initialFormState,
          errors: { _form: [t("login.errors.invalidCredentials")] },
          values: { email, password: "", remember },
        };
      }
    } catch (error) {
      return {
        ...prevState,
        errors: {
          _form: [
            error instanceof Error
              ? error.message
              : t("login.errors.unknownError"),
          ],
        },
        values: { email, password: "", remember },
      };
    }
  };
};

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [state, formAction] = useActionState(
    createLoginAction(t),
    initialFormState,
  );
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message === t("login.success")) {
      toast.success(t("login.success"));
      router.push("/dashboard");
    } else if (state.errors?._form?.[0]) {
      // Show error toast for form errors
      toast.error(state.errors._form[0]);
    }
  }, [state, router, t]);

  useEffect(() => {
    setIsLoading(
      !!state.message &&
        state.message !== "" &&
        state.message !== t("login.success"),
    );
  }, [state]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-6 sm:p-8 transition-colors duration-300">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-blue-600 dark:text-blue-400">MOT</span>
          <span className="text-slate-800 dark:text-slate-100 ml-2">
            HR Management System
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {t("login.subtitle")}
        </p>
      </div>
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden transition-colors duration-300">
        <CardHeader className="space-y-1 p-6 pb-2">
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("login.title")}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {state.errors?._form && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{state.errors._form[0]}</span>
            </div>
          )}

          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t("login.email")}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                required
                defaultValue={state.values?.email}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white ${
                  state.errors?.email
                    ? "border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {state.errors?.email && (
                <p className="mt-1 text-sm text-red-500">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t("login.password")}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t("login.forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                required
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white ${
                  state.errors?.password
                    ? "border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {state.errors?.password && (
                <p className="mt-1 text-sm text-red-500">
                  {state.errors.password[0]}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                defaultChecked={state.values?.remember}
              />
              <Label
                htmlFor="remember"
                className="text-sm text-slate-700 dark:text-slate-300"
              >
                {t("login.rememberMe")}
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("login.signingIn")}
                </>
              ) : (
                t("login.signIn")
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-300 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {t("login.orContinueWith")}
              </span>
            </div>
          </div>
          {/* <div className="grid grid-cols-2 gap-3"> */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </Button>
            {/* <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => signIn("github")}
              className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
              </svg>
              <span>GitHub</span>
            </Button> */}
          </div>
          <div className="mt-4 text-center text-sm">
            {t("login.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t("login.signUp")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
