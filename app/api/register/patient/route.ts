import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { token, name, email, phone, birthDate, password } = await request.json();
    if (!token || !name || !email || !phone || !birthDate || !password) return NextResponse.json({ error: "Completa todos los datos." }, { status: 400 });
    const supabase = await createClient();
    const destination = `/registro/paciente?token=${encodeURIComponent(token)}`;
    const redirectTo = `${new URL(request.url).origin}/auth/callback?next=${encodeURIComponent(destination)}`;
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const signup = await supabase.auth.signUp({ email: String(email).trim().toLowerCase(), password, options: { emailRedirectTo: redirectTo, data: { full_name: String(name).trim(), phone: String(phone).trim(), birth_date: birthDate, invitation_token: token, requested_role: "paciente" } } });
      if (signup.error) return NextResponse.json({ error: signup.error.message }, { status: 400 });
      if (signup.data.user && signup.data.user.identities?.length === 0) {
        const login = await supabase.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password });
        if (login.error) return NextResponse.json({ error: "Este correo ya tiene una cuenta. Usa la contraseña con la que normalmente entras a Vicino." }, { status: 409 });
        user = login.data.user;
      } else {
        user = signup.data.user;
        if (!signup.data.session) return NextResponse.json({ ok: true, requiresEmail: true });
      }
    } else {
      const update = await supabase.auth.updateUser({ password, data: { full_name: String(name).trim(), phone: String(phone).trim(), birth_date: birthDate, invitation_token: token, requested_role: "paciente" } });
      if (update.error) return NextResponse.json({ error: update.error.message }, { status: 400 });
    }
    if (!user) return NextResponse.json({ error: "No fue posible crear la sesión." }, { status: 400 });
    const profile = await supabase.from("profiles").update({ full_name: String(name).trim(), phone: String(phone).trim(), birth_date: birthDate }).eq("id", user.id);
    if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 400 });
    const link = await supabase.rpc("accept_patient_invitation", { invitation_token: token });
    if (link.error) return NextResponse.json({ error: link.error.message }, { status: 400 });
    return NextResponse.json({ ok: true, requiresEmail: false });
  } catch {
    return NextResponse.json({ error: "No pudimos completar el registro. Revisa tu conexión e inténtalo nuevamente." }, { status: 500 });
  }
}
