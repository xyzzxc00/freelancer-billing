"use client";

import { useState } from "react";

type Validator = (value: string) => string;

export function useBlurErrors(validators: Record<string, Validator>) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    const validator = validators[name];
    if (!validator) return;
    const error = validator(value.trim());
    setErrors((prev) => ({ ...prev, [name]: error }));
  }

  return { fieldErrors: errors, onBlur };
}
