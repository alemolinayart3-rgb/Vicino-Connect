# Bitácora de producto — Vicino Connect

**Corte:** 13 de agosto de 2026  
**Versión de trabajo:** V0.2 funcional conectada a servicios reales  
**Sitio:** https://vicino-connect.vercel.app  
**Repositorio:** https://github.com/alemolinayart3-rgb/Vicino-Connect

## 1. Visión y decisiones de producto

- El prototipo original **Helplus MVP V0.1** evolucionó a **Vicino Connect V0.2**.
- El producto se definió como una plataforma de acompañamiento entre pacientes y profesionales de salud mental.
- Se conservaron los roles internos de **Paciente, Psicólogo y Psiquiatra**, pero el acceso público se simplificó a **Paciente / Profesional**.
- El profesional funciona como cuenta principal de su espacio de atención: invita pacientes y, posteriormente, podrá incorporar a otros profesionales con permisos específicos.
- Se estableció que las notas psicológicas y las indicaciones médicas/medicación deben permanecer separadas por privacidad y alcance profesional.
- Se planteó una futura consola master para administrar organizaciones, suspensiones y soporte, pero se decidió posponer su terminación.

## 2. Identidad visual y experiencia

- Branding reemplazado completamente por **Vicino Connect**.
- Paleta aplicada: salvia `#A7B59A`, azul sereno `#4F6E8B`, hueso `#F3F1EA` y gris profundo `#2B2F33`.
- Tipografías: **Sora** para títulos e **Inter** para interfaz.
- Logo actualizado al símbolo de infinito/personas en verde y azul, con variantes para escritorio y móvil.
- Login, onboarding, navegación, tarjetas, botones y modales fueron unificados visualmente.
- Se añadieron estados hover y transiciones minimalistas.
- Se corrigieron contornos azules agresivos y se suavizaron los estados de enfoque.
- La animación orbital del login se ajustó para que las esferas permanezcan ligadas a sus órbitas.
- Se mejoró la presentación móvil del login, registro por invitación y recuperación de contraseña.

## 3. Infraestructura completada

- Código alojado en GitHub y conectado a despliegues automáticos.
- Aplicación publicada en Vercel.
- Proyecto Supabase creado y conectado mediante variables de entorno.
- URL principal y redirecciones de autenticación configuradas en Supabase.
- Autenticación real conectada a Supabase Auth.
- Base para políticas RLS, organizaciones, invitaciones, asignaciones y perfiles creada mediante migraciones SQL.
- Se exploró Resend para personalizar correos; queda pospuesto hasta contar con dominio propio.

## 4. Registro, acceso y perfiles

### Completado

- Registro de pacientes con nombre, correo, teléfono, fecha de nacimiento y contraseña.
- Cálculo de edad a partir de la fecha de nacimiento.
- Perfil personalizado con datos reales del usuario; se eliminaron nombres fijos como “Ana” para cuentas nuevas.
- Edición persistente de teléfono y fecha de nacimiento.
- Acceso separado y validado entre cuentas de Paciente y Profesional.
- Profesionales no se registran públicamente como pacientes; su alta queda controlada.
- Confirmación visual para indicar que el correo de registro fue enviado.
- Botón **Iniciar sesión** dentro del registro por invitación cuando el correo ya tiene cuenta.
- Recuperación real mediante **Olvidé mi contraseña**.
- Pantalla para establecer una contraseña nueva.
- Mensajes de autenticación traducidos y explicados en español.
- Recuperación móvil corregida para enlaces abiertos desde Gmail u otro navegador interno.
- Opción visible para solicitar otro enlace cuando uno sea inválido o ya haya sido utilizado.

### Validación pendiente

- Recuperación de contraseña móvil validada exitosamente con una cuenta personal el 14 de agosto de 2026.
- Falta completar la prueba de vinculación posterior al inicio de sesión.
- Personalizar remitente, asunto y plantilla de los correos cuando exista dominio propio.

## 5. Invitaciones y vinculación

### Completado

