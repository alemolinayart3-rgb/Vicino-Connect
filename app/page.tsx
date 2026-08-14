"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";

type Screen = "login" | "onboarding" | "profileSetup" | "app";
type Tab = "Inicio" | "Agenda" | "Pacientes" | "Proceso" | "Equipo" | "Seguimiento" | "Recursos" | "Mensajes" | "Perfil";
type Role = "Paciente" | "Psicólogo" | "Psiquiatra";

const tabs: { name: Tab; icon: string }[] = [
  { name: "Inicio", icon: "⌂" },
  { name: "Pacientes", icon: "◎" },
  { name: "Proceso", icon: "◒" },
  { name: "Equipo", icon: "♡" },
  { name: "Mensajes", icon: "✉" },
  { name: "Perfil", icon: "○" },
];

const professionalTabs=(role:Role):{name:Tab;label:string;icon:string}[]=>[
 {name:'Inicio',label:'Inicio',icon:'⌂'},{name:'Agenda',label:'Agenda',icon:'□'},{name:'Pacientes',label:'Pacientes',icon:'◎'},
 {name:'Seguimiento',label:role==='Psiquiatra'?'Seguimiento médico':'Seguimiento',icon:'◒'},
 {name:'Recursos',label:role==='Psiquiatra'?'Tratamientos':'Recursos',icon:'◇'},
 {name:'Mensajes',label:'Mensajes',icon:'✉'},{name:'Perfil',label:'Perfil',icon:'○'}
];

function NavIcon({name,fallback}:{name:Tab;fallback:string}){
 if(name==='Agenda')return <svg className="nav-custom-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3.5v3M16 3.5v3M3.5 9h17"/><circle cx="8" cy="13" r="1"/><circle cx="12" cy="13" r="1"/><circle cx="16" cy="13" r="1"/></svg>;
 if(name==='Recursos')return <svg className="nav-custom-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 17 9l-5 5.5L7 9l5-5.5Z"/><path d="M5 14.5 12 21l7-6.5"/><circle cx="19.5" cy="4.5" r="1.5"/></svg>;
 if(name==='Perfil')return <svg className="nav-custom-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/><path d="M18.5 7.5h2M19.5 6.5v2"/></svg>;
 return <span>{fallback}</span>;
}

type Invitation = { id:string; token:string; email:string; invitee_name:string|null; status:string; expires_at:string; created_at:string };

