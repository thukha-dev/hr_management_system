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
import { Eye, EyeOff } from "lucide-react";

const authenticate = async (
  employeeId: string,
  password: string,
  remember: boolean,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ employeeId, password }),
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
    const employeeId = formData.get("employeeId") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";

    const errors: FormState["errors"] = {};

    // Employee ID validation
    if (!employeeId) {
      errors.employeeId = [t("login.errors.employeeIdRequired")];
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
        values: { employeeId, password, remember },
      };
    }

    try {
      const result = await authenticate(employeeId, password, remember);

      if (result.success) {
        return {
          ...initialFormState,
          message: t("login.success"),
          values: { employeeId, password, remember },
        };
      } else {
        return {
          ...initialFormState,
          errors: { _form: [t("login.errors.invalidCredentials")] },
          values: { employeeId, password: "", remember },
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
        values: { employeeId, password: "", remember },
      };
    }
  };
};

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      setIsLoading(true);
      try {
        const result = await createLoginAction(t)(prevState, formData);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    initialFormState,
  );

  useEffect(() => {
    if (state.message === t("login.success")) {
      toast.success(t("login.success"));
      router.push("/dashboard");
    } else if (state.errors?._form?.[0]) {
      // Show error toast for form errors
      toast.error(state.errors._form[0]);
    }
  }, [state, router, t]);

  // Remove the useEffect that sets isLoading based on state.message

  return (
    <div className="flex flex-col items-center justify-center dark:bg-black p-6 sm:p-8 transition-colors duration-300">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-blue-400">MOT</span>
          <span className="text-slate-800 dark:text-white ml-2">
            {t("header.title")}
          </span>
        </h1>
      </div>
      <Card className="w-full max-w-md bg-white dark:bg-black shadow-lg rounded-lg overflow-hidden transition-colors duration-300">
        <CardHeader className="space-y-1 p-6 pb-2">
          <CardTitle className="text-2xl font-bold dark:bg-black dark:text-white">
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
                htmlFor="employeeId"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t("login.employeeId")}
              </Label>
              <Input
                id="employeeId"
                name="employeeId"
                type="text"
                placeholder={t("login.employeeIdPlaceholder")}
                required
                defaultValue={state.values?.employeeId}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-input/30 dark:text-white ${
                  state.errors?.employeeId
                    ? "border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {state.errors?.employeeId && (
                <p className="mt-1 text-sm text-red-500">
                  {state.errors.employeeId[0]}
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
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-input/30 dark:text-white ${
                    state.errors?.password
                      ? "border-red-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