- Apartado **Pacientes** para profesionales.
- Creación de invitaciones privadas con nombre y correo.
- Enlace exclusivo para registro de Paciente, sin selector de rol.
- Acciones para copiar enlace, enviar correo y revocar invitación.
- Estados diferenciados: esperando aceptación y aceptada.
- Solicitudes internas para cuentas de pacientes ya existentes.
- Pantalla del paciente para aceptar o rechazar una vinculación.
- Corrección de políticas RLS que impedían generar nuevas invitaciones.
- Invitaciones aceptadas se convierten en vínculos de atención.
- “Mi equipo” del paciente consulta profesionales reales vinculados.
- Lista profesional separada entre invitaciones pendientes y pacientes activos.
- Base para suspensión, reactivación y reemplazo de profesionales.
- Regla y endpoint preparados para suspender vínculos tras 90 días de inactividad.

### Pendiente

- Verificar diariamente la automatización de suspensión de 90 días en producción.
- Terminar la interfaz de reemplazo de psicólogo/psiquiatra y reactivación de vínculos.
- Añadir historial y auditoría visible de cambios de profesional.

## 6. Espacio del paciente

### Completado

- Navegación priorizada: **Inicio, Proceso, Equipo, Mensajes y Perfil**.
- Estados vacíos para cuentas nuevas, evitando mostrar historial ficticio.
- Rediseño de “Mi proceso” con lenguaje cálido, no evaluativo.
- Separación visual entre espacio psicológico y espacio médico.
- Equipo real con perfil profesional y acceso a mensajes.
- Acciones básicas de contacto conectadas.
- Perfil editable con información personal.
- Base para mostrar recursos y seguimientos asignados.

### Pendiente

- Sustituir cualquier conversación, sesión, avance o dato de demostración que todavía aparezca.
- Completar respuesta del paciente a cuestionarios, check-ins y ejercicios.
- Confirmación/rechazo de citas desde la cuenta del paciente y recordatorios asociados.
- Mejorar el expediente personal y el historial de recursos completados.

## 7. Consola del profesional

### Completado

- Navegación profesional redefinida: **Inicio, Agenda, Pacientes, Seguimiento, Recursos, Mensajes y Perfil**.
- Eliminación de apartados pensados para alguien que está en terapia y que no aportaban al profesional.
- Panel con sesiones, mensajes, procesos activos y próximas consultas.
- Botones visualmente unificados.
- Apertura de expedientes y resúmenes IA simulados/navegables.
- Pacientes activos alimentados desde vínculos reales.
- Acceso a seguimiento individual desde la ficha de cada paciente.
- Biblioteca para actividades, registros breves, cuestionarios y material psicoeducativo.
- Creación y asignación de recursos con título, frecuencia, contenido e indicaciones.
- Base persistente para asignaciones mediante `resource_assignments`/flujo equivalente.
- Espacios diferenciados para psicología y psiquiatría.

### Pendiente

- Convertir resúmenes IA de demostración en resúmenes calculados con datos autorizados.
- Completar expedientes reales, notas clínicas y límites de edición por rol.
- Añadir carga/gestión de documentos, plantillas y cuestionarios reutilizables.
- Crear seguimiento de respuestas, adherencia y alertas sin convertirlo en evaluación de desempeño.

## 8. Agenda y citas

### Completado

- Agenda profesional añadida como sección principal.
- Calendario visual propio alineado a la identidad de Vicino.
- Selección de fecha desde el calendario principal; se eliminó el calendario nativo duplicado.
- Horarios limitados de 8:00 a. m. a 10:00 p. m. en intervalos de 15 minutos.
- Selector de horario propio, reemplazando el menú nativo poco estético.
- Pacientes activos disponibles en el selector de nueva cita.
- Creación persistente de citas.
- Flujos para reprogramar, posponer y cancelar.
- Confirmaciones visuales diferenciadas para citas creadas por profesional y confirmadas por paciente.

### Pendiente

- Validar conflictos de horario y evitar dobles reservas.
- Definir duración de sesiones y disponibilidad recurrente.
- Terminar aceptación/rechazo/reprogramación desde Paciente.
- Agregar recordatorios automáticos por correo y dentro de la app.
- Evaluar futura sincronización con Google Calendar y Outlook.

