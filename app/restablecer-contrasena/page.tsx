"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage(){
 const [client]=useState(()=>createClient()),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false),[checking,setChecking]=useState(true),[valid,setValid]=useState(false);
 useEffect(()=>{let active=true;(async()=>{const {data}=await client.auth.getSession();if(active){setValid(Boolean(data.session));setChecking(false)}})();const {data:listener}=client.auth.onAuthStateChange((_event,session)=>{if(active&&session){setValid(true);setChecking(false)}});return()=>{active=false;listener.subscription.unsubscribe()}},[client]);
 const save=async()=>{
  setMessage('');
  if(password.length<8){setMessage('La contraseña debe tener al menos 8 caracteres.');return}
  if(password!==confirm){setMessage('Las contraseñas no coinciden.');return}
  setSaving(true);
  const {error}=await client.auth.updateUser({password});
  setSaving(false);
  if(error){setMessage('El enlace ya no es válido o venció. Solicita uno nuevo desde el inicio de sesión.');return}
  setDone(true);
 };
 if(checking)return <main className="invite-shell single"><section className="invite-registration-card reset-password-card"><p>Validando enlace seguro…</p></section></main>;
 return <main className="invite-shell single"><section className="invite-registration-card reset-password-card"><p className="eyebrow">ACCESO SEGURO</p><h1>{done?'Contraseña actualizada':valid?'Crea una nueva contraseña':'Necesitas un enlace nuevo'}</h1>{done?<><p>Ya puedes entrar a Vicino con tu correo y tu nueva contraseña.</p><a className="primary" href="/">Ir a iniciar sesión <span>→</span></a></>:!valid?<><p className="muted">Este enlace no conservó la autorización o ya fue utilizado. Solicita uno nuevo; el siguiente funcionará aunque lo abras desde Gmail.</p><a className="primary" href="/?recover=1">Solicitar otro enlace <span>→</span></a></>:<><p className="muted">Elige una contraseña de al menos 8 caracteres.</p><label>Nueva contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar contraseña<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{message&&<p className="auth-message" role="alert">{message}</p>}<button className="primary" disabled={saving} onClick={save}>{saving?'Guardando…':'Guardar contraseña'} <span>→</span></button></>}</section></main>;
}
