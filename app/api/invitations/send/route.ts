import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  const { invitationId } = await request.json();
  const { data: invitation } = await supabase.from("invitations").select("id,token,email,invitee_name,status,expires_at").eq("id", invitationId).eq("inviter_id", user.id).single();
  if (!invitation) return NextResponse.json({ error: "Invitación no encontrada." }, { status: 404 });
  if (invitation.status !== "pending" || new Date(invitation.expires_at) < new Date()) return NextResponse.json({ error: "La invitación ya no está disponible." }, { status: 409 });
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "El envío de correo todavía no está configurado." }, { status: 500 });
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const origin = new URL(request.url).origin;
  const destination = `/registro/paciente?token=${invitation.token}`;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(destination)}`;
  const { error } = await admin.auth.admin.inviteUserByEmail(invitation.email, { redirectTo, data: { full_name: invitation.invitee_name || "", invitation_token: invitation.token, requested_role: "paciente" } });
  if (!error) return NextResponse.json({ ok: true, mode: "invitation" });

  // Supabase no reenvía una invitación administrativa si el correo ya tiene
  // cuenta. En ese caso enviamos un acceso seguro que conserva el vínculo.
  const existingAccount = /already|registered|exists|been invited/i.test(error.message);
  if (existingAccount) {
    const { error: accessError } = await admin.auth.signInWithOtp({
      email: invitation.email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });
    if (!accessError) return NextResponse.json({ ok: true, mode: "secure_access" });
    return NextResponse.json({ error: `La solicitud ya está disponible dentro de Vicino, pero el correo no pudo enviarse: ${accessError.message}` }, { status: 400 });
  }

  const friendlyError = /rate limit/i.test(error.message)
    ? "Supabase alcanzó temporalmente el límite de correos. Espera unos minutos o comparte el enlace."
    : `Supabase no pudo enviar el correo: ${error.message}`;
  return NextResponse.json({ error: friendlyError }, { status: 400 });
}
