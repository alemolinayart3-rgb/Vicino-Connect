"use client";
import { Suspense,useEffect,useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
type Details={invitee_name:string|null;professional_name:string;expires_at:string;status:string};
function PatientRegistration(){
 const token=useSearchParams().get('token');
 const [invite,setInvite]=useState<Details|null>(null),[loading,setLoading]=useState(true),[invalid,setInvalid]=useState(''),[sent,setSent]=useState(false),[invitedUser,setInvitedUser]=useState(false),[submitting,setSubmitting]=useState(false),[error,setError]=useState('');
 const [form,setForm]=useState({name:'',email:'',phone:'',birthDate:'',password:''});
 useEffect(()=>{(async()=>{if(!token){setInvalid('Este enlace no contiene una invitación. Solicita uno nuevo a tu psicólogo.');setLoading(false);return}const client=createClient();const {data,error}=await client.rpc('invitation_public_details',{invitation_token:token});const d=data?.[0] as Details|undefined;if(error||!d){setInvalid('No encontramos esta invitación. Revisa que hayas copiado el enlace completo.');setLoading(false);return}if(d.status!=='pending'||new Date(d.expires_at)<new Date()){setInvalid(d.status==='accepted'?'Esta invitación ya fue utilizada.':'Esta invitación ya no está disponible.');setLoading(false);return}const {data:{user}}=await client.auth.getUser();setInvite(d);setInvitedUser(Boolean(user));setForm(x=>({...x,name:d.invitee_name||user?.user_metadata?.full_name||'',email:user?.email||''}));setLoading(false)})()},[token]);
 const register=async()=>{
  setError('');
  if(form.name.trim().length<2||!/^\S+@\S+\.\S+$/.test(form.email)||form.phone.trim().length<8||!form.birthDate||form.password.length<8){setError('Completa todos los datos. La contraseña debe tener al menos 8 caracteres.');return}
  if(!token)return;setSubmitting(true);const client=createClient();
  const completeExistingAccount=async()=>{
   const {error:updateError}=await client.auth.updateUser({password:form.password,data:{full_name:form.name.trim(),phone:form.phone.trim(),birth_date:form.birthDate,invitation_token:token,requested_role:'paciente'}});
   if(updateError){setError(updateError.message);return false}
   const {data:{user}}=await client.auth.getUser();
   if(user){
    const {error:profileError}=await client.from('profiles').update({full_name:form.name.trim(),phone:form.phone.trim(),birth_date:form.birthDate}).eq('id',user.id);
    if(profileError){setError(profileError.message);return false}
    const {error:linkError}=await client.rpc('accept_patient_invitation',{invitation_token:token});
    if(linkError){setError(linkError.message);return false}
   }
   return true;
  };
  if(invitedUser){
   const completed=await completeExistingAccount();setSubmitting(false);
   if(completed)window.location.assign('/');return;
  }
  const destination=`/registro/paciente?token=${token}`;
  const normalizedEmail=form.email.trim().toLowerCase();
  const {data:signupData,error:signupError}=await client.auth.signUp({email:normalizedEmail,password:form.password,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,data:{full_name:form.name.trim(),phone:form.phone.trim(),birth_date:form.birthDate,invitation_token:token,requested_role:'paciente'}}});
  if(signupError){setSubmitting(false);setError(signupError.message);return}
  const existingAccount=Boolean(signupData.user&&signupData.user.identities?.length===0);
  if(existingAccount){
   const {error:loginError}=await client.auth.signInWithPassword({email:normalizedEmail,password:form.password});
   if(loginError){setSubmitting(false);setError('Este correo ya tiene una cuenta. Escribe la contraseña que usas para entrar a Vicino; no enviaremos otro correo de confirmación.');return}
   const completed=await completeExistingAccount();setSubmitting(false);
   if(completed)window.location.assign('/');return;
  }
  if(signupData.session){const completed=await completeExistingAccount();setSubmitting(false);if(completed)window.location.assign('/');return}
  setSubmitting(false);setSent(true);
 };
 if(loading)return <main className="invite-shell single"><section className="invite-registration-card"><p>Validando invitación…</p></section></main>;
 if(invalid)return <main className="invite-shell single"><section className="invite-registration-card invite-invalid"><div className="invite-symbol">!</div><p className="eyebrow">ENLACE NO DISPONIBLE</p><h1>No pudimos abrir la invitación</h1><p>{invalid}</p><a className="primary" href="/">Volver a Vicino</a></section></main>;
 if(sent)return <main className="invite-shell single"><section className="invite-registration-card invite-confirm"><div className="invite-symbol">✉</div><p className="eyebrow">REVISA TU CORREO</p><h1>Tu espacio está casi listo</h1><p>Enviamos un enlace de confirmación a <strong>{form.email}</strong>.</p><div className="mail-tips"><span>El enlace puede tardar unos minutos.</span><span>Si no aparece, revisa la carpeta de spam.</span></div></section></main>;
 return <main className="invite-shell"><section className="invite-welcome"><a className="invite-brand" href="/"><img src="/vicino-mark.png" alt=""/><span><strong>vicino</strong><small>CONNECT</small></span></a><div><p className="eyebrow">INVITACIÓN PRIVADA</p><h1>{invite?.professional_name} te invita a Vicino</h1><p>Crea tu espacio personal para acompañar tu proceso de forma segura.</p></div><small>Esta invitación solo permite crear una cuenta de Paciente.</small></section><section className="invite-registration-card"><p className="eyebrow">{invitedUser?'VINCULAR MI CUENTA':'CREAR MI CUENTA'}</p><h2>Cuéntanos sobre ti</h2><p className="muted">Estos datos pertenecerán únicamente a tu perfil.</p><label>Nombre completo<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Correo electrónico<input type="email" disabled={invitedUser} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><div className="invite-fields"><label>Teléfono<input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Fecha de nacimiento<input type="date" value={form.birthDate} onChange={e=>setForm({...form,birthDate:e.target.value})}/></label></div><label>Contraseña<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Mínimo 8 caracteres"/></label>{error&&<p className="auth-message" role="alert">{error}</p>}<button className="primary" disabled={submitting} onClick={register}>{submitting?'Vinculando…':invitedUser?'Vincular y entrar':'Crear mi espacio'} <span>→</span></button></section></main>;
}
export default function PatientRegistrationPage(){return <Suspense fallback={<main className="invite-shell single"><section className="invite-registration-card"><p>Preparando invitación…</p></section></main>}><PatientRegistration/></Suspense>}