function PatientsPanel() {
  const [invitations,setInvitations] = useState<Invitation[]>([]);
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [creating,setCreating] = useState(false);
  const [feedback,setFeedback] = useState('');
  const loadInvitations = async () => {
    const {data} = await createClient().from('invitations').select('id,token,email,invitee_name,status,expires_at,created_at').order('created_at',{ascending:false});
    setInvitations(((data as Invitation[])||[]).filter(item=>item.status!=='accepted'));
  };
  useEffect(()=>{loadInvitations()},[]);
  const createInvitation = async () => {
    if(!/^\S+@\S+\.\S+$/.test(email)){setFeedback('Escribe un correo electrónico válido.');return}
    setCreating(true);setFeedback('');
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setFeedback('Tu sesión terminó. Ingresa nuevamente.');setCreating(false);return}
    const {data,error}=await supabase.rpc('create_patient_invitation',{patient_email:email.trim().toLowerCase(),patient_name:name.trim()||null});
    setCreating(false);
    if(error){setFeedback(error.message);return}
    setName('');setEmail('');setFeedback('Solicitud enviada. Ahora solo falta que el paciente la acepte desde su cuenta Vicino.');
    const created=data as Invitation;setInvitations(current=>current.some(item=>item.id===created.id)?current:[created,...current]);
  };
  const inviteLink=(token:string)=>`${window.location.origin}/registro/paciente?token=${token}`;
  const copyInvitation=async(token:string)=>{await navigator.clipboard.writeText(inviteLink(token));setFeedback('Enlace copiado. Puedes enviarlo por WhatsApp o correo.')};
  const sendInvitation=async(id:string)=>{setFeedback('Enviando invitación…');const response=await fetch('/api/invitations/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invitationId:id})});const result=await response.json();setFeedback(response.ok?'Correo enviado. La persona recibirá su acceso en unos minutos.':result.error||'No pudimos enviar el correo.');};
  const revoke=async(id:string)=>{const {error}=await createClient().from('invitations').update({status:'revoked'}).eq('id',id);if(!error){setInvitations(invitations.map(x=>x.id===id?{...x,status:'revoked'}:x));setFeedback('Invitación revocada.')}};
  const statusLabel=(x:Invitation)=>x.status==='revoked'?'Revocada':x.status==='accepted'?'Aceptada':new Date(x.expires_at)<new Date()?'Vencida':'Pendiente';
  return <div className="page-content patients-page"><div className="page-heading"><p className="eyebrow">GESTIÓN DE PACIENTES</p><h1>Pacientes</h1><p>Invita a una persona de forma privada y consulta el estado de sus accesos.</p></div><div className="patients-layout"><section className="panel invite-card"><p className="eyebrow">NUEVA INVITACIÓN</p><h2>Invitar paciente</h2><p>El enlace será exclusivo para el registro de un paciente y vencerá en 7 días.</p><label className="edit-field">Nombre, opcional<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Andrea López"/></label><label className="edit-field">Correo electrónico<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="paciente@correo.com"/></label><button className="primary" disabled={creating} onClick={createInvitation}>{creating?'Generando…':'Generar invitación'} <span>→</span></button>{feedback&&<p className="invite-feedback" role="status">{feedback}</p>}</section><section className="panel invitation-list"><div className="section-title"><div><p className="eyebrow">ACCESOS COMPARTIDOS</p><h2>Invitaciones</h2></div><button onClick={loadInvitations}>Actualizar</button></div>{invitations.length===0?<div className="empty-state"><h3>Aún no has enviado invitaciones</h3><p>Las invitaciones nuevas aparecerán aquí.</p></div>:invitations.map(inv=><article className="invitation-row" key={inv.id}><div><strong>{inv.invitee_name||'Paciente por registrar'}</strong><span>{inv.email}</span><small>Vence {new Date(inv.expires_at).toLocaleDateString('es-MX')}</small></div><i className={`invite-status ${statusLabel(inv).toLowerCase()}`}>{statusLabel(inv)}</i><div>{statusLabel(inv)==='Pendiente'&&<><button className="secondary" onClick={()=>sendInvitation(inv.id)}>Enviar correo</button><button className="secondary" onClick={()=>copyInvitation(inv.token)}>Copiar enlace</button><button className="text-danger" onClick={()=>revoke(inv.id)}>Revocar</button></>}</div></article>)}</section></div></div>;
}

function Mark({ compact = false, onHome }: { compact?: boolean; onHome?: () => void }) {
  const content = <><img className="brand-mark" src="/vicino-mark.png" alt="" /><span className="brand-wordmark"><strong>vicino</strong><small>CONNECT</small></span>{compact&&<><PendingCareInvitations/><ActivePatientsWorkspace/><ProfessionalActions/></>}</>;
  const goHome = onHome || (() => window.location.assign('/'));
  return <button type="button" className={`brand brand-home ${compact ? "compact" : ""}`} aria-label="Ir a Inicio" onClick={goHome}>{content}</button>;
}

type CareInvite={invitation_id:string;token:string;professional_name:string;organization_name:string|null;expires_at:string;created_at:string};
function PendingCareInvitations(){
 const [invites,setInvites]=useState<CareInvite[]>([]),[working,setWorking]=useState(false),[message,setMessage]=useState(''),[mounted,setMounted]=useState(false);
 useEffect(()=>{setMounted(true);(async()=>{const {data}=await createClient().rpc('my_pending_patient_invitations');setInvites((data as CareInvite[])||[])})()},[]);
 const decide=async(invite:CareInvite,accept:boolean)=>{setWorking(true);setMessage(accept?'Vinculando tu cuenta…':'Rechazando invitación…');const client=createClient();const {error}=await client.rpc(accept?'accept_patient_invitation':'decline_patient_invitation',{invitation_token:invite.token});setWorking(false);if(error){setMessage(error.message);return}setInvites(current=>current.filter(item=>item.invitation_id!==invite.invitation_id));setMessage(accept?'Listo. El profesional ya forma parte de tu equipo.':'Invitación rechazada.');if(accept)setTimeout(()=>window.location.reload(),700)};
 if(!mounted||(!invites.length&&!message))return null;
 return createPortal(<div className="care-invite-layer" role="region" aria-label="Invitaciones de profesionales">{invites.map(invite=><section className="care-invite-card" key={invite.invitation_id}><div className="care-invite-icon">♡</div><div className="care-invite-copy"><p className="eyebrow">SOLICITUD DE VINCULACIÓN</p><h2>{invite.professional_name} quiere acompañarte</h2><p><strong>{invite.organization_name||'Espacio profesional'}</strong> · Vence {new Date(invite.expires_at).toLocaleDateString('es-MX')}</p></div><div className="care-invite-actions"><button className="primary" disabled={working} onClick={()=>decide(invite,true)}>Aceptar</button><button className="secondary" disabled={working} onClick={()=>decide(invite,false)}>Rechazar</button></div></section>)}{message&&<p className="care-invite-message" role="status">{message}</p>}</div>,document.body);
}

type AssignedPatient={assignment_id:string;patient_id:string;full_name:string;status:string;last_activity_at:string};
function ActivePatientsWorkspace(){
 const [patients,setPatients]=useState<AssignedPatient[]>([]),[target,setTarget]=useState<Element|null>(null),[selected,setSelected]=useState<AssignedPatient|null>(null),[message,setMessage]=useState('');
 const [form,setForm]=useState({kind:'activity',title:'',instructions:'',frequency:'once'});
 useEffect(()=>{(async()=>{const {data}=await createClient().rpc('my_assigned_patients');setPatients((data as AssignedPatient[])||[])})();const observer=new MutationObserver(()=>setTarget(document.querySelector('.patients-page')));observer.observe(document.body,{childList:true,subtree:true});setTarget(document.querySelector('.patients-page'));return()=>observer.disconnect()},[]);
 const save=async()=>{if(!selected||form.title.trim().length<3){setMessage('Escribe un título breve.');return}setMessage('Guardando…');const {error}=await createClient().from('care_plan_items').insert({assignment_id:selected.assignment_id,created_by:(await createClient().auth.getUser()).data.user?.id,kind:form.kind,title:form.title.trim(),instructions:form.instructions.trim()||null,frequency:form.kind==='private_note'?'once':form.frequency});if(error){setMessage(error.message);return}setMessage('Seguimiento guardado.');setForm({kind:'activity',title:'',instructions:'',frequency:'once'});setTimeout(()=>setSelected(null),700)};
 if(!target||!patients.length)return null;
 return createPortal(<section className="panel active-patients"><div className="section-title"><div><p className="eyebrow">VÍNCULOS CONFIRMADOS</p><h2>Pacientes activos</h2></div><span>{patients.filter(x=>x.status==='active').length} activos</span></div><div className="active-patient-list">{patients.map(patient=><article key={patient.assignment_id}><div className="avatar sage">{patient.full_name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><div><strong>{patient.full_name}</strong><small>{patient.status==='active'?'Acompañamiento activo':'Vínculo suspendido'}</small></div><i className={`care-link-status ${patient.status}`}>{patient.status==='active'?'Activo':'Suspendido'}</i><button className="secondary" disabled={patient.status!=='active'} onClick={()=>{setSelected(patient);setMessage('')}}>Añadir seguimiento</button></article>)}</div>{selected&&<div className="follow-up-composer"><div className="section-title"><div><p className="eyebrow">SEGUIMIENTO DE {selected.full_name.toUpperCase()}</p><h3>Nuevo recurso</h3></div><button onClick={()=>setSelected(null)}>×</button></div><div className="follow-up-fields"><label>Tipo<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="activity">Actividad acordada</option><option value="check_in">Registro breve</option><option value="private_note">Nota clínica privada</option></select></label><label>Frecuencia<select disabled={form.kind==='private_note'} value={form.kind==='private_note'?'once':form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}><option value="once">Una vez</option><option value="daily">Diario</option><option value="weekly">Semanal</option></select></label></div><label>Título<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ej. Registro de sueño"/></label><label>Indicaciones<textarea value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Describe el acompañamiento con un tono amable."/></label>{form.kind==='private_note'&&<p className="privacy-hint">Esta nota solo será visible para el profesional de Psicología asignado.</p>}{message&&<p className="invite-feedback">{message}</p>}<button className="primary" onClick={save}>Guardar seguimiento</button></div>}</section>,target);
}

type CareProfessional={assignment_id:string;professional_id:string;full_name:string;role:'psicologo'|'psiquiatra';status:string;last_activity_at:string};
function ProfessionalActions(){
 const [team,setTeam]=useState<CareProfessional[]>([]),[profile,setProfile]=useState<CareProfessional|null>(null),[mounted,setMounted]=useState(false);
 useEffect(()=>{setMounted(true);(async()=>{const {data}=await createClient().rpc('my_care_team');setTeam((data as CareProfessional[])||[])})();const click=(event:MouseEvent)=>{const button=(event.target as HTMLElement).closest('button');const card=button?.closest('.real-team-card');if(!button||!card)return;const name=card.querySelector('h2')?.textContent||'';const member=team.find(item=>item.full_name===name);if(!member)return;if(button.textContent?.includes('Enviar mensaje'))window.dispatchEvent(new CustomEvent('vicino:professional-message',{detail:{chatId:member.role==='psicologo'?'laura':'diego'}}));if(button.textContent?.includes('Ver perfil'))setProfile(member)};document.addEventListener('click',click);return()=>document.removeEventListener('click',click)},[team]);
 if(!mounted||!profile)return null;
 return createPortal(<div className="modal-backdrop professional-profile-overlay" onClick={()=>setProfile(null)}><section className="modal professional-public-profile" role="dialog" aria-modal="true" aria-label={`Perfil de ${profile.full_name}`} onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setProfile(null)}>×</button><div className={`avatar xl ${profile.role==='psicologo'?'sage':'blue'}`}>{profile.full_name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><p className="eyebrow">PROFESIONAL VINCULADO</p><h2>{profile.full_name}</h2><p>{profile.role==='psicologo'?'Profesional de Psicología':'Profesional de Psiquiatría'}</p><i className={`care-link-status ${profile.status}`}>{profile.status==='active'?'Vínculo activo':'Vínculo suspendido'}</i><section className="profile-boundary"><strong>Acceso con límites claros</strong><p>{profile.role==='psicologo'?'Puede acompañar tu proceso psicológico, sin acceso a indicaciones ni medicación.':'Puede gestionar indicaciones médicas, sin acceso a notas privadas de psicoterapia.'}</p></section><button className="primary" disabled={profile.status!=='active'} onClick={()=>{setProfile(null);window.dispatchEvent(new CustomEvent('vicino:professional-message',{detail:{chatId:profile.role==='psicologo'?'laura':'diego'}}))}}>Enviar mensaje</button></section></div>,document.body);
}

type Appointment={id:string;assignment_id:string;patient_id:string;starts_at:string;duration_minutes:number;status:string;notes:string|null};
function ProfessionalAgenda(){
 const [patients,setPatients]=useState<AssignedPatient[]>([]),[appointments,setAppointments]=useState<Appointment[]>([]),[patientId,setPatientId]=useState(''),[date,setDate]=useState('2026-08-18'),[time,setTime]=useState('10:00'),[notes,setNotes]=useState(''),[message,setMessage]=useState(''),[saving,setSaving]=useState(false);
 const load=async()=>{const client=createClient();const [{data:people},{data:events,error}]=await Promise.all([client.rpc('my_assigned_patients'),client.from('appointments').select('id,assignment_id,patient_id,starts_at,duration_minutes,status,notes').neq('status','cancelled').order('starts_at')]);const active=((people as AssignedPatient[])||[]).filter(x=>x.status==='active');setPatients(active);setPatientId(current=>current||active[0]?.assignment_id||'');setAppointments((events as Appointment[])||[]);if(error&&error.message.includes('appointments'))setMessage('Falta activar el módulo de agenda en Supabase. Ejecuta el archivo SQL de agenda.')};
 useEffect(()=>{load()},[]);
 const createAppointment=async()=>{const selected=patients.find(x=>x.assignment_id===patientId);if(!selected||!date||!time)return;setSaving(true);setMessage('Agendando…');const client=createClient();const {data:{user}}=await client.auth.getUser();const startsAt=new Date(`${date}T${time}:00`).toISOString();const {error}=await client.from('appointments').insert({assignment_id:selected.assignment_id,patient_id:selected.patient_id,professional_id:user?.id,starts_at:startsAt,duration_minutes:50,status:'scheduled',notes:notes.trim()||null});setSaving(false);if(error){setMessage(error.message.includes('appointments')?'Falta activar el módulo de agenda en Supabase. Ejecuta el archivo SQL de agenda.':error.message);return}setMessage(`Cita agendada para ${selected.full_name}.`);setNotes('');await load()};
 const updateStatus=async(id:string,status:string)=>{const {error}=await createClient().from('appointments').update({status}).eq('id',id);setMessage(error?error.message:status==='cancelled'?'Cita cancelada.':'Cita actualizada.');if(!error)await load()};
 const patientName=(event:Appointment)=>patients.find(x=>x.patient_id===event.patient_id)?.full_name||'Paciente';
 const days=Array.from({length:31},(_,i)=>i+1),eventDays=new Set(appointments.filter(x=>x.status==='scheduled').map(x=>new Date(x.starts_at).getDate()));
 const timeSlots=Array.from({length:57},(_,index)=>{const total=8*60+index*15,hour=Math.floor(total/60),minute=total%60,value=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,displayHour=hour%12||12,suffix=hour<12?'a. m.':'p. m.';return {value,label:`${displayHour}:${String(minute).padStart(2,'0')} ${suffix}`}});
 return <div className="page-content professional-agenda"><div className="page-heading"><p className="eyebrow">AGENDA PROFESIONAL</p><h1>Agenda</h1><p>Crea la próxima cita al terminar una sesión y administra los encuentros programados.</p></div><div className="agenda-main-grid"><section className="panel agenda-month"><header><button aria-label="Mes anterior">‹</button><h2>Agosto 2026</h2><button aria-label="Mes siguiente">›</button></header><div className="weekdays">{['L','M','M','J','V','S','D'].map((x,i)=><span key={i}>{x}</span>)}</div><div className="days">{Array.from({length:5},(_,i)=><span key={`blank-${i}`}></span>)}{days.map(day=><button key={day} className={eventDays.has(day)?'has-appointment':''} onClick={()=>setDate(`2026-08-${String(day).padStart(2,'0')}`)}>{day}</button>)}</div><div className="calendar-legend"><span><i className="appointment-dot"></i>Con cita</span><span><i className="available"></i>Disponible</span></div></section><aside className="panel new-appointment"><p className="eyebrow">NUEVA CITA</p><h2>Agendar paciente</h2>{patients.length===0?<p className="muted">Todavía no tienes pacientes activos.</p>:<><label>Paciente<select value={patientId} onChange={e=>setPatientId(e.target.value)}>{patients.map(patient=><option value={patient.assignment_id} key={patient.assignment_id}>{patient.full_name}</option>)}</select></label><div className="appointment-fields"><label>Fecha<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Hora<select value={time} onChange={e=>setTime(e.target.value)}>{timeSlots.map(slot=><option value={slot.value} key={slot.value}>{slot.label}</option>)}</select></label></div><label>Nota, opcional<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Motivo o recordatorio para la sesión."/></label><button className="primary" disabled={saving} onClick={createAppointment}>{saving?'Agendando…':'Agendar cita'}</button></>}{message&&<p className="agenda-feedback" role="status">{message}</p>}</aside></div><section className="panel appointment-list"><div className="section-title"><div><p className="eyebrow">PRÓXIMOS ENCUENTROS</p><h2>Citas programadas</h2></div><span>{appointments.length}</span></div>{appointments.length===0?<div className="empty-state"><p>No hay citas programadas todavía.</p></div>:appointments.map(event=><article key={event.id}><div className="avatar sage">{patientName(event).split(/\s+/).map(x=>x[0]).join('').slice(0,2)}</div><div><strong>{patientName(event)}</strong><small>{new Date(event.starts_at).toLocaleString('es-MX',{day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})} · {event.duration_minutes} min</small></div><i>{event.status==='postponed'?'Pospuesta':'Programada'}</i><button className="secondary" onClick={()=>updateStatus(event.id,event.status==='postponed'?'scheduled':'postponed')}>{event.status==='postponed'?'Reactivar':'Posponer'}</button><button className="text-danger" onClick={()=>updateStatus(event.id,'cancelled')}>Cancelar</button></article>)}</section></div>;
}

function ProfessionalWorkspace({role,section}:{role:Role;section:'Seguimiento'|'Recursos'}){
 const medical=role==='Psiquiatra',tracking=section==='Seguimiento';
 const [resource,setResource]=useState<{title:string;kind:string;resourceType:string}|null>(null),[patients,setPatients]=useState<AssignedPatient[]>([]),[patientId,setPatientId]=useState(''),[resourceTitle,setResourceTitle]=useState(''),[instructions,setInstructions]=useState(''),[resourceContent,setResourceContent]=useState(''),[frequency,setFrequency]=useState('once'),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 const openResource=async(title:string,kind:string,resourceType:string)=>{setResource({title,kind,resourceType});setResourceTitle(title);setInstructions('');setResourceContent('');setFrequency('once');setMessage('Cargando pacientes…');const {data,error}=await createClient().rpc('my_assigned_patients');const active=((data as AssignedPatient[])||[]).filter(item=>item.status==='active');setPatients(active);setPatientId(active[0]?.assignment_id||'');setMessage(error?error.message:active.length?'':'Aún no tienes pacientes activos para asignar este recurso.')};
 const assignResource=async()=>{if(!resource||!patientId||resourceTitle.trim().length<3)return;setSaving(true);setMessage('Guardando asignación…');const client=createClient();const {data:{user}}=await client.auth.getUser();const content=resource.resourceType==='questionnaire'?{questions:resourceContent.split('\n').map(x=>x.trim()).filter(Boolean)}:resource.resourceType==='educational_material'?{url:resourceContent.trim()}:resource.resourceType==='check_in'?{prompt:resourceContent.trim()}:{};const {error}=await client.from('care_plan_items').insert({assignment_id:patientId,created_by:user?.id,kind:resource.kind,resource_type:resource.resourceType,title:resourceTitle.trim(),instructions:instructions.trim()||null,content,frequency});setSaving(false);if(error){setMessage(error.message.includes("care_plan_items")?'Falta activar el módulo de recursos en Supabase. Ejecuta el archivo SQL de configuración que te compartimos.':error.message);return}setMessage('Recurso asignado correctamente. Ya aparecerá en el espacio del paciente.');setTimeout(()=>{setResource(null);setInstructions('');setResourceContent('');setFrequency('once');setMessage('')},1100)};
 if(tracking)return <div className="page-content professional-workspace"><div className="page-heading"><p className="eyebrow">{medical?'CONTINUIDAD MÉDICA':'CONTINUIDAD DEL ACOMPAÑAMIENTO'}</p><h1>{medical?'Seguimiento médico':'Seguimiento'}</h1><p>{medical?'Revisa los registros relevantes antes de cada consulta.':'Identifica qué necesita atención sin convertir el proceso en una lista de pendientes.'}</p></div><div className="stats follow-up-stats"><section><span>Registros por revisar</span><strong>0</strong><small>Sin novedades</small></section><section><span>{medical?'Tolerancia reportada':'Actividades compartidas'}</span><strong>0</strong><small>Esta semana</small></section><section><span>Próximas consultas</span><strong>0</strong><small>Hoy</small></section></div><section className="panel empty-state"><h2>Todo está al día</h2><p>{medical?'Los reportes de sueño, adherencia o efectos aparecerán aquí.':'Las respuestas a actividades, registros y cuestionarios aparecerán aquí.'}</p><button className="secondary" onClick={()=>window.dispatchEvent(new CustomEvent('vicino:open-patients'))}>Ver pacientes</button></section></div>;
 const resources=medical?[['Indicaciones','Plantillas para comunicar indicaciones médicas.','activity','medical_indication'],['Seguimiento de tolerancia','Registros que el paciente puede responder.','check_in','check_in'],['Revisión de tratamiento','Recordatorios para próximas consultas.','activity','treatment_review']]:[['Actividades acordadas','Ejercicios para acompañar entre sesiones.','activity','activity'],['Registros breves','Check-ins diarios o semanales.','check_in','check_in'],['Cuestionarios','Instrumentos y formularios reutilizables.','check_in','questionnaire'],['Material psicoeducativo','Recursos de lectura y práctica.','activity','educational_material']];
 return <div className="page-content professional-workspace"><div className="page-heading"><p className="eyebrow">{medical?'GESTIÓN CLÍNICA':'BIBLIOTECA DE ACOMPAÑAMIENTO'}</p><h1>{medical?'Tratamientos':'Recursos'}</h1><p>{medical?'Organiza indicaciones y seguimientos con límites de acceso claros.':'Prepara recursos reutilizables y asígnalos desde el perfil de cada paciente.'}</p></div><div className="resource-grid">{resources.map(([title,text,kind,resourceType])=><section className="panel resource-card" key={title}><span>◇</span><h2>{title}</h2><p>{text}</p><button className="secondary" onClick={()=>openResource(title,kind,resourceType)}>Crear y asignar</button></section>)}</div>{resource&&<div className="modal-backdrop" onClick={()=>setResource(null)}><section className="modal resource-assignment-modal" role="dialog" aria-modal="true" aria-label={`Asignar ${resource.title}`} onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setResource(null)}>×</button><p className="eyebrow">CREAR Y ASIGNAR</p><h2>{resource.title}</h2><p>Personaliza el contenido antes de compartirlo.</p>{patients.length>0&&<><label className="edit-field">Paciente<select value={patientId} onChange={e=>setPatientId(e.target.value)}>{patients.map(patient=><option value={patient.assignment_id} key={patient.assignment_id}>{patient.full_name}</option>)}</select></label><label className="edit-field">Título<input value={resourceTitle} onChange={e=>setResourceTitle(e.target.value)} placeholder="Nombre que verá el paciente"/></label><label className="edit-field">Frecuencia<select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="once">Una vez</option><option value="daily">Diario</option><option value="weekly">Semanal</option></select></label>{resource.resourceType==='questionnaire'&&<label className="edit-field">Preguntas, una por línea<textarea value={resourceContent} onChange={e=>setResourceContent(e.target.value)} placeholder={'¿Cómo te sentiste hoy?\n¿Qué recurso utilizaste?\n¿Qué te gustaría conversar?'}/></label>}{resource.resourceType==='educational_material'&&<label className="edit-field">Enlace al documento o material<input type="url" value={resourceContent} onChange={e=>setResourceContent(e.target.value)} placeholder="https://…"/></label>}{resource.resourceType==='check_in'&&<label className="edit-field">Pregunta principal<textarea value={resourceContent} onChange={e=>setResourceContent(e.target.value)} placeholder="Ej. ¿Cómo estuvo tu nivel de ansiedad hoy?"/></label>}<label className="edit-field">Indicaciones, opcional<textarea value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Explica brevemente cómo utilizar este recurso."/></label></>}{message&&<p className="invite-feedback" role="status">{message}</p>}<button className="primary" disabled={saving||!patientId||resourceTitle.trim().length<3} onClick={assignResource}>{saving?'Asignando…':'Confirmar asignación'}</button></section></div>}</div>;
}

function Login({ onNext }: { onNext: (role: Role, isNewAccount?: boolean) => void }) {
  const [role, setRole] = useState<Role>("Paciente");
  const demoEmails: Record<Role,string> = {Paciente:'ana@ejemplo.com',Psicólogo:'laura@vicino.mx',Psiquiatra:'diego@vicino.mx'};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const selectRole = (nextRole: Role) => { setRole(nextRole); setEmail(demoEmails[nextRole]); };
  const authenticate = async (createAccount = false) => {
    setMessage('');
    if (!email || password.length < 6) {
      setMessage('Escribe un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    if (createAccount && role !== 'Paciente') {
      setMessage('Las cuentas profesionales se habilitan mediante invitación y verificación de credenciales.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (createAccount) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      setMessage(error ? error.message : 'Revisa tu correo para confirmar tu cuenta de Vicino Connect.');
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      setMessage(error?.message || 'No fue posible iniciar sesión.');
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    const actualRole: Role = profile?.role === 'psicologo' ? 'Psicólogo' : profile?.role === 'psiquiatra' ? 'Psiquiatra' : 'Paciente';
    const selectedProfessional = role !== 'Paciente';
    const roleMatches = selectedProfessional ? actualRole !== 'Paciente' : actualRole === 'Paciente';
    if (!roleMatches) {
      await supabase.auth.signOut();
      setLoading(false);
      setMessage(`Estas credenciales corresponden a una cuenta ${actualRole === 'Paciente' ? 'de Paciente' : 'Profesional'}. Selecciona el acceso correcto.`);
      return;
    }
    setLoading(false);
    onNext(actualRole, false);
  };
  return (
    <main className="auth-shell">
      <section className="welcome-panel">
        <Mark />
        <div className="welcome-copy">
          <p className="eyebrow">Tu bienestar, acompañado</p>
          <h1>Un espacio seguro para sentirte cerca de tu proceso.</h1>
          <p>Conecta con tu equipo de salud mental y avanza con claridad, a tu propio ritmo.</p>
        </div>
        <div className="orbit-art" aria-hidden="true"><span></span><span></span><span></span></div>
        <p className="privacy-note">Privado · Humano · Siempre contigo</p>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-auth-brand"><Mark /></div>
          <p className="mini-brand">VICINO CONNECT</p>
          <h2>Qué gusto verte</h2>
          <p className="muted">Ingresa para continuar con tu proceso.</p>
          <div className="role-picker role-picker-unified" aria-label="Selecciona tu tipo de acceso">
            <button className={role === 'Paciente' ? 'selected' : ''} onClick={() => selectRole('Paciente')}>Paciente</button>
            <button className={role !== 'Paciente' ? 'selected' : ''} onClick={() => selectRole('Psicólogo')}>Profesional</button>
          </div>
          <label>Correo electrónico<input value={email} onChange={e=>setEmail(e.target.value)} type="email" /></label>
          <label>Contraseña<div className="password"><input value={password} onChange={e=>setPassword(e.target.value)} type="password" /><span>○</span></div></label>
          <div className="login-meta"><label className="remember"><input type="checkbox" defaultChecked /> Recordarme</label><button>Olvidé mi contraseña</button></div>
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="primary" disabled={loading} onClick={() => authenticate(false)}>{loading ? 'Ingresando…' : 'Continuar'} <span>→</span></button>
          <p className="signup">¿Es tu primera vez? <button disabled={loading} onClick={() => authenticate(true)}>Crear una cuenta</button></p>
        </div>
        <p className="legal">Al continuar aceptas nuestros Términos y Aviso de privacidad.</p>
      </section>
    </main>
  );
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const cards = [
    { n: "01", title: "Tu proceso, en un solo lugar", text: "Visualiza tus próximos pasos, sesiones y recursos sin perder de vista lo que importa: tú.", icon: "◒" },
    { n: "02", title: "Tu equipo, más cerca", text: "Mantén una comunicación clara y segura con tu psicóloga y psiquiatra.", icon: "♡" },
    { n: "03", title: "Información con límites claros", text: "Tus notas psicológicas e indicaciones médicas viven en espacios separados y protegidos.", icon: "⌁" },
  ];
  return (
    <main className="onboarding">
      <header><Mark compact /><button onClick={onDone}>Omitir</button></header>
      <section className="onboard-card">
        <div className="step-number">{cards[step].n}</div>
        <div className="onboard-icon">{cards[step].icon}</div>
        <p className="eyebrow">BIENVENIDA A VICINO</p>
        <h1>{cards[step].title}</h1>
        <p>{cards[step].text}</p>
        <div className="dots">{cards.map((_, i) => <span key={i} className={i === step ? 'active' : ''}></span>)}</div>
        <button className="primary" onClick={() => step < 2 ? setStep(step + 1) : onDone()}>{step < 2 ? 'Siguiente' : 'Entrar a mi espacio'} <span>→</span></button>
        {step > 0 && <button className="back" onClick={() => setStep(step - 1)}>← Atrás</button>}
      </section>
    </main>
  );
}

function ProfileSetup({ onDone }: { onDone: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (name.trim().length < 2) { setError('Escribe tu nombre para personalizar tu espacio.'); return; }
    setSaving(true);
    setError('');
    try {
      await onDone(name.trim());
    } catch {
      setError('No pudimos guardar tu nombre. Intenta nuevamente.');
      setSaving(false);
    }
  };
  return <main className="onboarding"><header><Mark compact /></header><section className="onboard-card"><div className="onboard-icon">♡</div><p className="eyebrow">ANTES DE COMENZAR</p><h1>¿Cómo te gustaría que te llamemos?</h1><p>Usaremos este nombre para acompañarte dentro de Vicino. Puedes modificarlo después desde tu perfil.</p><label className="edit-field">Tu nombre<input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')save()}} placeholder="Escribe tu nombre" /></label>{error&&<p className="auth-message" role="alert">{error}</p>}<button className="primary" disabled={saving} onClick={save}>{saving?'Guardando…':'Crear mi espacio'} <span>→</span></button></section></main>;
}

function FreshPatientView({ tab, name }: { tab: Tab; name: string }) {
  const [profileModal, setProfileModal] = useState<'contact'|'privacy'|null>(null);
  const [careTeam,setCareTeam]=useState<{assignment_id:string;professional_id:string;full_name:string;role:'psicologo'|'psiquiatra';status:string;last_activity_at:string}[]>([]);
  const [careItems,setCareItems]=useState<{id:string;kind:string;resource_type:string;title:string;instructions:string|null;content:{questions?:string[];url?:string;prompt?:string};frequency:string;created_at:string}[]>([]);
  const [teamLoading,setTeamLoading]=useState(true);
  const [contact,setContact]=useState({phone:'',birthDate:''}),[contactSaving,setContactSaving]=useState(false),[contactMessage,setContactMessage]=useState('');
  useEffect(()=>{(async()=>{const client=createClient();const {data:{user}}=await client.auth.getUser();const [{data:team},{data:items},{data:profile}]=await Promise.all([client.rpc('my_care_team'),client.from('care_plan_items').select('id,kind,resource_type,title,instructions,content,frequency,created_at').neq('kind','private_note').order('created_at',{ascending:false}),client.from('profiles').select('phone,birth_date').eq('id',user?.id||'').maybeSingle()]);setCareTeam((team as typeof careTeam)||[]);setCareItems((items as typeof careItems)||[]);setContact({phone:profile?.phone||'',birthDate:profile?.birth_date||''});setTeamLoading(false)})()},[]);
  const saveContact=async()=>{if(contact.phone.trim().length<8||!contact.birthDate){setContactMessage('Completa un teléfono válido y tu fecha de nacimiento.');return}if(new Date(contact.birthDate)>new Date()){setContactMessage('La fecha de nacimiento no puede estar en el futuro.');return}setContactSaving(true);setContactMessage('Guardando…');const client=createClient();const {data:{user}}=await client.auth.getUser();const {error}=await client.from('profiles').update({phone:contact.phone.trim(),birth_date:contact.birthDate}).eq('id',user?.id||'');setContactSaving(false);setContactMessage(error?(error.message.toLowerCase().includes('permission denied')?'Falta habilitar el permiso para actualizar tu perfil en Supabase. Ejecuta el archivo SQL de configuración del perfil.':error.message):'Información actualizada correctamente.');if(!error)setTimeout(()=>{setProfileModal(null);setContactMessage('')},900)};
  const age=contact.birthDate?Math.max(0,Math.floor((Date.now()-new Date(contact.birthDate).getTime())/31557600000)):null;
  if (tab === 'Inicio') return <div className="page-content"><div className="page-heading"><p className="eyebrow">TU ESPACIO</p><h1>Hola, {name}</h1><p>Qué gusto acompañarte. Tu espacio está listo para comenzar.</p></div><section className="panel empty-state"><p className="eyebrow">PRIMEROS PASOS</p><h2>Aún no tienes sesiones programadas</h2><p>Cuando un profesional se una a tu equipo, aquí aparecerán tus próximas sesiones, recursos y avances.</p></section><div className="content-grid"><section className="panel empty-state"><h2>Tu proceso comenzará aquí</h2><p>Este espacio se irá construyendo contigo, sin pendientes ni información de ejemplo.</p></section><section className="panel empty-state"><h2>Tu equipo</h2><p>Todavía no hay profesionales vinculados a tu cuenta.</p></section></div></div>;
  if (tab === 'Proceso') return <div className="page-content"><div className="page-heading"><p className="eyebrow">TU CAMINO</p><h1>Mi proceso</h1><p>Este espacio crecerá a tu ritmo.</p></div>{careItems.length===0?<section className="panel empty-state"><h2>Aún no hay recursos compartidos</h2><p>Cuando tu profesional te asigne una actividad, registro o material, aparecerá aquí.</p></section>:<section className="panel patient-resources"><div className="section-title"><div><p className="eyebrow">COMPARTIDO CONTIGO</p><h2>Recursos de acompañamiento</h2></div><span>{careItems.length}</span></div>{careItems.map(item=><article key={item.id}><span>{item.resource_type==='questionnaire'?'?':item.kind==='check_in'?'○':'◇'}</span><div><h3>{item.title}</h3><p>{item.instructions||item.content?.prompt||'Tu profesional compartió este recurso para acompañar tu proceso.'}</p>{item.content?.questions?.length?<ol>{item.content.questions.map(question=><li key={question}>{question}</li>)}</ol>:null}{item.content?.url&&<a className="secondary" href={item.content.url} target="_blank" rel="noreferrer">Abrir material</a>}<small>{item.frequency==='daily'?'Diario':item.frequency==='weekly'?'Semanal':'Una vez'}</small></div></article>)}</section>}</div>;
  if (tab === 'Equipo') return <div className="page-content"><div className="page-heading"><p className="eyebrow">RED DE APOYO</p><h1>Mi equipo</h1><p>Profesionales vinculados de forma segura a tu cuenta.</p></div>{teamLoading?<section className="panel empty-state"><p>Consultando tu equipo…</p></section>:careTeam.length===0?<section className="panel empty-state"><h2>Todavía no tienes profesionales vinculados</h2><p>Cuando aceptes una solicitud, la persona aparecerá aquí.</p></section>:<div className="profile-grid">{careTeam.map(member=><section className="profile-card real-team-card" key={member.assignment_id}><div className={`avatar xl ${member.role==='psicologo'?'sage':'blue'}`}>{member.full_name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><h2>{member.full_name}</h2><p>{member.role==='psicologo'?'Profesional de Psicología':'Profesional de Psiquiatría'}</p><i className={`care-link-status ${member.status}`}>{member.status==='active'?'Vínculo activo':'Vínculo suspendido'}</i><div><button className="secondary" disabled={member.status!=='active'}>Enviar mensaje</button><button className="secondary">Ver perfil</button></div></section>)}</div>}</div>;
  if (tab === 'Mensajes') return <div className="page-content"><div className="page-heading"><p className="eyebrow">CONVERSACIONES SEGURAS</p><h1>Mensajes</h1></div><section className="panel empty-state"><h2>No hay conversaciones todavía</h2><p>Podrás escribir cuando un profesional forme parte de tu equipo.</p></section></div>;
  const initials = name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const complete=Boolean(contact.phone&&contact.birthDate);
  return <div className="page-content"><div className="page-heading"><p className="eyebrow">TU ESPACIO</p><h1>Perfil</h1><p>Aquí podrás administrar tu información y preferencias.</p></div><section className="profile-settings"><div className="avatar xl">{initials}</div><div><h2>{name}</h2><p>Paciente{age!==null?` · ${age} años`:''} · Cuenta activa</p></div><button className="secondary" onClick={()=>setProfileModal('contact')}>Editar información</button></section><section className="professional-identity"><span className="role-badge sage">{complete?'Perfil completo':'Primeros pasos'}</span><div><strong>{complete?'Tu información está actualizada':'Tu perfil está casi listo'}</strong><p>{complete?'Puedes modificar tus datos de contacto cuando lo necesites.':'Agrega tu teléfono y fecha de nacimiento para completar tus datos personales.'}</p></div></section><div className="settings-grid"><button className="setting" onClick={()=>setProfileModal('contact')}><span>○</span><strong>Información personal</strong><i>→</i></button><button className="setting" onClick={()=>setProfileModal('privacy')}><span>◇</span><strong>Privacidad y seguridad</strong><i>→</i></button></div>{profileModal==='contact'&&<div className="modal-backdrop" onClick={()=>setProfileModal(null)}><section className="modal settings-modal contact-profile-modal" role="dialog" aria-modal="true" aria-label="Información del perfil" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setProfileModal(null)}>×</button><p className="eyebrow">INFORMACIÓN PERSONAL</p><h2>{name}</h2><div className="session-detail"><span><small>Tipo de cuenta</small><strong>Paciente</strong></span><span><small>Estado</small><strong>Correo confirmado</strong></span></div><label className="edit-field">Teléfono<input type="tel" value={contact.phone} onChange={e=>setContact({...contact,phone:e.target.value})} placeholder="Ej. +52 55 1234 5678"/></label><label className="edit-field">Fecha de nacimiento<input type="date" max={new Date().toISOString().slice(0,10)} value={contact.birthDate} onChange={e=>setContact({...contact,birthDate:e.target.value})}/></label>{age!==null&&<p className="age-preview">Edad calculada: <strong>{age} años</strong></p>}{contactMessage&&<p className="invite-feedback" role="status">{contactMessage}</p>}<button className="primary" disabled={contactSaving} onClick={saveContact}>{contactSaving?'Guardando…':'Guardar cambios'}</button></section></div>}{profileModal==='privacy'&&<div className="modal-backdrop" onClick={()=>setProfileModal(null)}><section className="modal settings-modal privacy-profile-modal" role="dialog" aria-modal="true" aria-label="Privacidad y seguridad" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setProfileModal(null)}>×</button><p className="eyebrow">PRIVACIDAD Y SEGURIDAD</p><h2>Tu cuenta está protegida</h2><div className="privacy-status-list"><article><span>✓</span><div><strong>Correo confirmado</strong><p>Tu acceso está vinculado a un correo verificado.</p></div></article><article><span>✓</span><div><strong>Información separada</strong><p>Las notas psicológicas y las indicaciones médicas conservan permisos distintos.</p></div></article><article><span>✓</span><div><strong>Vínculos bajo tu control</strong><p>Solo los profesionales que aceptes pueden formar parte de tu equipo.</p></div></article></div><button className="primary" onClick={()=>setProfileModal(null)}>Cerrar</button></section></div>}</div>;
}

function Home({ onMessage, onProcess, onTeam }: { onMessage: () => void; onProcess: () => void; onTeam: () => void }) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<'details'|'calendar'|'confirmed'>('details');
  const [session, setSession] = useState({day:18,time:'10:00 AM'});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [breathing, setBreathing] = useState(false);
  const openDetails = () => { setScheduleStep('details'); setSessionOpen(true); };
  const confirmSchedule = () => { if(selectedDay&&selectedTime){setSession({day:selectedDay,time:selectedTime});setScheduleStep('confirmed')} };
  const availableDays = [19,20,24,25,27,31];
  const busyDays = [21,26,28];
  return <>
    <div className="hero-row">
      <div><p className="eyebrow">MIÉRCOLES, 12 DE AGOSTO</p><h1>Hola, Ana <span>✦</span></h1><p>Hoy también cuenta. ¿Cómo te gustaría avanzar?</p></div>
      <div className="mood-card"><div><span>Tu pulso de hoy</span><strong>¿Cómo te sientes?</strong></div><button>Registrar <span>→</span></button></div>
    </div>
    <section className="session-card banner-link" role="button" tabIndex={0} onClick={openDetails} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')openDetails()}}>
      <div className="date-block"><strong>{session.day}</strong><span>AGO</span></div>
      <div className="session-info"><p className="eyebrow">PRÓXIMA SESIÓN</p><h2>Psicoterapia individual</h2><p>{session.time} · 50 min · Videollamada</p></div>
      <div className="therapist"><div className="avatar sage">LM</div><div><strong>Laura Méndez</strong><span>Psicóloga clínica</span></div></div>
      <button className="secondary" onClick={e=>{e.stopPropagation();openDetails()}}>Ver detalles</button>
    </section>
    <div className="content-grid">
      <section><div className="section-title"><div><p className="eyebrow">CONTINUIDAD</p><h2>Tu proceso</h2></div><button onClick={onProcess}>Ver todo →</button></div>
        <div className="process-card banner-link" role="button" tabIndex={0} onClick={onProcess} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')onProcess()}}><div className="progress-ring"><strong>4</strong><span>semanas</span></div><div><h3>Reconocer mis patrones de ansiedad</h3><p>Estás trabajando en identificar detonantes y crear respuestas más amables.</p><div className="progress"><i></i></div><span className="caption">3 de 5 pasos completados</span></div></div>
      </section>
      <section><div className="section-title"><div><p className="eyebrow">PARA TI</p><h2>Un momento de calma</h2></div></div>
        <div className={`calm-card banner-link ${breathing ? 'playing' : ''}`} role="button" tabIndex={0} onClick={()=>setBreathing(!breathing)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setBreathing(!breathing)}}><button className="play" aria-label={breathing ? "Pausar respiración" : "Iniciar respiración"} onClick={e=>{e.stopPropagation();setBreathing(!breathing)}}>{breathing ? 'Ⅱ' : '▶'}</button><div><h3>{breathing ? 'Inhala lentamente…' : 'Respiración consciente'}</h3><p>{breathing ? 'Sigue el ritmo del círculo. Exhala con suavidad.' : 'Una pausa guiada para volver al presente.'}</p><span>{breathing ? 'En curso · toca para pausar' : '5 minutos'}</span></div></div>
      </section>
    </div>
    <section className="team-strip banner-link" role="button" tabIndex={0} onClick={onTeam} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')onTeam()}}><div><p className="eyebrow">TU RED DE APOYO</p><h2>Tu equipo está cerca</h2></div><div className="team-person"><div className="avatar sage">LM</div><span><strong>Laura Méndez</strong><small>Psicóloga</small></span><i className="online"></i></div><div className="team-person"><div className="avatar blue">DR</div><span><strong>Diego Ríos</strong><small>Psiquiatra</small></span></div><button className="secondary" onClick={e=>{e.stopPropagation();onMessage()}}>Enviar mensaje</button></section>
    {sessionOpen && <div className="modal-backdrop" onClick={() => setSessionOpen(false)}><section className={`modal ${scheduleStep==='calendar'?'calendar-modal':''}`} role="dialog" aria-modal="true" aria-label="Detalles de próxima sesión" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSessionOpen(false)}>×</button>{scheduleStep==='details'?<><p className="eyebrow">PRÓXIMA SESIÓN</p><h2>Psicoterapia individual</h2><div className="session-detail"><span><small>Fecha</small><strong>{session.day} de agosto de 2026</strong></span><span><small>Hora</small><strong>{session.time} · 50 min</strong></span><span><small>Modalidad</small><strong>Videollamada</strong></span><span><small>Profesional</small><strong>Laura Méndez</strong></span></div><div className="modal-actions"><button className="secondary" onClick={()=>{setSelectedDay(null);setSelectedTime('');setScheduleStep('calendar')}}>Reagendar sesión</button><button className="primary" onClick={() => setSessionOpen(false)}>Entendido</button></div></>:scheduleStep==='calendar'?<><button className="calendar-back" onClick={()=>setScheduleStep('details')}>← Detalles</button><p className="eyebrow">REAGENDAR SESIÓN</p><h2>Elige una nueva fecha</h2><div className="calendar-legend"><span><i className="available"></i>Disponible</span><span><i className="busy"></i>Ocupado</span></div><div className="calendar"><header><button>‹</button><strong>Agosto 2026</strong><button>›</button></header><div className="weekdays">{['L','M','M','J','V','S','D'].map((x,i)=><span key={i}>{x}</span>)}</div><div className="days">{Array.from({length:35},(_,i)=>i<5?null:i-4).map((day,i)=>day?<button key={i} disabled={busyDays.includes(day)||!availableDays.includes(day)} className={`${availableDays.includes(day)?'available':''} ${busyDays.includes(day)?'busy':''} ${selectedDay===day?'selected':''}`} onClick={()=>{setSelectedDay(day);setSelectedTime('')}}>{day}</button>:<span key={i}></span>)}</div></div>{selectedDay&&<div className="time-slots"><p>Horarios disponibles para el {selectedDay} de agosto</p><div>{['9:00 AM','10:30 AM','12:00 PM','4:00 PM'].map((time,i)=><button className={selectedTime===time?'selected':''} disabled={(selectedDay+i)%3===0} onClick={()=>setSelectedTime(time)} key={time}>{time}{(selectedDay+i)%3===0&&<small>Ocupado</small>}</button>)}</div></div>}<button className="primary confirm-schedule" disabled={!selectedDay||!selectedTime} onClick={confirmSchedule}>Confirmar nueva fecha</button></>:<div className="schedule-success"><span>✓</span><p className="eyebrow">SESIÓN REPROGRAMADA</p><h2>{session.day} de agosto · {session.time}</h2><p>Tu sesión con Laura Méndez quedó actualizada.</p><button className="primary" onClick={()=>setSessionOpen(false)}>Volver a Inicio</button></div>}</section></div>}
  </>;
}

function Process() {
  const moments = [
    {title:'Reconocer lo que activa la ansiedad',note:'Algo que ya pudimos mirar juntos',state:'explored'},
    {title:'Escuchar las sensaciones del cuerpo',note:'Una señal que ahora reconoces mejor',state:'explored'},
    {title:'Hacer una pausa consciente',note:'Un recurso que estás haciendo tuyo',state:'current'},
    {title:'Dar espacio a pensamientos más amables',note:'Lo que sigue, cuando estés list@',state:'upcoming'},
    {title:'Crear apoyos para tu día a día',note:'Más adelante, a tu propio ritmo',state:'upcoming'}
  ];
  return <div className="page-content" id="mi-proceso"><div className="page-heading"><p className="eyebrow">TU CAMINO</p><h1>Mi proceso</h1><p>Un espacio para reconocer lo que has ido descubriendo y lo que podemos seguir explorando juntos.</p></div>
    <div className="two-col"><section className="panel journey-panel"><p className="eyebrow">DONDE ESTÁS AHORA</p><h2>En lo que estás trabajando</h2><div className="goal"><span>◒</span><div><h3>Reconocer mis patrones de ansiedad</h3><p>Lo estamos explorando con Laura desde el 14 de julio, a tu propio ritmo.</p></div></div><div className="organic-timeline">{moments.map((moment,i)=><div className={`journey-moment ${moment.state}`} key={moment.title}><i aria-hidden="true"></i><span><strong>{moment.title}</strong><small>{moment.note}</small></span></div>)}</div></section>
    <aside><section className="panel note-safe"><p className="eyebrow">ESPACIO PSICOLÓGICO</p><h2>Notas compartidas contigo</h2><p>Reflexiones y ejercicios de tu proceso terapéutico. Solo tú y tu psicóloga pueden acceder.</p><a className="secondary process-link" href="#notas-psicologicas">Ver notas</a></section><section className="panel medication"><p className="eyebrow">ESPACIO MÉDICO</p><h2>Indicaciones y medicación</h2><p>Información clínica gestionada únicamente por tu psiquiatra.</p><a className="secondary process-link" href="#indicaciones-medicas">Ver indicaciones</a></section></aside></div>
    <section className="native-record process-record" id="notas-psicologicas"><div className="native-record-card"><a className="native-close" href="#mi-proceso">×</a><a className="back-to-panel" href="#mi-proceso">← Volver a Mi proceso</a><div className="record-title"><p className="eyebrow">ESPACIO PSICOLÓGICO</p><h1>Notas compartidas contigo</h1><p>Reflexiones y ejercicios seleccionados por Laura Méndez para acompañar tu proceso.</p></div><div className="notes-list"><article><time>5 AGO 2026</time><h2>Reconocer antes de reaccionar</h2><p>Lograste identificar las sensaciones físicas que aparecen antes de que aumente la ansiedad. Continúa usando la pausa de tres respiraciones.</p><span>Ejercicio: registro de detonantes</span></article><article><time>29 JUL 2026</time><h2>Una respuesta más amable</h2><p>Exploramos cómo sustituir la exigencia inmediata por una pregunta: “¿Qué necesito en este momento?”.</p><span>Reflexión compartida</span></article><article><time>22 JUL 2026</time><h2>Primer mapa de ansiedad</h2><p>Identificaste situaciones laborales y cambios inesperados como detonantes frecuentes.</p><span>Objetivo terapéutico</span></article></div><section className="boundaries psych-boundary"><span>⌁</span><div><h3>Información psicológica protegida</h3><p>Estas notas no incluyen indicaciones médicas ni información de medicación.</p></div></section></div></section>
    <section className="native-record process-record" id="indicaciones-medicas"><div className="native-record-card"><a className="native-close" href="#mi-proceso">×</a><a className="back-to-panel" href="#mi-proceso">← Volver a Mi proceso</a><div className="record-title"><p className="eyebrow">ESPACIO MÉDICO</p><h1>Indicaciones y medicación</h1><p>Información gestionada por el Dr. Diego Ríos.</p></div><section className="panel medication-detail"><div><p className="eyebrow">TRATAMIENTO ACTUAL</p><h2>Sertralina</h2><p>50 mg · Una vez al día · Después del desayuno</p></div><span className="role-badge blue">Activa</span></section><section className="panel"><p className="eyebrow">ÚLTIMA INDICACIÓN · 1 AGO 2026</p><p>Mantener la dosis actual y registrar cualquier cambio relevante en sueño, apetito o nivel de ansiedad para revisarlo en la próxima consulta.</p><p className="doctor-sign">Dr. Diego Ríos · Psiquiatría</p></section><section className="boundaries medical-boundary"><span>⌁</span><div><h3>Información médica protegida</h3><p>No modifiques ni suspendas una indicación sin consultar a tu psiquiatra.</p></div></section></div></section>
  </div>;
}

function Team({ onMessage }: { onMessage: (chatId: string) => void }) {
  const [profile, setProfile] = useState<string | null>(null);
  const people = [{id:'laura',name:'Laura Méndez',role:'Psicóloga clínica',initial:'LM',color:'sage',desc:'Acompañamiento terapéutico · Martes 10:00 AM',bio:'Psicóloga clínica especializada en ansiedad y regulación emocional.'},{id:'diego',name:'Dr. Diego Ríos',role:'Psiquiatra',initial:'DR',color:'blue',desc:'Seguimiento médico · Próxima cita 28 ago.',bio:'Psiquiatra responsable del seguimiento médico y las indicaciones de tratamiento.'}];
  const selected = people.find(person=>person.id===profile);
  if(selected) return <div className="page-content professional-profile"><button className="back-to-team" onClick={()=>setProfile(null)}>← Volver a Mi equipo</button><section className="profile-hero"><div className={`avatar xl ${selected.color}`}>{selected.initial}</div><div><p className="eyebrow">PERFIL PROFESIONAL</p><h1>{selected.name}</h1><p>{selected.role}</p></div><button className="primary" onClick={()=>onMessage(selected.id)}>Enviar mensaje</button></section><div className="profile-detail-grid"><section className="panel"><h2>Sobre {selected.name.split(' ')[0]}</h2><p>{selected.bio}</p><h3>Enfoque de acompañamiento</h3><div className="specialties">{(selected.id==='laura'?['Ansiedad','Regulación emocional','Terapia cognitivo-conductual']:['Seguimiento farmacológico','Psiquiatría de adultos','Salud integral']).map(item=><span key={item}>{item}</span>)}</div></section><aside><section className="panel next-contact"><p className="eyebrow">PRÓXIMO ENCUENTRO</p><h2>{selected.id==='laura'?'Martes, 18 de agosto':'Viernes, 28 de agosto'}</h2><p>{selected.id==='laura'?'10:00 AM · Videollamada':'12:30 PM · Consulta médica'}</p></section><section className={`panel ${selected.id==='laura'?'note-safe':'medication'}`}><p className="eyebrow">{selected.id==='laura'?'ESPACIO PSICOLÓGICO':'ESPACIO MÉDICO'}</p><p>{selected.id==='laura'?'Este perfil acompaña tu proceso terapéutico y notas compartidas.':'Este perfil gestiona tus indicaciones médicas y medicación.'}</p></section></aside></div></div>;
  return <div className="page-content"><div className="page-heading"><p className="eyebrow">RED DE APOYO</p><h1>Mi equipo</h1><p>Las personas que te acompañan en tu bienestar.</p></div><div className="profile-grid">{people.map(p=><section className="profile-card" key={p.name}><div className={`avatar large ${p.color}`}>{p.initial}</div><h2>{p.name}</h2><p>{p.role}</p><div className="divider"></div><span>{p.desc}</span><div><button className="primary" onClick={()=>onMessage(p.id)}>Mensaje</button><button className="secondary" onClick={()=>setProfile(p.id)}>Ver perfil</button></div></section>)}</div><section className="boundaries"><span>⌁</span><div><h3>Tu privacidad define los límites</h3><p>La información psicológica y médica se mantiene separada. Cada profesional accede únicamente a lo necesario para tu atención.</p></div></section></div>
}

function Messages({ initialChat = 'laura' }: { initialChat?: string }) {
  const chats = [
    { id:'laura', n:'Laura Méndez', m:'Gracias por compartirlo, Ana.', t:'10:42', c:'sage', i:'LM', status:'Disponible', history:[['theirs','Hola, Ana. ¿Cómo te fue con el ejercicio de respiración?'],['mine','Me ayudó bastante antes de la reunión. Pude notar la ansiedad sin dejar que creciera tanto.'],['theirs','Gracias por compartirlo, Ana. Es un avance importante reconocerlo en el momento.']] },
    { id:'diego', n:'Dr. Diego Ríos', m:'Recibí tu registro. Lo revisamos...', t:'Ayer', c:'blue', i:'DR', status:'Responde en horario de consulta', history:[['theirs','Hola, Ana. Recibí tu registro de seguimiento.'],['mine','Gracias, doctor. He seguido la indicación como acordamos.'],['theirs','Perfecto. Lo revisamos con calma en la próxima consulta. Si notas algún cambio importante, escríbeme por aquí.']] },
  ];
  const [activeId, setActiveId] = useState(initialChat);
  const [drafts, setDrafts] = useState<Record<string,string>>({laura:'',diego:''});
  const [sent, setSent] = useState<Record<string,string[]>>({laura:[],diego:[]});
  const active = chats.find(chat=>chat.id===activeId)!;
  const draft = drafts[activeId] || '';
  const send = () => { if (draft.trim()) { setSent({...sent,[activeId]:[...(sent[activeId]||[]),draft.trim()]}); setDrafts({...drafts,[activeId]:''}); } };
  return <div className="page-content"><div className="page-heading"><p className="eyebrow">CONVERSACIONES SEGURAS</p><h1>Mensajes</h1></div><div className="messages"><aside>{chats.map(x=><button className={activeId===x.id?'active':''} onClick={()=>setActiveId(x.id)} aria-pressed={activeId===x.id} key={x.id}><div className={`avatar ${x.c}`}>{x.i}</div><span><strong>{x.n}</strong><small>{x.m}</small></span><time>{x.t}</time></button>)}</aside><section className="chat"><header><div className={`avatar ${active.c}`}>{active.i}</div><div><strong>{active.n}</strong><span><i className="online"></i> {active.status}</span></div></header><div className="chat-body"><p className="day">HOY</p>{active.history.map(([side,message],i)=><div className={`bubble ${side}`} key={i}>{message}</div>)}{(sent[activeId]||[]).map((message,i)=><div className="bubble mine" key={`sent-${i}`}>{message}<small className="sent-status">Enviado ✓</small></div>)}</div><footer><input value={draft} onChange={e=>setDrafts({...drafts,[activeId]:e.target.value})} onKeyDown={e=>{if(e.key==='Enter')send()}} placeholder={`Mensaje para ${active.n}…`}/><button aria-label={`Enviar mensaje a ${active.n}`} disabled={!draft.trim()} onClick={send}>→</button></footer></section></div></div>
}

function ProfessionalHome({ role, onMessages }: { role: Exclude<Role,'Paciente'>; onMessages: () => void }) {
  const isPsych = role === 'Psicólogo';
  const [patient, setPatient] = useState<string | null>(null);
  const patients = [{id:'ana-rodriguez',name:'Ana Rodríguez',initial:'AR',age:'32 años',last:'5 ago. 2026'},{id:'martin-solis',name:'Martín Solís',initial:'MS',age:'41 años',last:'29 jul. 2026'},{id:'carla-vega',name:'Carla Vega',initial:'CV',age:'27 años',last:'7 ago. 2026'}];
  const current = patients.find(item=>item.id===patient);
  useEffect(() => {
    const card = document.querySelector('#panel-profesional .stats section:first-child');
    if (!card || card.querySelector('.next-session-link')) return;
    const link = document.createElement('a');
    link.className = 'next-session-link';
    link.href = '#proxima-sesion';
    link.textContent = 'Ir a próxima sesión →';
    card.appendChild(link);
    let patientSummaryLink: HTMLAnchorElement | null = null;
    let patientSummaryScreen: HTMLElement | null = null;
    if (isPsych) {
      patientSummaryLink = document.createElement('a');
      patientSummaryLink.className = 'patient-summary-button';
      patientSummaryLink.href = '#resumen-paciente';
      patientSummaryLink.textContent = 'Resumen del paciente';
      card.appendChild(patientSummaryLink);
      patientSummaryScreen = document.createElement('section');
      patientSummaryScreen.className = 'patient-summary-screen';
      patientSummaryScreen.id = 'resumen-paciente';
      patientSummaryScreen.innerHTML = `<div class="patient-summary-page"><a class="native-close" href="#panel-profesional" aria-label="Cerrar resumen">×</a><a class="back-to-panel" href="#panel-profesional">← Volver al panel</a><header class="clinical-summary-header"><div class="avatar xl sage">AR</div><div><p class="eyebrow">RESUMEN DEL PACIENTE</p><h1>Ana Rodríguez</h1><p>Vista integrada para preparar el acompañamiento clínico.</p></div><span class="role-badge sage">Solo Psicología</span></header><div class="clinical-overview"><section><small>Sesiones compartidas</small><strong>4</strong><span>Desde julio de 2026</span></section><section><small>Último registro</small><strong>11 AGO</strong><span>Estado de ánimo</span></section><section><small>Próximo encuentro</small><strong>18 AGO</strong><span>10:00 AM</span></section></div><div class="clinical-summary-grid"><main><section class="panel"><p class="eyebrow">SÍNTESIS CLÍNICA</p><h2>Panorama del proceso</h2><p>Ana está desarrollando mayor conciencia de sus detonantes de ansiedad y de las señales corporales que aparecen antes de que aumente el malestar. Comienza a utilizar pausas breves y respiración consciente en situaciones laborales.</p></section><section class="panel note-safe"><p class="eyebrow">NOTAS RECIENTES</p><h2>Aspectos para retomar</h2><ul><li>Explorar la autoexigencia antes de reuniones importantes.</li><li>Reconocer qué condiciones facilitan una respuesta más amable.</li><li>Preguntar cómo vivió el uso de la pausa fuera de sesión.</li></ul></section></main><aside><section class="panel survey-summary"><p class="eyebrow">ENCUESTAS Y REGISTROS</p><h2>Últimas respuestas</h2><div><span>Ansiedad percibida</span><strong>6 / 10</strong></div><div><span>Calidad de sueño</span><strong>7 / 10</strong></div><div><span>Uso de respiración</span><strong>3 veces</strong></div><blockquote>“Me ayudó bastante antes de la reunión.”</blockquote></section><section class="panel access-limit"><p class="eyebrow">PRIVACIDAD</p><p>Este resumen integra únicamente información psicológica autorizada. No muestra indicaciones médicas ni medicación.</p></section></aside></div></div>`;
      document.body.appendChild(patientSummaryScreen);
    }
    const screen = document.createElement('section');
    screen.className = 'next-session-screen';
    screen.id = 'proxima-sesion';
    screen.innerHTML = `<div class="next-session-card"><a class="native-close" href="#panel-profesional" aria-label="Cerrar próxima sesión">×</a><a class="back-to-panel" href="#panel-profesional">← Volver al panel</a><div class="call-placeholder"><span>VC</span><p class="eyebrow">PRÓXIMA SESIÓN</p><h1>Sala de videollamada</h1><p>Este espacio está preparado para la siguiente sesión con Ana Rodríguez.</p><div><strong>10:00 AM</strong><small>Psicoterapia individual · 50 min</small></div>${isPsych?'<button class="session-summary-toggle" type="button">Ver resumen del proceso</button>':''}<button class="primary" type="button" disabled>Iniciar sesión próximamente</button><small>La función de videollamada se desarrollará en el siguiente paso.</small></div>${isPsych?`<section class="patient-session-summary" hidden><div class="summary-heading"><div><p class="eyebrow">PREPARACIÓN DE SESIÓN</p><h2>Resumen del proceso de Ana</h2><p>Síntesis privada para acompañar la próxima conversación.</p></div><span class="role-badge sage">Solo Psicología</span></div><div class="summary-grid"><article><span>01</span><h3>Lo que han trabajado</h3><p>Identificación de detonantes laborales, escucha de sensaciones físicas y práctica de una pausa consciente.</p></article><article><span>02</span><h3>Avances observados</h3><p>Ana reconoce antes el aumento de ansiedad y ha usado respiraciones breves antes de reuniones exigentes.</p></article><article><span>03</span><h3>Comentarios de la paciente</h3><blockquote>“Pude notar la ansiedad sin dejar que creciera tanto.”</blockquote><small>Registro compartido · 11 ago.</small></article><article><span>04</span><h3>Notas para retomar</h3><p>Explorar la exigencia inmediata y reforzar respuestas internas más amables, sin convertirlas en una tarea.</p></article></div><section class="overall-summary"><p class="eyebrow">MIRADA GENERAL</p><p>Ana está construyendo mayor conciencia sobre sus patrones y comienza a incorporar recursos de regulación en situaciones reales. Conviene abrir la sesión reconociendo estos cambios y preguntando qué necesita seguir explorando a su ritmo.</p></section></section>`:''}</div>`;
    document.body.appendChild(screen);
    const aiSummaryLinks: HTMLAnchorElement[] = [];
    const aiSummaryScreens: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('#panel-profesional .appointment').forEach((row,index) => {
      const item = patients[index];
      if (!item) return;
      const link = document.createElement('a');
      link.className = 'ai-summary-link';
      link.href = `#resumen-ia-${item.id}`;
      link.textContent = 'Resumen IA';
      row.querySelector('.record-link')?.before(link);
      aiSummaryLinks.push(link);
      const summaryScreen = document.createElement('section');
      summaryScreen.className = 'patient-summary-screen';
      summaryScreen.id = `resumen-ia-${item.id}`;
      summaryScreen.innerHTML = `<div class="patient-summary-page"><a class="native-close" href="#panel-profesional" aria-label="Cerrar resumen">×</a><a class="back-to-panel" href="#panel-profesional">← Volver a próximas consultas</a><header class="clinical-summary-header"><div class="avatar xl ${isPsych?'sage':'blue'}">${item.initial}</div><div><p class="eyebrow">RESUMEN CON IA</p><h1>${item.name}</h1><p>Síntesis de información relevante para preparar la próxima consulta.</p></div><span class="role-badge ${isPsych?'sage':'blue'}">Solo ${isPsych?'Psicología':'Psiquiatría'}</span></header><div class="clinical-summary-grid"><main><section class="panel"><p class="eyebrow">${isPsych?'SÍNTESIS DEL PROCESO':'SÍNTESIS MÉDICA'}</p><h2>${isPsych?'Panorama reciente':'Seguimiento reciente'}</h2><p>${isPsych?'Se observan avances en el reconocimiento de detonantes, sensaciones corporales y uso de recursos de regulación en situaciones cotidianas.':'El seguimiento reciente registra continuidad en las indicaciones, tolerancia estable y aspectos a revisar durante la próxima consulta.'}</p></section><section class="panel ${isPsych?'note-safe':'medication'}"><p class="eyebrow">PARA RETOMAR</p><h2>Temas sugeridos</h2><ul><li>${isPsych?'Explorar experiencias recientes y recursos utilizados.':'Revisar tolerancia, sueño y cambios relevantes.'}</li><li>${isPsych?'Reconocer avances sin convertirlos en evaluación.':'Confirmar adherencia a las indicaciones actuales.'}</li><li>Preguntar qué necesita conversar hoy.</li></ul></section></main><aside><section class="panel survey-summary"><p class="eyebrow">REGISTROS RECIENTES</p><h2>Información integrada</h2><div><span>Último registro</span><strong>11 AGO</strong></div><div><span>Próxima consulta</span><strong>${10+index}:00 AM</strong></div><blockquote>Resumen generado a partir de notas y registros autorizados.</blockquote></section><section class="panel access-limit"><p class="eyebrow">LÍMITE DE ACCESO</p><p>${isPsych?'No incluye indicaciones médicas ni medicación.':'No incluye notas privadas de psicoterapia.'}</p></section></aside></div></div>`;
      document.body.appendChild(summaryScreen);
      aiSummaryScreens.push(summaryScreen);
    });
    const summaryButton = screen.querySelector<HTMLButtonElement>('.session-summary-toggle');
    const summary = screen.querySelector<HTMLElement>('.patient-session-summary');
    const agendaCard = document.querySelector<HTMLElement>('#panel-profesional .stats section:nth-child(3)');
    const agendaButton = document.createElement('a');
    agendaButton.className = 'agenda-button';
    agendaButton.href = '#agenda-profesional';
    agendaButton.textContent = 'Abrir agenda →';
    agendaCard?.appendChild(agendaButton);
    const agendaScreen = document.createElement('section');
    agendaScreen.className = 'professional-agenda-screen';
    agendaScreen.id = 'agenda-profesional';
    agendaScreen.innerHTML = `<div class="professional-agenda-page"><a class="native-close" href="#panel-profesional" aria-label="Cerrar agenda">×</a><a class="back-to-panel" href="#panel-profesional">← Volver al panel</a><div class="record-title"><p class="eyebrow">AGENDA PROFESIONAL</p><h1>Organiza tus citas</h1><p>Selecciona una consulta para reprogramarla, posponerla o cancelarla.</p></div><div class="agenda-workspace"><section class="panel agenda-calendar"><header><button type="button" aria-label="Mes anterior">‹</button><strong>Agosto 2026</strong><button type="button" aria-label="Mes siguiente">›</button></header><div class="weekdays">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}</div><div class="days">${Array.from({length:35},(_,i)=>i<5?'':i-4).map(day=>day?`<button type="button" class="${[18,25,27].includes(Number(day))?'has-appointment':''} ${day===18?'selected':''}" data-day="${day}">${day}</button>`:'<span></span>').join('')}</div><div class="calendar-legend"><span><i class="appointment-dot"></i>Con cita</span><span><i class="available"></i>Disponible</span></div></section><aside class="panel agenda-detail"><p class="eyebrow">CITA SELECCIONADA</p><h2>Ana Rodríguez</h2><p class="agenda-current">18 de agosto · 10:00 AM</p><label>Paciente<select><option>Ana Rodríguez</option><option>Martín Solís</option><option>Carla Vega</option></select></label><label>Nueva hora<select><option>10:00 AM</option><option>11:30 AM</option><option>1:00 PM</option><option>4:30 PM</option></select></label><div class="agenda-actions"><button type="button" data-action="reprogramada" class="primary">Reprogramar</button><button type="button" data-action="pospuesta" class="secondary">Posponer</button><button type="button" data-action="cancelada" class="danger-action">Cancelar cita</button></div><p class="agenda-feedback" aria-live="polite"></p></aside></div></div>`;
    document.body.appendChild(agendaScreen);
    const agendaCurrent = agendaScreen.querySelector<HTMLElement>('.agenda-current');
    agendaScreen.querySelectorAll<HTMLButtonElement>('[data-day]').forEach(dayButton=>dayButton.addEventListener('click',()=>{agendaScreen.querySelectorAll('[data-day]').forEach(x=>x.classList.remove('selected'));dayButton.classList.add('selected');if(agendaCurrent)agendaCurrent.textContent=`${dayButton.dataset.day} de agosto · 10:00 AM`;}));
    agendaScreen.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(actionButton=>actionButton.addEventListener('click',()=>{const feedback=agendaScreen.querySelector<HTMLElement>('.agenda-feedback');const patientSelect=agendaScreen.querySelector<HTMLSelectElement>('.agenda-detail label select');if(feedback)feedback.textContent=`La cita de ${patientSelect?.value||'la persona seleccionada'} quedó ${actionButton.dataset.action}.`;}));
    summaryButton?.addEventListener('click', () => {
      if (!summary) return;
      summary.hidden = !summary.hidden;
      summaryButton.textContent = summary.hidden ? 'Ver resumen del proceso' : 'Ocultar resumen del proceso';
      if (!summary.hidden) summary.scrollIntoView({behavior:'smooth',block:'start'});
    });
    return () => { link.remove(); screen.remove(); agendaButton.remove(); agendaScreen.remove(); patientSummaryLink?.remove(); patientSummaryScreen?.remove(); aiSummaryLinks.forEach(item=>item.remove()); aiSummaryScreens.forEach(item=>item.remove()); };
  }, [role]);
  if(current) return <div className="page-content record-view"><button className="back-to-team" onClick={()=>setPatient(null)}>← Volver al panel</button><section className="record-header"><div className="avatar xl">{current.initial}</div><div><p className="eyebrow">EXPEDIENTE DEL PACIENTE</p><h1>{current.name}</h1><p>{current.age} · Última consulta: {current.last}</p></div><span className={`role-badge ${isPsych?'sage':'blue'}`}>Vista {role}</span></section><div className="record-grid"><main><section className="panel"><p className="eyebrow">RESUMEN</p><h2>{isPsych?'Proceso terapéutico':'Seguimiento médico'}</h2><div className="record-metrics"><span><small>{isPsych?'Sesiones':'Consultas'}</small><strong>{current.name==='Ana Rodríguez'?'4':'3'}</strong></span><span><small>Próxima cita</small><strong>{current.name==='Ana Rodríguez'?'18 AGO':'25 AGO'}</strong></span><span><small>Estado</small><strong>Activo</strong></span></div></section><section className={`panel ${isPsych?'note-safe':'medication'}`}><p className="eyebrow">{isPsych?'NOTAS PSICOLÓGICAS':'INDICACIONES MÉDICAS'}</p><h2>{isPsych?'Última nota de sesión':'Tratamiento actual'}</h2>{isPsych?<><p>La paciente identificó con mayor claridad sus detonantes y practicó una pausa consciente durante una situación laboral.</p><button className="secondary">Añadir nota de sesión</button></>:<><div className="medication-row"><span><strong>Sertralina</strong><small>50 mg · Una vez al día</small></span><i>Activa</i></div><p>Seguimiento de tolerancia y respuesta clínica en la próxima consulta.</p><button className="secondary">Actualizar indicaciones</button></>}</section></main><aside><section className="panel"><p className="eyebrow">DATOS DE CONTACTO</p><p>ana@ejemplo.com</p><p>+52 55 0000 0000</p></section><section className="panel access-limit"><p className="eyebrow">LÍMITE DE ACCESO</p><p>{isPsych?'Las indicaciones y la medicación permanecen bajo gestión exclusiva de Psiquiatría.':'Las notas privadas de psicoterapia no son visibles desde este expediente médico.'}</p></section></aside></div></div>;
  return <div className="page-content professional" id="panel-profesional"><div className="hero-row"><div><p className="eyebrow">PANEL PROFESIONAL</p><h1>Hola, {isPsych ? 'Laura' : 'Diego'}</h1><p>{isPsych ? 'Acompaña el proceso terapéutico de tus pacientes.' : 'Revisa seguimientos e indicaciones médicas.'}</p></div><span className={`role-badge ${isPsych?'sage':'blue'}`}>{role}</span></div><div className="stats"><section><span>Sesiones de hoy</span><strong>{isPsych?'5':'3'}</strong><small>Próxima en 35 min</small></section><section><span>Mensajes pendientes</span><strong>2</strong><button onClick={onMessages}>Revisar mensajes →</button></section><section><span>{isPsych?'Procesos activos':'Seguimientos activos'}</span><strong>{isPsych?'18':'12'}</strong><small>Esta semana</small></section></div><section className="panel professional-list"><div className="section-title"><div><p className="eyebrow">AGENDA DE HOY</p><h2>Próximas consultas</h2></div></div>{patients.map((item,i)=><div className="appointment" key={item.id}><div className={`avatar ${i===0?'sage':''}`}>{item.initial}</div><span><strong>{item.name}</strong><small>{10+i}:00 AM · {isPsych?'Psicoterapia individual':'Seguimiento médico'}</small></span><a className="secondary record-link" href={`#expediente-${item.id}`}>Abrir expediente</a></div>)}</section><section className={`boundaries ${isPsych?'psych-boundary':'medical-boundary'}`}><span>⌁</span><div><h3>{isPsych?'Área psicológica protegida':'Área médica protegida'}</h3><p>{isPsych?'Puedes consultar notas terapéuticas, pero no modificar prescripciones médicas.':'Puedes gestionar indicaciones y medicación, sin acceso a notas privadas de psicoterapia.'}</p></div></section>{patients.map(item=><section className="native-record" id={`expediente-${item.id}`} key={`record-${item.id}`}><div className="native-record-card"><a className="native-close" href="#panel-profesional" aria-label="Cerrar expediente">×</a><div className="record-header"><div className="avatar xl">{item.initial}</div><div><p className="eyebrow">EXPEDIENTE DEL PACIENTE</p><h1>{item.name}</h1><p>{item.age} · Última consulta: {item.last}</p></div><span className={`role-badge ${isPsych?'sage':'blue'}`}>Vista {role}</span></div><div className="record-grid"><main><section className="panel"><p className="eyebrow">RESUMEN</p><h2>{isPsych?'Proceso terapéutico':'Seguimiento médico'}</h2><div className="record-metrics"><span><small>{isPsych?'Sesiones':'Consultas'}</small><strong>{item.id==='ana-rodriguez'?'4':'3'}</strong></span><span><small>Próxima cita</small><strong>{item.id==='carla-vega'?'27 AGO':'25 AGO'}</strong></span><span><small>Estado</small><strong>Activo</strong></span></div></section><section className={`panel ${isPsych?'note-safe':'medication'}`}><p className="eyebrow">{isPsych?'NOTAS PSICOLÓGICAS':'INDICACIONES MÉDICAS'}</p><h2>{isPsych?'Última nota de sesión':'Tratamiento actual'}</h2><p>{isPsych?'Avances recientes del proceso terapéutico y próximos objetivos acordados.':'Seguimiento de tolerancia y respuesta clínica para la próxima consulta.'}</p></section></main><aside><section className="panel access-limit"><p className="eyebrow">LÍMITE DE ACCESO</p><p>{isPsych?'La medicación permanece bajo gestión exclusiva de Psiquiatría.':'Las notas privadas de psicoterapia no son visibles aquí.'}</p></section></aside></div><a className="back-to-panel" href="#panel-profesional">← Volver al panel</a></div></section>)}</div>;
}

function Profile({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const [editing, setEditing] = useState(false);
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({messages:true,appointments:true,email:false});
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [profileOverrides, setProfileOverrides] = useState<Record<string,{name?:string;license?:string}>>({});
  useEffect(() => {
    const saved = window.localStorage.getItem('vicino_notification_preferences');
    if (saved) setNotifications(JSON.parse(saved));
    setNotificationsLoaded(true);
  }, []);
  useEffect(() => {
    if (notificationsLoaded) window.localStorage.setItem('vicino_notification_preferences', JSON.stringify(notifications));
  }, [notifications, notificationsLoaded]);
  useEffect(() => {
    const saved = window.localStorage.getItem('vicino_profile_overrides');
    if (saved) setProfileOverrides(JSON.parse(saved));
  }, []);
  useEffect(() => {
    const captureSave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button');
      if (!button || button.textContent?.trim() !== 'Guardar cambios') return;
      const modal = button.closest('.modal');
      const inputs = modal?.querySelectorAll<HTMLInputElement>('input');
      if (!inputs?.length) return;
      const next = {...profileOverrides,[role]:{name:inputs[0]?.value.trim(),license:inputs.length>2?inputs[2]?.value.trim():''}};
      setProfileOverrides(next);
      window.localStorage.setItem('vicino_profile_overrides',JSON.stringify(next));
    };
    document.addEventListener('click',captureSave,true);
    return () => document.removeEventListener('click',captureSave,true);
  }, [profileOverrides, role]);
  const baseData = role==='Paciente'?{initial:'AR',name:'Ana Rodríguez',subtitle:'Paciente desde julio de 2026',license:'',color:'',items:['Información personal','Privacidad y seguridad','Notificaciones','Ayuda y acompañamiento']}:role==='Psicólogo'?{initial:'LM',name:'Laura Méndez',subtitle:'Psicóloga clínica',license:'Cédula profesional · 12345678',color:'sage',items:['Información profesional','Disponibilidad y agenda','Privacidad y seguridad','Notificaciones']}: {initial:'DR',name:'Dr. Diego Ríos',subtitle:'Psiquiatra',license:'Cédula profesional · 87654321',color:'blue',items:['Información profesional','Disponibilidad y agenda','Seguridad clínica','Notificaciones']};
  const override = profileOverrides[role] || {};
  const data = {...baseData,name:override.name||baseData.name,license:override.license?`Cédula profesional · ${override.license}`:baseData.license};
  const settingContent = () => {
    if(activeSetting?.includes('Información') && role==='Paciente') return <><p className="eyebrow">INFORMACIÓN PERSONAL</p><h2>Datos personales</h2><label className="edit-field">Nombre completo<input defaultValue={data.name}/></label><label className="edit-field">Correo electrónico<input type="email" defaultValue="ana@ejemplo.com"/></label><label className="edit-field">Teléfono<input type="tel" defaultValue="+52 55 0000 0000"/></label><label className="edit-field">Fecha de nacimiento<input type="date" defaultValue="1994-04-12"/></label><button className="primary" onClick={()=>setActiveSetting(null)}>Guardar datos personales</button></>;
    if(activeSetting?.includes('Información')) return <><p className="eyebrow">INFORMACIÓN PROFESIONAL</p><h2>Datos de tu práctica</h2><label className="edit-field">Nombre profesional<input defaultValue={data.name}/></label><label className="edit-field">Especialidad<input defaultValue={role==='Psicólogo'?'Psicología clínica':'Psiquiatría de adultos'}/></label>{data.license&&<label className="edit-field">Cédula profesional<input defaultValue={data.license.replace('Cédula profesional · ','')}/></label>}<label className="edit-field">Descripción<textarea defaultValue={role==='Psicólogo'?'Acompañamiento en ansiedad y regulación emocional.':'Seguimiento psiquiátrico integral y farmacológico.'}/></label><button className="primary" onClick={()=>setActiveSetting(null)}>Guardar información</button></>;
    if(activeSetting?.includes('Disponibilidad')) return <><p className="eyebrow">AGENDA PROFESIONAL</p><h2>Disponibilidad semanal</h2><div className="availability-list">{['Lunes','Martes','Miércoles','Jueves','Viernes'].map((day,i)=><label key={day}><input type="checkbox" defaultChecked={i<4}/><strong>{day}</strong><span>{i<4?'9:00 AM – 5:00 PM':'No disponible'}</span></label>)}</div><button className="primary" onClick={()=>setActiveSetting(null)}>Guardar disponibilidad</button></>;
    if(activeSetting?.includes('Privacidad')||activeSetting?.includes('Seguridad')) return <><p className="eyebrow">PRIVACIDAD Y SEGURIDAD</p><h2>Protección de tu cuenta</h2><div className="security-options"><div><span><strong>Autenticación en dos pasos</strong><small>Protección adicional al iniciar sesión</small></span><input type="checkbox" defaultChecked/></div><div><span><strong>Sesiones activas</strong><small>1 dispositivo conectado</small></span><button>Revisar</button></div><div><span><strong>Cambiar contraseña</strong><small>Última actualización hace 3 meses</small></span><button>Actualizar</button></div></div><button className="primary" onClick={()=>setActiveSetting(null)}>Listo</button></>;
    return <><p className="eyebrow">NOTIFICACIONES</p><h2>Cómo quieres recibir avisos</h2><div className="security-options">{[['messages','Mensajes nuevos'],['appointments','Recordatorios de citas'],['email','Resumen por correo']].map(([key,label])=><div key={key}><span><strong>{label}</strong><small>{key==='email'?'Una vez por semana':'Aviso inmediato'}</small></span><input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={e=>setNotifications({...notifications,[key]:e.target.checked})}/></div>)}</div><button className="primary" onClick={()=>setActiveSetting(null)}>Guardar preferencias</button></>;
  };
  return <div className="page-content" id="perfil-profesional"><div className="page-heading"><p className="eyebrow">TU ESPACIO</p><h1>Perfil</h1></div><section className="profile-settings"><div className={`avatar xl ${data.color}`}>{data.initial}</div><div><h2>{data.name}</h2><p>{data.subtitle}</p>{data.license&&<small>{data.license}</small>}</div><button className="secondary" onClick={()=>setEditing(true)}>Editar perfil</button></section>{role!=='Paciente'&&<section className="professional-identity"><span className={`role-badge ${role==='Psicólogo'?'sage':'blue'}`}>{role}</span><div><strong>Perfil profesional verificado</strong><p>{role==='Psicólogo'?'Acceso al espacio psicológico y procesos terapéuticos.':'Acceso al espacio médico, indicaciones y medicación.'}</p></div></section>}<div className="settings-grid">{data.items.map((x,i)=>x.includes('Disponibilidad')?<a className="setting" href="#disponibilidad-agenda" key={x}><span>{['○','◇','◌','?'][i]}</span><strong>{x}</strong><i>→</i></a>:<button className="setting" onClick={()=>setActiveSetting(x)} key={x}><span>{['○','◇','◌','?'][i]}</span><strong>{x}</strong><i>→</i></button>)}</div><button className="logout" onClick={onLogout}>Cerrar sesión</button>{role!=='Paciente'&&<section className="native-record" id="disponibilidad-agenda"><div className="native-record-card"><a className="native-close" href="#perfil-profesional">×</a><a className="back-to-panel" href="#perfil-profesional">← Volver al perfil</a><div className="record-title"><p className="eyebrow">AGENDA PROFESIONAL</p><h1>Disponibilidad y agenda</h1><p>Define cuándo pueden reservar sesiones contigo.</p></div><section className="panel schedule-config"><h2>Horario semanal</h2>{['Lunes','Martes','Miércoles','Jueves','Viernes'].map((day,i)=><div key={day}><label><input type="checkbox" defaultChecked={i<4}/><strong>{day}</strong></label><select defaultValue={i<4?'09:00':'none'}><option value="none">No disponible</option><option value="09:00">9:00 AM</option><option value="10:00">10:00 AM</option></select><span>—</span><select defaultValue={i<4?'17:00':'none'}><option value="none">No disponible</option><option value="14:00">2:00 PM</option><option value="17:00">5:00 PM</option><option value="19:00">7:00 PM</option></select></div>)}</section><div className="schedule-rules"><section className="panel"><p className="eyebrow">DURACIÓN PREDETERMINADA</p><select defaultValue="50"><option value="30">30 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option></select></section><section className="panel"><p className="eyebrow">ANTICIPACIÓN MÍNIMA</p><select defaultValue="24"><option value="12">12 horas</option><option value="24">24 horas</option><option value="48">48 horas</option></select></section></div><a className="primary save-native" href="#perfil-profesional">Guardar disponibilidad</a></div></section>}{editing&&<div className="modal-backdrop" onClick={()=>setEditing(false)}><section className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setEditing(false)}>×</button><p className="eyebrow">EDITAR PERFIL</p><h2>{data.name}</h2><label className="edit-field">Nombre completo<input defaultValue={data.name}/></label><label className="edit-field">Rol profesional<input value={data.subtitle} readOnly/></label>{data.license&&<label className="edit-field">Cédula profesional<input defaultValue={data.license.replace('Cédula profesional · ','')}/></label>}<button className="primary" onClick={()=>setEditing(false)}>Guardar cambios</button></section></div>}{activeSetting&&<div className="modal-backdrop" onClick={()=>setActiveSetting(null)}><section className="modal settings-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setActiveSetting(null)}>×</button>{settingContent()}</section></div>}</div>
}

function Dashboard({ onLogout, initialRole, profileName, freshProfile }: { onLogout: () => void; initialRole: Role; profileName: string; freshProfile: boolean }) {
  const [tab, setTab] = useState<Tab>('Inicio');
  const [role, setRole] = useState<Role>(initialRole);
  const [selectedChat, setSelectedChat] = useState('laura');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [notificationItems,setNotificationItems]=useState<{id:string;title:string;detail:string;date:string}[]>([]);
  const [unreadMessages,setUnreadMessages]=useState(freshProfile?0:2);
  const [supportVisible, setSupportVisible] = useState(true);
  const visibleTabs:{name:Tab;label:string;icon:string}[] = role==='Paciente' ? tabs.filter(item=>item.name!=='Pacientes').map(item=>({...item,label:item.name})) : professionalTabs(role);
  useEffect(() => {
    const seen = window.localStorage.getItem('vicino_support_seen') === 'true';
    setSupportVisible(!seen);
    if(window.localStorage.getItem('vicino_messages_read')==='true')setUnreadMessages(0);
    if (seen) document.querySelector<HTMLElement>('.support')?.setAttribute('hidden','');
  }, []);
  useEffect(()=>{(async()=>{const client=createClient();if(role==='Paciente'){const {data}=await client.from('care_plan_items').select('id,title,resource_type,created_at').neq('kind','private_note').order('created_at',{ascending:false}).limit(8);setNotificationItems((data||[]).map(item=>({id:`resource-${item.id}`,title:'Nuevo recurso compartido',detail:item.title,date:item.created_at})))}else{const {data}=await client.from('invitations').select('id,invitee_name,email,accepted_at').eq('status','accepted').order('accepted_at',{ascending:false}).limit(8);setNotificationItems((data||[]).map(item=>({id:`invite-${item.id}`,title:'Invitación aceptada',detail:`${item.invitee_name||item.email} ya forma parte de tus pacientes.`,date:item.accepted_at})))}})()},[role]);
  useEffect(()=>{const seen=JSON.parse(window.localStorage.getItem('vicino_seen_notifications')||'[]') as string[];setNotificationsRead(notificationItems.length===0||notificationItems.every(item=>seen.includes(item.id)))},[notificationItems]);
  const openNotifications=()=>{const next=!notificationsOpen;setNotificationsOpen(next);if(next){setNotificationsRead(true);window.localStorage.setItem('vicino_seen_notifications',JSON.stringify(notificationItems.map(item=>item.id)))}};
  const markMessagesRead=()=>{setUnreadMessages(0);window.localStorage.setItem('vicino_messages_read','true')};
  const navigate=(next:Tab)=>{if(next==='Mensajes')markMessagesRead();setTab(next)};
  const changeRole = (next: Role) => { setRole(next); setTab('Inicio'); };
  const openMessage = (chatId: string) => { setSelectedChat(chatId); markMessagesRead(); setTab('Mensajes'); };
  useEffect(()=>{const open=(event:Event)=>{const chatId=(event as CustomEvent<{chatId:string}>).detail?.chatId;if(chatId)openMessage(chatId)};window.addEventListener('vicino:professional-message',open);return()=>window.removeEventListener('vicino:professional-message',open)},[]);
  useEffect(()=>{const open=()=>setTab('Pacientes');window.addEventListener('vicino:open-patients',open);return()=>window.removeEventListener('vicino:open-patients',open)},[]);
  useEffect(() => {
    const handleContact = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest('button');
      if (button?.textContent?.trim() !== 'Contactar') return;
      setSupportVisible(false);
      window.localStorage.setItem('vicino_support_seen','true');
      button.closest<HTMLElement>('.support')?.setAttribute('hidden','');
      setSelectedChat('laura');
      markMessagesRead();setTab('Mensajes');
      window.setTimeout(() => document.querySelector<HTMLInputElement>('.chat footer input')?.focus(), 60);
    };
    document.addEventListener('click', handleContact, true);
    return () => document.removeEventListener('click', handleContact, true);
  }, [role]);
  const patientInitials = profileName.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase() || 'VC';
  const identity = role==='Paciente'?{initial:patientInitials,name:profileName}:role==='Psicólogo'?{initial:'LM',name:'Laura Méndez'}:{initial:'DR',name:'Diego Ríos'};
  return <main className="dashboard"><aside className="sidebar"><Mark compact/><nav>{visibleTabs.map(item=><button className={tab===item.name?'active':''} onClick={()=>navigate(item.name)} key={item.name}><span className="nav-icon-wrap"><NavIcon name={item.name} fallback={item.icon}/></span>{item.label}{item.name==='Mensajes'&&unreadMessages>0&&<i>{unreadMessages}</i>}</button>)}</nav>{!freshProfile&&supportVisible&&<div className="support"><span>♡</span><strong>{role==='Paciente'?'¿Necesitas apoyo?':'Comunicación segura'}</strong><p>{role==='Paciente'?'Tu equipo está disponible.':unreadMessages>0?`Tienes ${unreadMessages} mensajes pendientes.`:'Mensajes al día.'}</p><button onClick={()=>navigate('Mensajes')}>Contactar</button></div>}<button className="side-profile" onClick={()=>navigate('Perfil')}><div className="avatar">{identity.initial}</div><span><strong>{identity.name}</strong><small>{role}</small></span><b>•••</b></button></aside>
    <section className="main"><header className="topbar"><div className="mobile-logo"><Mark compact/></div><label className="role-switch"><span>Perfil</span><select value={role} disabled><option>{role}</option></select></label><div className="notification-center">{!freshProfile&&<><button className="alert" aria-label="Abrir notificaciones" aria-expanded={notificationsOpen} onClick={openNotifications}>♧{!notificationsRead&&<i></i>}</button>{notificationsOpen&&<section className="notification-panel"><header><div><p className="eyebrow">ACTUALIZACIONES</p><h2>Notificaciones</h2></div><button onClick={()=>setNotificationsOpen(false)} aria-label="Cerrar notificaciones">×</button></header>{notificationItems.length===0?<div className="notification-empty"><strong>Todo está al día</strong><p>Los acontecimientos importantes aparecerán aquí.</p></div>:<div className="notification-list">{notificationItems.map(item=><article key={item.id}><span>✓</span><div><strong>{item.title}</strong><p>{item.detail}</p><small>{new Date(item.date).toLocaleDateString('es-MX',{day:'numeric',month:'short'})}</small></div></article>)}</div>}</section>}</>}</div><button className="logout-mini" onClick={onLogout}>Salir</button></header><div className="view">{freshProfile&&role==='Paciente'?<FreshPatientView tab={tab} name={profileName}/>:tab==='Inicio'?(role==='Paciente'?<Home onMessage={()=>openMessage('laura')} onProcess={()=>navigate('Proceso')} onTeam={()=>navigate('Equipo')}/>:<ProfessionalHome role={role} onMessages={()=>navigate('Mensajes')}/>):tab==='Agenda'?<ProfessionalAgenda/>:tab==='Pacientes'?<PatientsPanel/>:tab==='Seguimiento'?<ProfessionalWorkspace role={role} section="Seguimiento"/>:tab==='Recursos'?<ProfessionalWorkspace role={role} section="Recursos"/>:tab==='Proceso'?<Process/>:tab==='Equipo'?<Team onMessage={openMessage}/>:tab==='Mensajes'?<Messages key={selectedChat} initialChat={selectedChat}/>:<Profile role={role} onLogout={onLogout}/>}</div></section>
    <nav className="mobile-nav">{visibleTabs.map(item=><button className={tab===item.name?'active':''} onClick={()=>navigate(item.name)} key={item.name}><span className="nav-icon-wrap"><NavIcon name={item.name} fallback={item.icon}/></span>{item.label}{item.name==='Mensajes'&&unreadMessages>0&&<i>{unreadMessages}</i>}</button>)}</nav>
  </main>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role>('Paciente');
  const [profileName, setProfileName] = useState('');
  const [freshProfile, setFreshProfile] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    const supabase = createClient();
    const loadSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
        const actualRole: Role = profile?.role === 'psicologo' ? 'Psicólogo' : profile?.role === 'psiquiatra' ? 'Psiquiatra' : 'Paciente';
        setRole(actualRole);
        setProfileName(profile?.full_name?.trim() || '');
        setFreshProfile(actualRole === 'Paciente');
        setScreen(profile?.full_name?.trim() ? 'app' : 'profileSetup');
      }
      setCheckingSession(false);
    };
    loadSession();
  }, []);
  const login = async (nextRole: Role) => {
    setRole(nextRole);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setScreen('login'); return; }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const name = profile?.full_name?.trim() || '';
    setProfileName(name);
    setFreshProfile(nextRole === 'Paciente');
    setScreen(name ? 'app' : 'profileSetup');
  };
  const finishProfileSetup = async (name: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setScreen('login'); return; }
    const { error } = await supabase.from('profiles').update({full_name:name}).eq('id',user.id);
    if (error) throw error;
    setProfileName(name);
    setFreshProfile(true);
    setScreen(window.localStorage.getItem('vicino_onboarding_seen_v02') === 'true' ? 'app' : 'onboarding');
  };
  const finishOnboarding = () => { window.localStorage.setItem('vicino_onboarding_seen_v02','true'); setScreen('app'); };
  const logout = async () => { await createClient().auth.signOut(); setScreen('login'); };
  if (checkingSession) return <main className="auth-loading">Preparando tu espacio…</main>;
  return screen === 'login' ? <Login onNext={login}/> : screen === 'profileSetup' ? <ProfileSetup onDone={finishProfileSetup}/> : screen === 'onboarding' ? <Onboarding onDone={finishOnboarding}/> : <Dashboard initialRole={role} profileName={profileName} freshProfile={freshProfile} onLogout={logout}/>;
}
