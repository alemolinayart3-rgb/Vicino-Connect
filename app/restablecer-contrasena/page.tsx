"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage(){
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false);
 const save=async()=>{
  setMessage('');
  if(password.length<8){setMessage('La contraseña debe tener al menos 8 caracteres.');return}
  if(password!==confirm){setMessage('Las contraseñas no coinciden.');return}
  setSaving(true);
  const {error}=await createClient().auth.updateUser({password});
  setSaving(false);
  if(error){setMessage('El enlace ya no es válido o venció. Solicita uno nuevo desde el inicio de sesión.');return}
  setDone(true);
 };
 return <main className="invite-shell single"><section className="invite-registration-card reset-password-card"><p className="eyebrow">ACCESO SEGURO</p><h1>{done?'Contraseña actualizada':'Crea una nueva contraseña'}</h1>{done?<><p>Ya puedes entrar a Vicino con tu correo y tu nueva contraseña.</p><a className="primary" href="/">Ir a iniciar sesión <span>→</span></a></>:<><p className="muted">Elige una contraseña de al menos 8 caracteres.</p><label>Nueva contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar contraseña<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{message&&<p className="auth-message" role="alert">{message}</p>}<button className="primary" disabled={saving} onClick={save}>{saving?'Guardando…':'Guardar contraseña'} <span>→</span></button></>}</section></main>;
}
