"use client";

import { useState } from "react";

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

function Login({ onNext }: { onNext: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("Paciente");
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
              <button key={item} className={role === item ? 'selected' : ''} onClick={() => setRole(item)}>{item}</button>
            ))}
          </div>
          <label>Correo electrónico<input defaultValue="ana@ejemplo.com" type="email" /></label>
          <label>Contraseña<div className="password"><input defaultValue="vicinoconnect" type="password" /><span>○</span></div></label>
          <div className="login-meta"><label className="remember"><input type="checkbox" defaultChecked /> Recordarme</label><button>Olvidé mi contraseña</button></div>
          <button className="primary" onClick={() => onNext(role)}>Continuar <span>→</span></button>
          <p className="signup">¿Es tu primera vez? <button onClick={() => onNext(role)}>Crear una cuenta</button></p>
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
  const [breathing, setBreathing] = useState(false);
  return <>
    <div className="hero-row">
      <div><p className="eyebrow">MIÉRCOLES, 12 DE AGOSTO</p><h1>Hola, Ana <span>✦</span></h1><p>Hoy también cuenta. ¿Cómo te gustaría avanzar?</p></div>
      <div className="mood-card"><div><span>Tu pulso de hoy</span><strong>¿Cómo te sientes?</strong></div><button>Registrar <span>→</span></button></div>
    </div>
    <section className="session-card">
      <div className="date-block"><strong>18</strong><span>AGO</span></div>
      <div className="session-info"><p className="eyebrow">PRÓXIMA SESIÓN</p><h2>Psicoterapia individual</h2><p>10:00 AM · 50 min · Videollamada</p></div>
      <div className="therapist"><div className="avatar sage">LM</div><div><strong>Laura Méndez</strong><span>Psicóloga clínica</span></div></div>
      <button className="secondary" onClick={() => setSessionOpen(true)}>Ver detalles</button>
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
    {sessionOpen && <div className="modal-backdrop" onClick={() => setSessionOpen(false)}><section className="modal" role="dialog" aria-modal="true" aria-label="Detalles de próxima sesión" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSessionOpen(false)}>×</button><p className="eyebrow">PRÓXIMA SESIÓN</p><h2>Psicoterapia individual</h2><div className="session-detail"><span><small>Fecha</small><strong>Martes, 18 de agosto</strong></span><span><small>Hora</small><strong>10:00 AM · 50 min</strong></span><span><small>Modalidad</small><strong>Videollamada</strong></span><span><small>Profesional</small><strong>Laura Méndez</strong></span></div><button className="primary" onClick={() => setSessionOpen(false)}>Entendido</button></section></div>}
  </>;
}

function Process() {
  return <div className="page-content"><div className="page-heading"><p className="eyebrow">TU CAMINO</p><h1>Mi proceso</h1><p>Una vista clara de lo que estás construyendo, paso a paso.</p></div>
    <div className="two-col"><section className="panel"><h2>Objetivo actual</h2><div className="goal"><span>◒</span><div><h3>Reconocer mis patrones de ansiedad</h3><p>Iniciado el 14 de julio · Con Laura Méndez</p></div></div><div className="timeline">{['Identificar detonantes','Observar sensaciones físicas','Practicar una pausa consciente','Reformular pensamientos','Crear mi plan personal'].map((x,i)=><div className={i<3?'done':''} key={x}><i>{i<3?'✓':i+1}</i><span><strong>{x}</strong><small>{i<3?'Completado':'Próximo paso'}</small></span></div>)}</div></section>
    <aside><section className="panel note-safe"><p className="eyebrow">ESPACIO PSICOLÓGICO</p><h2>Notas compartidas contigo</h2><p>Reflexiones y ejercicios de tu proceso terapéutico. Solo tú y tu psicóloga pueden acceder.</p><button className="secondary">Ver notas</button></section><section className="panel medication"><p className="eyebrow">ESPACIO MÉDICO</p><h2>Indicaciones y medicación</h2><p>Información clínica gestionada únicamente por tu psiquiatra.</p><button className="secondary">Ver indicaciones</button></section></aside></div>
  </div>;
}

