"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/FormError";
import type { ActionResult } from "@/lib/action-state";

export function CategoryForm({
  action,
  placeholder,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  placeholder: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 mb-6">
      <div className="flex gap-2">
        <input
          name="name"
          required
          placeholder={placeholder}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background flex-1"
        />
        <SubmitButton className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium">
          新增
        </SubmitButton>
      </div>
      <FormError message={state?.error} />
    </form>
  );
}
