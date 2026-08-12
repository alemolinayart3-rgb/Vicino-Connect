"use client";

import { useEffect, useState } from "react";

type Screen = "login" | "onboarding" | "app";
type Tab = "Inicio" | "Proceso" | "Equipo" | "Mensajes" | "Perfil";
type Role = "Paciente" | "Psicólogo" | "Psiquiatra";

const tabs: { name: Tab; icon: string }[] = [
  { name: "Inicio", icon: "⌂" },
  { name: "Proceso", icon: "◒" },
  { name: "Equipo", icon: "♡" },
  { name: "Mensajes", icon: "✉" },
  { name: "Perfil", icon: "○" },
];

function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`} aria-label="Vicino Connect">
      <span className="mark" aria-hidden="true"><i></i><b></b></span>
      <span><strong>vicino</strong><small>connect</small></span>
    </div>
  );
}

function Login({ onNext }: { onNext: (role: Role, isNewAccount?: boolean) => void }) {
  const [role, setRole] = useState<Role>("Paciente");
  const demoEmails: Record<Role,string> = {Paciente:'ana@ejemplo.com',Psicólogo:'laura@vicino.mx',Psiquiatra:'diego@vicino.mx'};
  const [email, setEmail] = useState(demoEmails.Paciente);
  const selectRole = (nextRole: Role) => { setRole(nextRole); setEmail(demoEmails[nextRole]); };
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
          <p className="mini-brand">VICINO CONNECT</p>
          <h2>Qué gusto verte</h2>
          <p className="muted">Ingresa para continuar con tu proceso.</p>
          <div className="role-picker" aria-label="Selecciona tu perfil">
            {(['Paciente','Psicólogo','Psiquiatra'] as Role[]).map(item => (
              <button key={item} className={role === item ? 'selected' : ''} onClick={() => selectRole(item)}>{item}</button>
            ))}
          </div>
          <label>Correo electrónico<input value={email} onChange={e=>setEmail(e.target.value)} type="email" /></label>
          <label>Contraseña<div className="password"><input defaultValue="vicinoconnect" type="password" /><span>○</span></div></label>
          <div className="login-meta"><label className="remember"><input type="checkbox" defaultChecked /> Recordarme</label><button>Olvidé mi contraseña</button></div>
          <button className="primary" onClick={() => onNext(role, false)}>Continuar <span>→</span></button>
          <p className="signup">¿Es tu primera vez? <button onClick={() => onNext(role, true)}>Crear una cuenta</button></p>
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

function Home({ onMessage }: { onMessage: () => void }) {
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
    <section className="session-card">
      <div className="date-block"><strong>{session.day}</strong><span>AGO</span></div>
      <div className="session-info"><p className="eyebrow">PRÓXIMA SESIÓN</p><h2>Psicoterapia individual</h2><p>{session.time} · 50 min · Videollamada</p></div>
      <div className="therapist"><div className="avatar sage">LM</div><div><strong>Laura Méndez</strong><span>Psicóloga clínica</span></div></div>
      <button className="secondary" onClick={openDetails}>Ver detalles</button>
    </section>
    <div className="content-grid">
      <section><div className="section-title"><div><p className="eyebrow">CONTINUIDAD</p><h2>Tu proceso</h2></div><button>Ver todo →</button></div>
        <div className="process-card"><div className="progress-ring"><strong>4</strong><span>semanas</span></div><div><h3>Reconocer mis patrones de ansiedad</h3><p>Estás trabajando en identificar detonantes y crear respuestas más amables.</p><div className="progress"><i></i></div><span className="caption">3 de 5 pasos completados</span></div></div>
      </section>
      <section><div className="section-title"><div><p className="eyebrow">PARA TI</p><h2>Un momento de calma</h2></div></div>
        <div className={`calm-card ${breathing ? 'playing' : ''}`}><button className="play" aria-label={breathing ? "Pausar respiración" : "Iniciar respiración"} onClick={() => setBreathing(!breathing)}>{breathing ? 'Ⅱ' : '▶'}</button><div><h3>{breathing ? 'Inhala lentamente…' : 'Respiración consciente'}</h3><p>{breathing ? 'Sigue el ritmo del círculo. Exhala con suavidad.' : 'Una pausa guiada para volver al presente.'}</p><span>{breathing ? 'En curso · toca para pausar' : '5 minutos'}</span></div></div>
      </section>
    </div>
    <section className="team-strip"><div><p className="eyebrow">TU RED DE APOYO</p><h2>Tu equipo está cerca</h2></div><div className="team-person"><div className="avatar sage">LM</div><span><strong>Laura Méndez</strong><small>Psicóloga</small></span><i className="online"></i></div><div className="team-person"><div className="avatar blue">DR</div><span><strong>Diego Ríos</strong><small>Psiquiatra</small></span></div><button className="secondary" onClick={onMessage}>Enviar mensaje</button></section>
    {sessionOpen && <div className="modal-backdrop" onClick={() => setSessionOpen(false)}><section className={`modal ${scheduleStep==='calendar'?'calendar-modal':''}`} role="dialog" aria-modal="true" aria-label="Detalles de próxima sesión" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSessionOpen(false)}>×</button>{scheduleStep==='details'?<><p className="eyebrow">PRÓXIMA SESIÓN</p><h2>Psicoterapia individual</h2><div className="session-detail"><span><small>Fecha</small><strong>{session.day} de agosto de 2026</strong></span><span><small>Hora</small><strong>{session.time} · 50 min</strong></span><span><small>Modalidad</small><strong>Videollamada</strong></span><span><small>Profesional</small><strong>Laura Méndez</strong></span></div><div className="modal-actions"><button className="secondary" onClick={()=>{setSelectedDay(null);setSelectedTime('');setScheduleStep('calendar')}}>Reagendar sesión</button><button className="primary" onClick={() => setSessionOpen(false)}>Entendido</button></div></>:scheduleStep==='calendar'?<><button className="calendar-back" onClick={()=>setScheduleStep('details')}>← Detalles</button><p className="eyebrow">REAGENDAR SESIÓN</p><h2>Elige una nueva fecha</h2><div className="calendar-legend"><span><i className="available"></i>Disponible</span><span><i className="busy"></i>Ocupado</span></div><div className="calendar"><header><button>‹</button><strong>Agosto 2026</strong><button>›</button></header><div className="weekdays">{['L','M','M','J','V','S','D'].map((x,i)=><span key={i}>{x}</span>)}</div><div className="days">{Array.from({length:35},(_,i)=>i<5?null:i-4).map((day,i)=>day?<button key={i} disabled={busyDays.includes(day)||!availableDays.includes(day)} className={`${availableDays.includes(day)?'available':''} ${busyDays.includes(day)?'busy':''} ${selectedDay===day?'selected':''}`} onClick={()=>{setSelectedDay(day);setSelectedTime('')}}>{day}</button>:<span key={i}></span>)}</div></div>{selectedDay&&<div className="time-slots"><p>Horarios disponibles para el {selectedDay} de agosto</p><div>{['9:00 AM','10:30 AM','12:00 PM','4:00 PM'].map((time,i)=><button className={selectedTime===time?'selected':''} disabled={(selectedDay+i)%3===0} onClick={()=>setSelectedTime(time)} key={time}>{time}{(selectedDay+i)%3===0&&<small>Ocupado</small>}</button>)}</div></div>}<button className="primary confirm-schedule" disabled={!selectedDay||!selectedTime} onClick={confirmSchedule}>Confirmar nueva fecha</button></>:<div className="schedule-success"><span>✓</span><p className="eyebrow">SESIÓN REPROGRAMADA</p><h2>{session.day} de agosto · {session.time}</h2><p>Tu sesión con Laura Méndez quedó actualizada.</p><button className="primary" onClick={()=>setSessionOpen(false)}>Volver a Inicio</button></div>}</section></div>}
  </>;
}

function Process() {
  return <div className="page-content" id="mi-proceso"><div className="page-heading"><p className="eyebrow">TU CAMINO</p><h1>Mi proceso</h1><p>Una vista clara de lo que estás construyendo, paso a paso.</p></div>
    <div className="two-col"><section className="panel"><h2>Objetivo actual</h2><div className="goal"><span>◒</span><div><h3>Reconocer mis patrones de ansiedad</h3><p>Iniciado el 14 de julio · Con Laura Méndez</p></div></div><div className="timeline">{['Identificar detonantes','Observar sensaciones físicas','Practicar una pausa consciente','Reformular pensamientos','Crear mi plan personal'].map((x,i)=><div className={i<3?'done':''} key={x}><i>{i<3?'✓':i+1}</i><span><strong>{x}</strong><small>{i<3?'Completado':'Próximo paso'}</small></span></div>)}</div></section>
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
    if(activeSetting?.includes('Información')) return <><p className="eyebrow">INFORMACIÓN PROFESIONAL</p><h2>Datos de tu práctica</h2><label className="edit-field">Nombre profesional<input defaultValue={data.name}/></label><label className="edit-field">Especialidad<input defaultValue={role==='Psicólogo'?'Psicología clínica':'Psiquiatría de adultos'}/></label>{data.license&&<label className="edit-field">Cédula profesional<input defaultValue={data.license.replace('Cédula profesional · ','')}/></label>}<label className="edit-field">Descripción<textarea defaultValue={role==='Psicólogo'?'Acompañamiento en ansiedad y regulación emocional.':'Seguimiento psiquiátrico integral y farmacológico.'}/></label><button className="primary" onClick={()=>setActiveSetting(null)}>Guardar información</button></>;
    if(activeSetting?.includes('Disponibilidad')) return <><p className="eyebrow">AGENDA PROFESIONAL</p><h2>Disponibilidad semanal</h2><div className="availability-list">{['Lunes','Martes','Miércoles','Jueves','Viernes'].map((day,i)=><label key={day}><input type="checkbox" defaultChecked={i<4}/><strong>{day}</strong><span>{i<4?'9:00 AM – 5:00 PM':'No disponible'}</span></label>)}</div><button className="primary" onClick={()=>setActiveSetting(null)}>Guardar disponibilidad</button></>;
    if(activeSetting?.includes('Privacidad')||activeSetting?.includes('Seguridad')) return <><p className="eyebrow">PRIVACIDAD Y SEGURIDAD</p><h2>Protección de tu cuenta</h2><div className="security-options"><div><span><strong>Autenticación en dos pasos</strong><small>Protección adicional al iniciar sesión</small></span><input type="checkbox" defaultChecked/></div><div><span><strong>Sesiones activas</strong><small>1 dispositivo conectado</small></span><button>Revisar</button></div><div><span><strong>Cambiar contraseña</strong><small>Última actualización hace 3 meses</small></span><button>Actualizar</button></div></div><button className="primary" onClick={()=>setActiveSetting(null)}>Listo</button></>;
    return <><p className="eyebrow">NOTIFICACIONES</p><h2>Cómo quieres recibir avisos</h2><div className="security-options">{[['messages','Mensajes nuevos'],['appointments','Recordatorios de citas'],['email','Resumen por correo']].map(([key,label])=><div key={key}><span><strong>{label}</strong><small>{key==='email'?'Una vez por semana':'Aviso inmediato'}</small></span><input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={e=>setNotifications({...notifications,[key]:e.target.checked})}/></div>)}</div><button className="primary" onClick={()=>setActiveSetting(null)}>Guardar preferencias</button></>;
  };
  return <div className="page-content" id="perfil-profesional"><div className="page-heading"><p className="eyebrow">TU ESPACIO</p><h1>Perfil</h1></div><section className="profile-settings"><div className={`avatar xl ${data.color}`}>{data.initial}</div><div><h2>{data.name}</h2><p>{data.subtitle}</p>{data.license&&<small>{data.license}</small>}</div><button className="secondary" onClick={()=>setEditing(true)}>Editar perfil</button></section>{role!=='Paciente'&&<section className="professional-identity"><span className={`role-badge ${role==='Psicólogo'?'sage':'blue'}`}>{role}</span><div><strong>Perfil profesional verificado</strong><p>{role==='Psicólogo'?'Acceso al espacio psicológico y procesos terapéuticos.':'Acceso al espacio médico, indicaciones y medicación.'}</p></div></section>}<div className="settings-grid">{data.items.map((x,i)=>x.includes('Disponibilidad')?<a className="setting" href="#disponibilidad-agenda" key={x}><span>{['○','◇','◌','?'][i]}</span><strong>{x}</strong><i>→</i></a>:<button className="setting" onClick={()=>setActiveSetting(x)} key={x}><span>{['○','◇','◌','?'][i]}</span><strong>{x}</strong><i>→</i></button>)}</div><button className="logout" onClick={onLogout}>Cerrar sesión</button>{role!=='Paciente'&&<section className="native-record" id="disponibilidad-agenda"><div className="native-record-card"><a className="native-close" href="#perfil-profesional">×</a><a className="back-to-panel" href="#perfil-profesional">← Volver al perfil</a><div className="record-title"><p className="eyebrow">AGENDA PROFESIONAL</p><h1>Disponibilidad y agenda</h1><p>Define cuándo pueden reservar sesiones contigo.</p></div><section className="panel schedule-config"><h2>Horario semanal</h2>{['Lunes','Martes','Miércoles','Jueves','Viernes'].map((day,i)=><div key={day}><label><input type="checkbox" defaultChecked={i<4}/><strong>{day}</strong></label><select defaultValue={i<4?'09:00':'none'}><option value="none">No disponible</option><option value="09:00">9:00 AM</option><option value="10:00">10:00 AM</option></select><span>—</span><select defaultValue={i<4?'17:00':'none'}><option value="none">No disponible</option><option value="14:00">2:00 PM</option><option value="17:00">5:00 PM</option><option value="19:00">7:00 PM</option></select></div>)}</section><div className="schedule-rules"><section className="panel"><p className="eyebrow">DURACIÓN PREDETERMINADA</p><select defaultValue="50"><option value="30">30 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option></select></section><section className="panel"><p className="eyebrow">ANTICIPACIÓN MÍNIMA</p><select defaultValue="24"><option value="12">12 horas</option><option value="24">24 horas</option><option value="48">48 horas</option></select></section></div><a className="primary save-native" href="#perfil-profesional">Guardar disponibilidad</a></div></section>}{editing&&<div className="modal-backdrop" onClick={()=>setEditing(false)}><section className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setEditing(false)}>×</button><p className="eyebrow">EDITAR PERFIL</p><h2>{data.name}</h2><label className="edit-field">Nombre completo<input defaultValue={data.name}/></label><label className="edit-field">Rol profesional<input value={data.subtitle} readOnly/></label>{data.license&&<label className="edit-field">Cédula profesional<input defaultValue={data.license.replace('Cédula profesional · ','')}/></label>}<button className="primary" onClick={()=>setEditing(false)}>Guardar cambios</button></section></div>}{activeSetting&&<div className="modal-backdrop" onClick={()=>setActiveSetting(null)}><section className="modal settings-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setActiveSetting(null)}>×</button>{settingContent()}</section></div>}</div>
}

function Dashboard({ onLogout, initialRole }: { onLogout: () => void; initialRole: Role }) {
  const [tab, setTab] = useState<Tab>('Inicio');
  const [role, setRole] = useState<Role>(initialRole);
  const [selectedChat, setSelectedChat] = useState('laura');
  const changeRole = (next: Role) => { setRole(next); setTab('Inicio'); };
  const openMessage = (chatId: string) => { setSelectedChat(chatId); setTab('Mensajes'); };
  const identity = role==='Paciente'?{initial:'AR',name:'Ana Rodríguez'}:role==='Psicólogo'?{initial:'LM',name:'Laura Méndez'}:{initial:'DR',name:'Diego Ríos'};
  return <main className="dashboard"><aside className="sidebar"><Mark compact/><nav>{tabs.map(item=><button className={tab===item.name?'active':''} onClick={()=>setTab(item.name)} key={item.name}><span>{item.icon}</span>{item.name}{item.name==='Mensajes'&&<i>2</i>}</button>)}</nav><div className="support"><span>♡</span><strong>{role==='Paciente'?'¿Necesitas apoyo?':'Comunicación segura'}</strong><p>{role==='Paciente'?'Tu equipo está disponible.':'Tienes 2 mensajes pendientes.'}</p><button onClick={()=>setTab('Mensajes')}>Contactar</button></div><button className="side-profile" onClick={()=>setTab('Perfil')}><div className="avatar">{identity.initial}</div><span><strong>{identity.name}</strong><small>{role}</small></span><b>•••</b></button></aside>
    <section className="main"><header className="topbar"><div className="mobile-logo"><Mark compact/></div><label className="role-switch"><span>Vista</span><select value={role} onChange={e=>changeRole(e.target.value as Role)}><option>Paciente</option><option>Psicólogo</option><option>Psiquiatra</option></select></label><button className="alert">♧<i></i></button><button className="logout-mini" onClick={onLogout}>Salir</button></header><div className="view">{tab==='Inicio'?(role==='Paciente'?<Home onMessage={()=>openMessage('laura')}/>:<ProfessionalHome role={role} onMessages={()=>setTab('Mensajes')}/>):tab==='Proceso'?<Process/>:tab==='Equipo'?<Team onMessage={openMessage}/>:tab==='Mensajes'?<Messages key={selectedChat} initialChat={selectedChat}/>:<Profile role={role} onLogout={onLogout}/>}</div></section>
    <nav className="mobile-nav">{tabs.map(item=><button className={tab===item.name?'active':''} onClick={()=>setTab(item.name)} key={item.name}><span>{item.icon}</span>{item.name}</button>)}</nav>
  </main>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role>('Paciente');
  const login = (nextRole: Role, isNewAccount = false) => { setRole(nextRole); const seen = window.localStorage.getItem('vicino_onboarding_seen_v02') === 'true'; setScreen(isNewAccount || !seen ? 'onboarding' : 'app'); };
  const finishOnboarding = () => { window.localStorage.setItem('vicino_onboarding_seen_v02','true'); setScreen('app'); };
  return screen === 'login' ? <Login onNext={login}/> : screen === 'onboarding' ? <Onboarding onDone={finishOnboarding}/> : <Dashboard initialRole={role} onLogout={()=>setScreen('login')}/>;
}
