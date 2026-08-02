"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPayment(invoiceId: string, formData: FormData) {
  const fecha = String(formData.get("fecha") || "");
  const monto = Number(formData.get("monto") || 0);
  if (!fecha || !monto) return { error: "Fecha y monto son obligatorios." };

  const supabase = await createClient();
  const { error } = await supabase.from("invoice_payments").insert({ invoice_id: invoiceId, fecha, monto });
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  return { error: null };
}

export async function deletePayment(invoiceId: string, paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoice_payments").delete().eq("id", paymentId);
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  return { error: null };
}
