import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { TemplateItemsEditor } from "@/components/TemplateItemsEditor";
import { updateTemplateAction } from "../actions";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const template = await prisma.quoteTemplate.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!template) notFound();

  const updateAction = updateTemplateAction.bind(null, template.id);

  return (
    <div className="px-4 sm:px-6 py-6 mx-auto w-full max-w-xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-lg font-medium">編輯範本</h1>
        <Link
          href="/quotes/templates"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          取消
        </Link>
      </div>

      <TemplateItemsEditor
        action={updateAction}
        defaultName={template.name}
        defaultItems={template.items.map((item) => ({
          name: item.name,
          unitPrice: String(item.unitPrice),
          quantity: String(item.quantity),
        }))}
        submitLabel="儲存變更"
      />
    </div>
  );
}