function Team() { return <div className="page-content"><div className="page-heading"><p className="eyebrow">RED DE APOYO</p><h1>Mi equipo</h1><p>Las personas que te acompañan en tu bienestar.</p></div><div className="profile-grid">{[{name:'Laura Méndez',role:'Psicóloga clínica',initial:'LM',color:'sage',desc:'Acompañamiento terapéutico · Martes 10:00 AM'},{name:'Dr. Diego Ríos',role:'Psiquiatra',initial:'DR',color:'blue',desc:'Seguimiento médico · Próxima cita 28 ago.'}].map(p=><section className="profile-card" key={p.name}><div className={`avatar large ${p.color}`}>{p.initial}</div><h2>{p.name}</h2><p>{p.role}</p><div className="divider"></div><span>{p.desc}</span><div><button className="primary">Mensaje</button><button className="secondary">Ver perfil</button></div></section>)}</div><section className="boundaries"><span>⌁</span><div><h3>Tu privacidad define los límites</h3><p>La información psicológica y médica se mantiene separada. Cada profesional accede únicamente a lo necesario para tu atención.</p></div></section></div> }

function Messages() {
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const send = () => { if (draft.trim()) { setSent([...sent, draft.trim()]); setDraft(''); } };
  return <div className="page-content"><div className="page-heading"><p className="eyebrow">CONVERSACIONES SEGURAS</p><h1>Mensajes</h1></div><div className="messages"><aside>{[{n:'Laura Méndez',m:'Gracias por compartirlo, Ana.',t:'10:42',c:'sage',i:'LM'},{n:'Dr. Diego Ríos',m:'Recibí tu registro. Lo revisamos...',t:'Ayer',c:'blue',i:'DR'}].map((x,i)=><button className={i===0?'active':''} key={x.n}><div className={`avatar ${x.c}`}>{x.i}</div><span><strong>{x.n}</strong><small>{x.m}</small></span><time>{x.t}</time></button>)}</aside><section className="chat"><header><div className="avatar sage">LM</div><div><strong>Laura Méndez</strong><span><i className="online"></i> Disponible</span></div></header><div className="chat-body"><p className="day">HOY</p><div className="bubble theirs">Hola, Ana. ¿Cómo te fue con el ejercicio de respiración?</div><div className="bubble mine">Me ayudó bastante antes de la reunión. Pude notar la ansiedad sin dejar que creciera tanto.</div><div className="bubble theirs">Gracias por compartirlo, Ana. Es un avance importante reconocerlo en el momento.</div>{sent.map((message,i)=><div className="bubble mine" key={i}>{message}<small className="sent-status">Enviado ✓</small></div>)}</div><footer><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} placeholder="Escribe un mensaje…"/><button aria-label="Enviar mensaje" disabled={!draft.trim()} onClick={send}>→</button></footer></section></div></div>
}

function ProfessionalHome({ role, onMessages }: { role: Exclude<Role,'Paciente'>; onMessages: () => void }) {
  const isPsych = role === 'Psicólogo';
  return <div className="page-content professional"><div className="hero-row"><div><p className="eyebrow">PANEL PROFESIONAL</p><h1>Hola, {isPsych ? 'Laura' : 'Diego'}</h1><p>{isPsych ? 'Acompaña el proceso terapéutico de tus pacientes.' : 'Revisa seguimientos e indicaciones médicas.'}</p></div><span className={`role-badge ${isPsych?'sage':'blue'}`}>{role}</span></div><div className="stats"><section><span>Sesiones de hoy</span><strong>{isPsych?'5':'3'}</strong><small>Próxima en 35 min</small></section><section><span>Mensajes pendientes</span><strong>2</strong><button onClick={onMessages}>Revisar mensajes →</button></section><section><span>{isPsych?'Procesos activos':'Seguimientos activos'}</span><strong>{isPsych?'18':'12'}</strong><small>Esta semana</small></section></div><section className="panel professional-list"><div className="section-title"><div><p className="eyebrow">AGENDA DE HOY</p><h2>Próximas consultas</h2></div></div>{['Ana Rodríguez','Martín Solís','Carla Vega'].map((name,i)=><div className="appointment" key={name}><div className={`avatar ${i===0?'sage':''}`}>{name.split(' ').map(x=>x[0]).join('')}</div><span><strong>{name}</strong><small>{10+i}:00 AM · {isPsych?'Psicoterapia individual':'Seguimiento médico'}</small></span><button className="secondary">Abrir expediente</button></div>)}</section><section className={`boundaries ${isPsych?'psych-boundary':'medical-boundary'}`}><span>⌁</span><div><h3>{isPsych?'Área psicológica protegida':'Área médica protegida'}</h3><p>{isPsych?'Puedes consultar notas terapéuticas, pero no modificar prescripciones médicas.':'Puedes gestionar indicaciones y medicación, sin acceso a notas privadas de psicoterapia.'}</p></div></section></div>;
}

