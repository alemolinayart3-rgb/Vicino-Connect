"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type StoredQuestion = string | { id: string; prompt: string };
type ResponseRow = {
  id: string;
  response_date: string;
  response: { answers?: string[]; reflection?: string };
  status: string;
  submitted_at: string | null;
  care_plan_items: { title: string; resource_type: string; assignment_id: string; content: { questions?: StoredQuestion[] } };
};

const questionLabels = (row: ResponseRow) => (row.care_plan_items.content?.questions || []).map((question) => typeof question === "string" ? question : question.prompt);

function reviewResponse(row: ResponseRow) {
  const answers = row.response.answers || [];
  const expected = Math.max(questionLabels(row).length, answers.length);
  const answered = answers.filter((answer) => String(answer || "").trim()).length;
  const numeric = answers.map((answer) => Number(answer)).filter((answer) => Number.isFinite(answer) && answer >= 1 && answer <= 5);
  const notes = Boolean(row.response.reflection?.trim() || (answers[answers.length - 1] && !Number.isFinite(Number(answers[answers.length - 1]))));
  const observations: string[] = [];

  observations.push(answered === expected ? `Respondió las ${expected} preguntas disponibles.` : `Respondió ${answered} de ${expected}; quedaron ${expected - answered} sin respuesta.`);
  if (numeric.length) {
    const minimum = Math.min(...numeric), maximum = Math.max(...numeric);
    observations.push(minimum === maximum ? `Usó el valor ${minimum} en todas las respuestas de escala.` : `Las respuestas de escala se ubicaron entre ${minimum} y ${maximum}.`);
  }
  observations.push(notes ? "Incluyó una respuesta abierta o nota adicional." : "No añadió comentarios abiertos en esta entrega.");
  return { answered, expected, observations };
}

export default function ProfessionalResponses({ medical = false }: { medical?: boolean }) {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<ResponseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const client = createClient();
    const [{ data, error }, { data: patients }] = await Promise.all([
      client.from("care_item_responses").select("id,response_date,response,status,submitted_at,care_plan_items(title,resource_type,assignment_id,content)").eq("status", "submitted").order("submitted_at", { ascending: false }),
      client.rpc("my_assigned_patients"),
    ]);
    setRows((data as unknown as ResponseRow[]) || []);
    setNames(Object.fromEntries(((patients as { assignment_id: string; full_name: string }[]) || []).map((item) => [item.assignment_id, item.full_name])));
    setMessage(error ? (error.message.includes("care_item_responses") ? "Falta activar el módulo de respuestas interactivas en Supabase." : error.message) : "");
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  const selectedReview = selected ? reviewResponse(selected) : null;

  return <div className="page-content professional-workspace">
    <div className="page-heading"><p className="eyebrow">{medical ? "CONTINUIDAD MÉDICA" : "CONTINUIDAD DEL ACOMPAÑAMIENTO"}</p><h1>{medical ? "Seguimiento médico" : "Seguimiento"}</h1><p>Revisa las actividades que tus pacientes han completado.</p></div>
    <div className="stats follow-up-stats"><section><span>Entregas recibidas</span><strong>{rows.length}</strong><small>Disponibles para revisar</small></section><section><span>Pacientes con actividad</span><strong>{new Set(rows.map((row) => row.care_plan_items.assignment_id)).size}</strong><small>En este registro</small></section><section><span>Estado</span><strong>{rows.length ? "Al día" : "0"}</strong><small>{rows.length ? "Con respuestas" : "Sin novedades"}</small></section></div>
    {message && <p className="invite-feedback">{message}</p>}
    {loading ? <section className="panel empty-state"><p>Consultando respuestas…</p></section> : rows.length === 0 ? <section className="panel empty-state"><h2>Todo está al día</h2><p>Cuando un paciente complete una encuesta, ejercicio o registro, aparecerá aquí.</p></section> : <section className="panel response-inbox"><div className="section-title"><div><p className="eyebrow">ENTREGAS</p><h2>Respuestas recibidas</h2></div><button onClick={load}>Actualizar</button></div>{rows.map((row) => <article key={row.id}><div className="avatar sage">{(names[row.care_plan_items.assignment_id] || "P").split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{names[row.care_plan_items.assignment_id] || "Paciente"}</strong><span>{row.care_plan_items.title}</span><small>{new Date(row.submitted_at || row.response_date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</small></div><i>Completada</i><button className="secondary" onClick={() => setSelected(row)}>Ver respuestas</button></article>)}</section>}

    {selected && selectedReview && <div className="modal-backdrop response-review-backdrop" onClick={() => setSelected(null)}><section className="modal response-detail-modal response-review-modal" role="dialog" aria-modal="true" aria-label={`Respuesta de ${names[selected.care_plan_items.assignment_id] || "paciente"}`} onClick={(event) => event.stopPropagation()}>
      <header className="response-review-header"><div><p className="eyebrow">RESPUESTA DEL PACIENTE</p><h2>{selected.care_plan_items.title}</h2><p>{names[selected.care_plan_items.assignment_id] || "Paciente"} · {new Date(selected.submitted_at || selected.response_date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p></div><button aria-label="Cerrar respuestas" onClick={() => setSelected(null)}>×</button></header>
      <div className="response-review-progress"><span><strong>{selectedReview.answered}</strong> de {selectedReview.expected} respuestas</span><div><i style={{ width: `${selectedReview.expected ? (selectedReview.answered / selectedReview.expected) * 100 : 0}%` }} /></div></div>
      <div className="response-review-scroll"><div className="response-detail-list">{selected.response.answers?.map((answer, index) => <article className="response-answer-card" key={index}><span>{index + 1}</span><div><small>{questionLabels(selected)[index] || `Pregunta ${index + 1}`}</small><p>{answer || "Sin respuesta"}</p></div></article>)}{selected.response.reflection && <article className="response-answer-card open-answer"><span>✎</span><div><small>Comentario adicional</small><p>{selected.response.reflection}</p></div></article>}</div>
        <aside className="response-review-assistant"><div className="assistant-heading"><span>◇</span><div><p className="eyebrow">ASISTENTE DE REVISIÓN</p><h3>Lectura descriptiva</h3></div></div><ul>{selectedReview.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul><p>Este resumen organiza los datos registrados. No establece diagnósticos ni sustituye el criterio profesional.</p></aside>
      </div>
      <footer className="response-review-footer"><small>Revisión segura · información visible solo para el equipo autorizado</small><button className="primary" onClick={() => setSelected(null)}>Cerrar revisión</button></footer>
    </section></div>}
  </div>;
}