## 9. Mensajes y notificaciones

### Completado

- Cambio entre conversaciones y envío de mensajes en el prototipo.
- Accesos desde Equipo, tarjetas de soporte y panel profesional.
- Base para estados leídos/no leídos.
- Contadores conectados a estado en lugar de quedar siempre fijos.
- Panel de notificaciones para eventos importantes, como aceptación de invitaciones.
- La tarjeta lateral de comunicación puede limpiarse al revisar mensajes.

### Pendiente crítico

- Hacer mensajes completamente persistentes en Supabase y en tiempo real.
- Verificar que el contador se reduzca en todos los dispositivos al abrir una conversación.
- Persistir notificaciones, marcar como leídas y evitar duplicados.
- Definir retención, cifrado, adjuntos y reglas de privacidad de mensajería clínica.

## 10. Base de datos y migraciones preparadas

El proyecto contiene scripts para:

- Organizaciones, membresías y asignaciones profesionales.
- Invitaciones seguras y aceptación dentro de la aplicación.
- Flujo de seguimiento de pacientes.
- Actualización segura del perfil del paciente.
- Agenda profesional.
- Confirmaciones de citas.
- Asignación completa de recursos.
- Suspensión de vínculos por inactividad.

Antes de considerar una función terminada, se debe confirmar que su archivo SQL correspondiente fue ejecutado exitosamente en el proyecto Supabase de producción.

## 11. Administración master

### Preparado parcialmente

- Modelo SQL de organizaciones y roles master.
- Endpoint y pantalla inicial de administración de organizaciones.
- Concepto definido: una sola consola separada para soporte, suspensión y control comercial.

### Decisión actual

- La cuenta y consola master se posponen hasta crear una cuenta definitiva y definir controles de seguridad reforzados.
- No se recomienda otro dominio por organización; la futura consola puede vivir en una ruta o subdominio protegido.

## 12. Pendientes transversales

### Prioridad alta — producto funcional

1. Validar recuperación de contraseña móvil recién corregida.
2. Auditar qué migraciones SQL ya están ejecutadas en producción.
3. Eliminar los últimos datos de demostración.
4. Completar persistencia y tiempo real de mensajes/notificaciones.
5. Completar citas del lado del paciente y detección de conflictos.
6. Completar respuestas y seguimiento de recursos asignados.
7. Probar permisos cruzados Paciente/Psicólogo/Psiquiatra con cuentas separadas.

### Prioridad media — experiencia y operación

8. Cambio, suspensión y reactivación de profesionales desde interfaz.
9. Automatización diaria de suspensión a 90 días.
10. Auditoría de accesos y acciones sensibles.
11. Plantillas de correo en español.
12. Estados de carga, vacíos y errores consistentes en todas las pantallas.

### Antes de comercializar

13. Comprar y configurar dominio propio.
14. Configurar Resend/SMTP con remitente Vicino Connect.
15. Crear Aviso de privacidad, Términos y consentimiento informado aplicables al país de operación.
16. Revisión especializada de privacidad y seguridad de datos de salud.
17. Backups, monitoreo, alertas y recuperación ante incidentes.
18. Analítica de producto sin exponer información clínica.
19. Definir planes, límites, facturación y cancelación de organizaciones.
20. Terminar consola master con autenticación reforzada.

## 13. Próximo bloque recomendado

Realizar una **prueba integral controlada** con tres cuentas reales de prueba:

1. Profesional invita a paciente.
2. Paciente nuevo y paciente existente completan el acceso.
3. Paciente acepta vinculación y aparece en ambos equipos.
4. Profesional agenda una cita y asigna un recurso.
5. Paciente confirma la cita y responde el recurso.
6. Ambos intercambian mensajes y los contadores se actualizan.
7. Psicólogo y psiquiatra intentan acceder únicamente a la información permitida.

Los defectos encontrados en esta prueba deben corregirse antes de ampliar nuevas funciones. Así se convierte el prototipo acumulado en un flujo clínico coherente y demostrable.
