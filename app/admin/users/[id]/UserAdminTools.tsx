"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Save, Trash2 } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { Btn, Card, Field, Input } from "@/components/admin/ui/primitives";
import { deleteUserAction, updateUserAction } from "../actions";

export function UserAdminTools({
  user,
}: {
  user: { id: string; email: string; firstName: string; lastName: string; phone: string | null; institution: string | null };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
    institution: user.institution ?? "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card
      title="ניהול המשתמש"
      actions={
        !editing && (
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> עריכת פרטים
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-rose-600 hover:text-rose-700">
              <Trash2 className="h-3.5 w-3.5" /> מחיקת משתמש
            </Btn>
          </div>
        )
      }
    >
      {editing && (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await updateUserAction(user.id, {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone || null,
                institution: form.institution || null,
              });
              if (!res.ok) {
                toast.error(res.error ?? "שגיאה");
                return;
              }
              toast.success("הפרטים עודכנו");
              setEditing(false);
              router.refresh();
            });
          }}
        >
          <Field label="שם פרטי">
            <Input value={form.firstName} onChange={set("firstName")} required />
          </Field>
          <Field label="שם משפחה">
            <Input value={form.lastName} onChange={set("lastName")} required />
          </Field>
          <Field label="טלפון">
            <Input value={form.phone} onChange={set("phone")} dir="ltr" />
          </Field>
          <Field label="מוסד לימודים">
            <Input value={form.institution} onChange={set("institution")} />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <Btn type="submit" variant="primary" size="sm" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              שמור
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}>
              ביטול
            </Btn>
          </div>
        </form>
      )}

      <DangerConfirm
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          const res = await deleteUserAction(user.id);
          if (!res.ok) throw new Error(res.error ?? "המחיקה נכשלה");
          toast.success("המשתמש נמחק");
          router.push("/admin/users");
          router.refresh();
        }}
        itemLabel={`${user.firstName} ${user.lastName} (${user.email})`}
        confirmText={user.email}
        title="מחיקת משתמש"
        description="המשתמש, הרכישות שלו, ההתקדמות וכל היסטוריית הפעילות יימחקו לצמיתות. אם רק רוצים למנוע כניסה — עדיף לחסום אותו."
      />
    </Card>
  );
}
