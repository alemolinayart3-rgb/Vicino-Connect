import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

async function masterClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.app_metadata?.vicino_master) return null;
  return supabase;
}

export async function GET() {
  const supabase = await masterClient();
  if (!supabase) return NextResponse.json({ error: "Acceso restringido." }, { status: 403 });
  const { data, error } = await supabase.from("organizations")
    .select("id,name,status,inactivity_days,suspended_at,suspension_reason,created_at,organization_memberships(count),care_assignments(count)")
    .order("created_at", { ascending: false });
  return NextResponse.json(error ? { error: error.message } : { organizations: data }, { status: error ? 400 : 200 });
}

export async function PATCH(request: Request) {
  const supabase = await masterClient();
  if (!supabase) return NextResponse.json({ error: "Acceso restringido." }, { status: 403 });
  const { id, status, reason } = await request.json();
  if (!id || !["active", "suspended", "cancelled"].includes(status))
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  const { error } = await supabase.from("organizations").update({
    status,
    suspended_at: status === "suspended" ? new Date().toISOString() : null,
    suspension_reason: status === "active" ? null : reason || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 400 : 200 });
}