function Profile() { return <div className="page-content"><div className="page-heading"><p className="eyebrow">TU ESPACIO</p><h1>Perfil</h1></div><section className="profile-settings"><div className="avatar xl">AR</div><div><h2>Ana Rodríguez</h2><p>Paciente desde julio de 2026</p></div><button className="secondary">Editar perfil</button></section><div className="settings-grid">{['Información personal','Privacidad y seguridad','Notificaciones','Ayuda y acompañamiento'].map((x,i)=><button className="setting" key={x}><span>{['○','◇','◌','?'][i]}</span><strong>{x}</strong><i>→</i></button>)}</div><button className="logout">Cerrar sesión</button></div> }

function Dashboard({ onLogout, initialRole }: { onLogout: () => void; initialRole: Role }) {
  const [tab, setTab] = useState<Tab>('Inicio');
  const [role, setRole] = useState<Role>(initialRole);
  const changeRole = (next: Role) => { setRole(next); setTab('Inicio'); };
  const identity = role==='Paciente'?{initial:'AR',name:'Ana Rodríguez'}:role==='Psicólogo'?{initial:'LM',name:'Laura Méndez'}:{initial:'DR',name:'Diego Ríos'};
  return <main className="dashboard"><aside className="sidebar"><Mark compact/><nav>{tabs.map(item=><button className={tab===item.name?'active':''} onClick={()=>setTab(item.name)} key={item.name}><span>{item.icon}</span>{item.name}{item.name==='Mensajes'&&<i>2</i>}</button>)}</nav><div className="support"><span>♡</span><strong>{role==='Paciente'?'¿Necesitas apoyo?':'Comunicación segura'}</strong><p>{role==='Paciente'?'Tu equipo está disponible.':'Tienes 2 mensajes pendientes.'}</p><button onClick={()=>setTab('Mensajes')}>Contactar</button></div><button className="side-profile" onClick={()=>setTab('Perfil')}><div className="avatar">{identity.initial}</div><span><strong>{identity.name}</strong><small>{role}</small></span><b>•••</b></button></aside>
    <section className="main"><header className="topbar"><div className="mobile-logo"><Mark compact/></div><label className="role-switch"><span>Vista</span><select value={role} onChange={e=>changeRole(e.target.value as Role)}><option>Paciente</option><option>Psicólogo</option><option>Psiquiatra</option></select></label><button className="alert">♧<i></i></button><button className="logout-mini" onClick={onLogout}>Salir</button></header><div className="view">{tab==='Inicio'?(role==='Paciente'?<Home onMessage={()=>setTab('Mensajes')}/>:<ProfessionalHome role={role} onMessages={()=>setTab('Mensajes')}/>):tab==='Proceso'?<Process/>:tab==='Equipo'?<Team/>:tab==='Mensajes'?<Messages/>:<Profile/>}</div></section>
    <nav className="mobile-nav">{tabs.map(item=><button className={tab===item.name?'active':''} onClick={()=>setTab(item.name)} key={item.name}><span>{item.icon}</span>{item.name}</button>)}</nav>
  </main>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role>('Paciente');
  const login = (nextRole: Role) => { setRole(nextRole); setScreen('onboarding'); };
  return screen === 'login' ? <Login onNext={login}/> : screen === 'onboarding' ? <Onboarding onDone={()=>setScreen('app')}/> : <Dashboard initialRole={role} onLogout={()=>setScreen('login')}/>;
}
