import Link from "next/link";
import { TemplateItemsEditor } from "@/components/TemplateItemsEditor";
import { createTemplateAction } from "../actions";

export default function NewTemplatePage() {
  return (
    <div className="px-4 sm:px-6 py-6 max-w-lg">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">新增範本</h1>
        <Link
          href="/quotes/templates"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          取消
        </Link>
      </div>

      <TemplateItemsEditor action={createTemplateAction} />
    </div>
  );
}
