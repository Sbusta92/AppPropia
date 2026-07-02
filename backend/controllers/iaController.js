import pool from '../db.js'

const pedirJSONaOllama = async (mensaje) => {
  const hoy = new Date()

  const manana = new Date()
  manana.setDate(hoy.getDate() + 1)

  const pasadoManana = new Date()
  pasadoManana.setDate(hoy.getDate() + 2)

  const fechaHoy = hoy.toLocaleDateString('sv-SE')
  const fechaManana = manana.toLocaleDateString('sv-SE')
  const fechaPasadoManana = pasadoManana.toLocaleDateString('sv-SE')

  const categoriasBD = await pool.query(
    'SELECT nombre, descripcion FROM categorias ORDER BY nombre ASC'
  )

  const categoriasTexto = categoriasBD.rows
    .map(
      (categoria) =>
        `- ${categoria.nombre}: ${categoria.descripcion}`
    )
    .join('\n')

  const prompt = `
Responde SOLO con JSON válido.

Convierte el mensaje del usuario en esta estructura:

{
  "accion": "crear_nota",
  "titulo": "Jugar al tenis",
  "categoria": "Deportes",
  "fecha": null,
  "hora": null,
  "prioridad": "Alta",
  "respuesta": "He creado la nota Jugar al tenis."
}

Acciones posibles:
crear_nota, borrar_nota,
crear_tarea, borrar_tarea,
crear_evento, borrar_evento,
crear_objetivo, borrar_objetivo,
consultar_tareas,
consultar_dia,
organizar_semana,
recomendacion_hoy,
crear_planning,
consultar_tareas_atrasadas,
consultar_tareas_importantes,
buscar_tareas,
consultar_semana,
consultar_proximos_7_dias,
consultar_mes,
consultar_dia_mas_ocupado,
adelantar_tareas,
priorizar_tareas,
resumen_dia,
tiempo_libre,
Duración estimada,
responder.


Categorías disponibles:
${categoriasTexto}


Reglas:
- Si quiere crear o guardar una nota -> crear_nota.
- Si quiere borrar una nota -> borrar_nota.

- Si quiere crear una tarea -> crear_tarea.
- Si quiere borrar una tarea -> borrar_tarea.

- Si habla de meta, objetivo, sueño o algo a largo plazo -> crear_objetivo.
- Si quiere borrar un objetivo -> borrar_objetivo.

- Si el mensaje contiene "crea", "créame", "creame", "pon", "apunta", "añade" o "agenda" y también contiene "evento", "cita", "calendario" o "agenda" -> crear_evento.

- Si el mensaje contiene "borra", "borrar", "elimina" o "quitar" y también contiene "evento", "cita", "calendario" o "agenda" -> borrar_evento.

- Elige la categoría más adecuada usando la lista de categorías disponibles.
- El título debe ser solo la actividad o asunto principal.
- No incluyas palabras genéricas como "evento", "tarea", "nota", "objetivo", "agenda" en el título.
- El campo "titulo" nunca debe ser el nombre ni la descripción de una categoría.
- Si el usuario dice "comida familiar", el título debe ser "Comida familiar".
- El campo "titulo" nunca debe ser el nombre ni la descripción de una categoría.
- El título debe ser solo la actividad principal del usuario.
- Si pregunta qué tareas tiene pendientes -> consultar_tareas.
- Si pregunta por una categoría, tema o asunto concreto -> buscar_tareas.
- Ejemplos: médico, salud, trabajo, react, gimnasio, estudios.
- Si pregunta por sus tareas -> consultar_tareas.
- Si pregunta qué tiene pendiente -> consultar_tareas.
- Si pregunta qué tiene hoy, mañana, pasado mañana o un día de la semana -> consultar_dia.
- Si el usuario dice "organízame la semana", "organiza mi semana", "hazme un horario semanal", "planifica mi semana" o "qué debería hacer esta semana" -> organizar_semana.
- Si el usuario dice "qué hago hoy", "que hago hoy", "qué debería hacer hoy", "que deberia hacer hoy", "recomiéndame el día", "recomiendame el dia", "organizame el día", "organízame el día", "organiza mi día" o "organiza mi dia" -> recomendacion_hoy.
- Si el usuario dice "hazme un planning", "hazme un plan", "créame un planning", "crea un planning", "organízame un planning" o "plan de estudio", "plan de ejercicio", "planning de ejercicio" -> crear_planning.
- Si pregunta por tareas atrasadas, vencidas, caducadas o retrasadas -> consultar_tareas_atrasadas.
- Si pregunta por tareas importantes, urgentes, prioritarias o de prioridad alta -> consultar_tareas_importantes.
- Si pregunta "qué tengo esta semana", "qué hay esta semana", "qué me queda esta semana" o "agenda de esta semana" -> consultar_semana.
- Si pregunta "qué tengo los próximos 7 días", "qué tengo en los próximos 7 días", "qué tengo la próxima semana" o "qué tengo en 7 días" -> consultar_proximos_7_dias.
- Si pregunta "qué tengo este mes", "agenda de este mes", "qué hay este mes" o "qué me queda este mes" -> consultar_mes.
- Si pregunta cuál es su día más ocupado, qué día tiene más cosas o cuándo está más ocupado -> consultar_dia_mas_ocupado.
- Si pregunta "qué puedo adelantar hoy", "puedo adelantar algo", "qué puedo avanzar hoy" o "qué tarea puedo adelantar" -> adelantar_tareas.
- Si pregunta "qué debería hacer primero", "qué hago primero", "qué tarea hago primero", "por dónde empiezo" o "qué es lo más importante ahora" -> priorizar_tareas.
- Si el usuario pregunta "¿cómo tengo el día?", "¿cómo va mi día?", "¿qué tal tengo el día?", "¿cómo está mi agenda hoy?" o "¿cómo voy hoy?" -> resumen_dia.
- Si el usuario dice "tengo una hora libre", "tengo dos horas libres", "tengo tiempo libre", "qué puedo hacer en una hora", "qué hago si tengo dos horas", "qué hago en mi tiempo libre" -> tiempo_libre.
- Limpia el título.

Fechas:
- Hoy es ${fechaHoy}.
- Si el usuario dice "hoy", fecha = "${fechaHoy}".
- Si el usuario dice "mañana", fecha = "${fechaManana}".
- Si el usuario dice "pasado mañana", fecha = "${fechaPasadoManana}".
- La fecha siempre debe estar en formato YYYY-MM-DD.
- Si no hay fecha -> null.

Horas:
- Si el usuario dice una hora, rellena el campo hora.
- Si no hay hora -> null.

Prioridad:
- Si no hay prioridad -> Alta.

Mensaje del usuario:
${mensaje}
`

  const respuesta = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'phi3',
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0,
      },
    }),
  })

  const datos = await respuesta.json()

  let texto = datos.response.trim()

  const inicio = texto.indexOf('{')
  const fin = texto.lastIndexOf('}')

  if (inicio === -1 || fin === -1) {
    throw new Error('La IA no devolvió JSON válido')
  }

  texto = texto.slice(inicio, fin + 1)

  return JSON.parse(texto)
}

const borrarPorTitulo = async (tabla, titulo) => {
  const result = await pool.query(
    `DELETE FROM ${tabla}
     WHERE LOWER(titulo) LIKE LOWER($1)
     RETURNING *`,
    [`%${titulo}%`]
  )

  return result.rows[0]
}

const obtenerFecha = (mensaje, fechaIA, usarHoyPorDefecto = false) => {
  if (fechaIA && fechaIA !== 'Sin fecha') return fechaIA

  const texto = mensaje.toLowerCase()

  const meses = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

const fechaConMes = texto.match(
  /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/
)

if (fechaConMes) {
  const dia = Number(fechaConMes[1])
  const mes = meses[fechaConMes[2]]

  const fecha = new Date()
  fecha.setMonth(mes)
  fecha.setDate(dia)

  return fecha.toLocaleDateString('sv-SE')
}

  if (texto.includes('pasado mañana')) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 2)
    return fecha.toLocaleDateString('sv-SE')
  }

  if (texto.includes('mañana')) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 1)
    return fecha.toLocaleDateString('sv-SE')
  }

  if (texto.includes('hoy')) {
    return new Date().toLocaleDateString('sv-SE')
  }

  const diaSolo = texto.match(/(?:para el|el día|el)\s+(\d{1,2})\b/i)

if (diaSolo) {
  const hoy = new Date()
  const dia = Number(diaSolo[1])

  const fecha = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    dia
  )

  return fecha.toLocaleDateString('sv-SE')
}

    const dias = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
  }

  for (const [nombreDia, numeroDia] of Object.entries(dias)) {
    if (texto.includes(nombreDia)) {
      const hoy = new Date()

      let diferencia = numeroDia - hoy.getDay()

      if (diferencia < 0) {
        diferencia += 7
      }

      const fecha = new Date()
      fecha.setDate(hoy.getDate() + diferencia)

      return fecha.toLocaleDateString('sv-SE')
    }
  }

  return usarHoyPorDefecto
    ? new Date().toLocaleDateString('sv-SE')
    : 'Sin fecha'
}



export const responderIA = async (req, res) => {
  try {
    const { mensaje } = req.body

    if (!mensaje) {
      return res.status(400).json({
        respuesta: 'El mensaje es obligatorio',
      })
    }

    const textoMensaje = mensaje.toLowerCase()

    const categoriasBusqueda = [
  'salud',
  'trabajo',
  'estudio',
  'deporte',
  'deportes',
  'react',
  'médico',
  'medico',
  'gimnasio',
  'viaje',
  'viajes',
]

const categoriaDetectada = categoriasBusqueda.find((categoria) =>
  textoMensaje.includes(categoria)
)

const esConsultaEventos =
  textoMensaje.includes('evento') ||
  textoMensaje.includes('eventos') ||
  textoMensaje.includes('agenda') ||
  textoMensaje.includes('cita') ||
  textoMensaje.includes('citas')

if (
  categoriaDetectada &&
  (
    textoMensaje.includes('que tengo') ||
    textoMensaje.includes('qué tengo') ||
    textoMensaje.includes('pendiente')
  )
) {
  if (esConsultaEventos) {
    const eventos = await pool.query(
      `SELECT titulo, categoria, fecha, hora
       FROM eventos
       WHERE
         LOWER(categoria) LIKE LOWER($1)
         OR LOWER(titulo) LIKE LOWER($1)
       ORDER BY fecha ASC`,
      [`%${categoriaDetectada}%`]
    )

    const respuesta = eventos.rows.length
      ? `📅 Eventos relacionados con "${categoriaDetectada}":\n\n` +
        eventos.rows
          .map((e) => `• ${e.titulo} - ${e.fecha} ${e.hora || ''}`)
          .join('\n')
      : `No tienes eventos relacionados con "${categoriaDetectada}".`

    return res.json({
      respuesta,
      accion: 'buscar_eventos_categoria',
    })
  }

  const tareas = await pool.query(
    `SELECT titulo, categoria, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND (
       LOWER(categoria) LIKE LOWER($1)
       OR LOWER(titulo) LIKE LOWER($1)
     )
     ORDER BY fecha ASC`,
    [`%${categoriaDetectada}%`]
  )

  const eventos = await pool.query(
    `SELECT titulo, categoria, fecha, hora
     FROM eventos
     WHERE
       LOWER(categoria) LIKE LOWER($1)
       OR LOWER(titulo) LIKE LOWER($1)
     ORDER BY fecha ASC`,
    [`%${categoriaDetectada}%`]
  )

  if (tareas.rows.length === 0 && eventos.rows.length === 0) {
    return res.json({
      respuesta: `No tienes nada relacionado con "${categoriaDetectada}".`,
      accion: 'buscar_tareas_eventos',
    })
  }

  let respuesta = `🔎 He encontrado cosas relacionadas con "${categoriaDetectada}":\n\n`

  if (tareas.rows.length > 0) {
    respuesta += '✅ Tareas:\n'
    respuesta += tareas.rows
      .map((t) => `• ${t.titulo} (${t.prioridad}) - ${t.fecha || 'Sin fecha'}`)
      .join('\n')
    respuesta += '\n\n'
  }

  if (eventos.rows.length > 0) {
    respuesta += '📅 Eventos:\n'
    respuesta += eventos.rows
      .map((e) => `• ${e.titulo} - ${e.fecha} ${e.hora || ''}`)
      .join('\n')
  }

  return res.json({
    respuesta,
    accion: 'buscar_tareas_eventos',
  })
}

    const palabrasBusqueda = [
  'salud',
  'trabajo',
  'estudio',
  'deporte',
  'deportes',
  'react',
  'médico',
  'medico',
  'gimnasio',
  'viaje',
  'viajes',
]

const esBusqueda =
  textoMensaje.includes('que tengo') ||
  textoMensaje.includes('qué tengo') ||
  textoMensaje.includes('pendiente')



    

if (
  !textoMensaje.includes('adelantar') &&
  !textoMensaje.includes('avanzar') &&

  !textoMensaje.includes('que hago hoy') &&
  !textoMensaje.includes('qué hago hoy') &&
  !textoMensaje.includes('que debería hacer hoy') &&
  !textoMensaje.includes('qué debería hacer hoy') &&

  !textoMensaje.includes('creame') &&
  !textoMensaje.includes('créame') &&
  !textoMensaje.includes('crea') &&
  !textoMensaje.includes('crear') &&
  !textoMensaje.includes('ponme') &&
  !textoMensaje.includes('añade') &&
  !textoMensaje.includes('agrega') &&
  !textoMensaje.includes('agenda') &&

  (
    textoMensaje.startsWith('que tengo') ||
    textoMensaje.startsWith('qué tengo') ||
    textoMensaje.startsWith('que hay') ||
    textoMensaje.startsWith('qué hay') ||
    textoMensaje.startsWith('que me queda') ||
    textoMensaje.startsWith('qué me queda') ||

    textoMensaje.includes('hoy') ||
    textoMensaje.includes('mañana') ||
    textoMensaje.includes('pasado mañana') ||
    textoMensaje.includes('lunes') ||
    textoMensaje.includes('martes') ||
    textoMensaje.includes('miercoles') ||
    textoMensaje.includes('miércoles') ||
    textoMensaje.includes('jueves') ||
    textoMensaje.includes('viernes') ||
    textoMensaje.includes('sabado') ||
    textoMensaje.includes('sábado') ||
    textoMensaje.includes('domingo')
  )
) {
  const fecha = obtenerFecha(mensaje)

const soloTareas =
  textoMensaje.includes('tarea') ||
  textoMensaje.includes('tareas')

const soloEventos =
  textoMensaje.includes('evento') ||
  textoMensaje.includes('eventos') ||
  textoMensaje.includes('agenda') ||
  textoMensaje.includes('cita') ||
  textoMensaje.includes('citas')

let tareas = { rows: [] }
let eventos = { rows: [] }

if (!soloEventos) {
  tareas = await pool.query(
    `SELECT titulo, prioridad
     FROM tareas
     WHERE fecha = $1
     AND completada = false`,
    [fecha]
  )
}

if (!soloTareas) {
  eventos = await pool.query(
    `SELECT titulo, hora
     FROM eventos
     WHERE fecha = $1`,
    [fecha]
  )
}

let respuesta = `📅 Para el ${fecha}:\n\n`

if (tareas.rows.length > 0) {
  respuesta += 'Tareas:\n'

  tareas.rows.forEach((tarea) => {
    respuesta += `• ${tarea.titulo} (${tarea.prioridad})\n`
  })

  respuesta += '\n'
}

if (eventos.rows.length > 0) {
  respuesta += 'Eventos:\n'

  eventos.rows.forEach((evento) => {
    let horaLimpia = evento.hora

    if (
      horaLimpia &&
      horaLimpia.includes('T')
    ) {
      horaLimpia = horaLimpia
        .split('T')[1]
        .replace('Z', '')
        .slice(0, 5)
    }

    respuesta += `• ${evento.titulo} - ${horaLimpia || 'Sin hora'}\n`
  })
}

if (
  tareas.rows.length === 0 &&
  eventos.rows.length === 0
) {
  if (soloTareas) {
    respuesta = `No tienes tareas programadas para el ${fecha}.`
  } else if (soloEventos) {
    respuesta = `No tienes eventos programados para el ${fecha}.`
  } else {
    respuesta = `No tienes nada programado para el ${fecha}.`
  }
}

return res.json({
  respuesta,
  accion: 'consultar_dia',
})}

    let decision = null

    

if (
  textoMensaje.includes('organizame la semana') ||
  textoMensaje.includes('organízame la semana') ||
  textoMensaje.includes('organiza mi semana') ||
  textoMensaje.includes('hazme un horario semanal') ||
  textoMensaje.includes('planifica mi semana')
) {
  decision = {
    accion: 'organizar_semana',
    titulo: '',
    categoria: '',
    fecha: null,
    hora: null,
    prioridad: null,
  }
} else {
  decision = await pedirJSONaOllama(mensaje)
}

if (
  textoMensaje.includes('esta semana') ||
  textoMensaje.includes('semana actual')
) {
  decision.accion = 'consultar_semana'
}

if (
  textoMensaje.includes('este mes') ||
  textoMensaje.includes('mes actual')
) {
  decision.accion = 'consultar_mes'
}

if (
  textoMensaje.includes('día más ocupado') ||
  textoMensaje.includes('dia mas ocupado') ||
  textoMensaje.includes('más ocupado') ||
  textoMensaje.includes('mas ocupado') ||
  textoMensaje.includes('qué día tengo más cosas') ||
  textoMensaje.includes('que dia tengo mas cosas')
) {
  decision.accion = 'consultar_dia_mas_ocupado'
}

if (
  textoMensaje.includes('qué puedo adelantar') ||
  textoMensaje.includes('que puedo adelantar') ||
  textoMensaje.includes('puedo adelantar algo') ||
  textoMensaje.includes('qué puedo avanzar') ||
  textoMensaje.includes('que puedo avanzar') ||
  textoMensaje.includes('qué tarea puedo adelantar') ||
  textoMensaje.includes('que tarea puedo adelantar')
) {
  decision.accion = 'adelantar_tareas'
}

if (
  textoMensaje.includes('qué debería hacer primero') ||
  textoMensaje.includes('que deberia hacer primero') ||
  textoMensaje.includes('qué hago primero') ||
  textoMensaje.includes('que hago primero') ||
  textoMensaje.includes('qué tarea hago primero') ||
  textoMensaje.includes('que tarea hago primero') ||
  textoMensaje.includes('por dónde empiezo') ||
  textoMensaje.includes('por donde empiezo') ||
  textoMensaje.includes('qué es lo más importante ahora') ||
  textoMensaje.includes('que es lo mas importante ahora')
) {
  decision.accion = 'priorizar_tareas'
}

if (
  textoMensaje.includes('cómo tengo el día') ||
  textoMensaje.includes('como tengo el dia') ||
  textoMensaje.includes('qué tal tengo el día') ||
  textoMensaje.includes('que tal tengo el dia') ||
  textoMensaje.includes('cómo va mi día') ||
  textoMensaje.includes('como va mi dia') ||
  textoMensaje.includes('cómo voy hoy') ||
  textoMensaje.includes('como voy hoy') ||
  textoMensaje.includes('cómo está mi agenda hoy') ||
  textoMensaje.includes('como esta mi agenda hoy')
) {
  decision.accion = 'resumen_dia'
}

if (
  textoMensaje.includes('tiempo libre') ||
  textoMensaje.includes('hora libre') ||
  textoMensaje.includes('horas libres') ||
  textoMensaje.includes('tengo 1 hora') ||
  textoMensaje.includes('tengo una hora') ||
  textoMensaje.includes('tengo 2 horas') ||
  textoMensaje.includes('tengo dos horas') ||
  textoMensaje.includes('tengo 3 horas') ||
  textoMensaje.includes('tengo tres horas') ||
  textoMensaje.includes('esta tarde') ||
  textoMensaje.includes('esta mañana') ||
  textoMensaje.includes('un rato libre') ||
  textoMensaje.includes('qué puedo hacer') ||
  textoMensaje.includes('que puedo hacer')
) {
  decision.accion = 'tiempo_libre'
}

if (
  textoMensaje.includes('próximos 7 días') ||
  textoMensaje.includes('proximos 7 dias') ||
  textoMensaje.includes('próxima semana') ||
  textoMensaje.includes('proxima semana') ||
  textoMensaje.includes('en 7 dias') ||
  textoMensaje.includes('en 7 días')
) {
  decision.accion = 'consultar_proximos_7_dias'
}

console.log('DECISION:', decision)



if (
  textoMensaje.includes('creame') ||
  textoMensaje.includes('créame') ||
  textoMensaje.includes('crea') ||
  textoMensaje.includes('crear') ||
  textoMensaje.includes('ponme') ||
  textoMensaje.includes('pon una') ||
  textoMensaje.includes('añade') ||
  textoMensaje.includes('agrega')
) {
  if (
    textoMensaje.includes('tarea') ||
    textoMensaje.includes('tareas')
  ) {
    decision.accion = 'crear_tarea'
  }

  if (
    textoMensaje.includes('evento') ||
    textoMensaje.includes('cita') ||
    textoMensaje.includes('agenda')
  ) {
    decision.accion = 'crear_evento'
  }
}

if (!decision.titulo) {
  decision.titulo = mensaje.toLowerCase()

  const frasesEliminar = [
    'me podrias borrar',
    'me podrías borrar',
    'me puedes borrar',
    'puedes borrar',
    'quiero borrar',
    'borra',
    'borrar',

    'creame una tarea de',
    'créame una tarea de',
    'crea una tarea de',
    'ponme una tarea de',
    'pon una tarea de',

    'la tarea',
    'tarea',

    'la nota',
    'nota',

    'el objetivo',
    'objetivo',

    'el evento',
    'evento',

    'de objetivos',
    'de tareas',
    'de notas',
    'de eventos',

    'para pasado mañana',
    'pasado mañana',
    'para mañana',
    'mañana',
    'para hoy',
    'hoy',

    'ya lo aprendi',
    'ya lo aprendí',

    '?',
  ]

  frasesEliminar.forEach((frase) => {
    decision.titulo = decision.titulo.replace(frase, '')
  })

  decision.titulo = decision.titulo.trim()
}

if (
  decision.titulo === decision.categoria ||
  decision.titulo?.toLowerCase().includes('listas de productos')
) {
  decision.titulo = mensaje
    .toLowerCase()
    .replace('creame una tarea de', '')
    .replace('créame una tarea de', '')
    .replace('crea una tarea de', '')
    .replace('ponme una tarea de', '')
    .replace('pon una tarea de', '')
    .replace('para pasado mañana', '')
    .replace('pasado mañana', '')
    .replace('para mañana', '')
    .replace('mañana', '')
    .replace('para hoy', '')
    .replace('hoy', '')
    .replace('?', '')
    
    .trim()
}

if (decision.accion === 'priorizar_tareas') {
  const hoy = new Date().toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     ORDER BY
       CASE
         WHEN fecha <> 'Sin fecha' AND fecha < $1 THEN 1
         WHEN fecha = $1 THEN 2
         WHEN prioridad = 'Alta' THEN 3
         WHEN prioridad = 'Media' THEN 4
         WHEN prioridad = 'Baja' THEN 5
         ELSE 6
       END,
       fecha ASC
     LIMIT 5`,
    [hoy]
  )

  if (tareas.rows.length === 0) {
  return res.json({
    respuesta:
      '🎉 No tienes tareas pendientes. Puedes tomarte el día con calma.',
    accion: 'priorizar_tareas',
  })
}

let respuesta = '🧠 He analizado tus tareas pendientes.\n\n'

const atrasadas = tareas.rows.filter(
  (t) => t.fecha && t.fecha !== 'Sin fecha' && t.fecha < hoy
).length

const hoyCount = tareas.rows.filter(
  (t) => t.fecha === hoy
).length

const futuras = tareas.rows.filter(
  (t) => t.fecha && t.fecha !== 'Sin fecha' && t.fecha > hoy
).length

respuesta += '📊 Resumen\n'
respuesta += `• ${atrasadas} atrasadas\n`
respuesta += `• ${hoyCount} para hoy\n`
respuesta += `• ${futuras} próximas\n\n`

respuesta += '📋 Orden recomendado:\n\n'

tareas.rows.forEach((t, index) => {
  const puesto =
    index === 0
      ? '🥇'
      : index === 1
        ? '🥈'
        : index === 2
          ? '🥉'
          : `${index + 1}.`

  respuesta += `${puesto} ${t.titulo}\n`

  if (t.fecha && t.fecha !== 'Sin fecha' && t.fecha < hoy) {
    respuesta += '⚠️ Atrasada\n'
  } else if (t.fecha === hoy) {
    respuesta += '📅 Hoy\n'
  } else if (t.prioridad === 'Alta') {
    respuesta += '🔥 Prioridad alta\n'
  } else if (t.prioridad === 'Media') {
    respuesta += '🟡 Prioridad media\n'
  } else {
    respuesta += '🟢 Prioridad baja\n'
  }

  if (t.fecha && t.fecha !== 'Sin fecha') {
    respuesta += `🗓 ${t.fecha}\n`
  } else {
    respuesta += 'Sin fecha límite\n'
  }

  respuesta += '\n'
})

const primera = tareas.rows[0]
const segunda = tareas.rows[1]

respuesta += '📌 Mi consejo\n\n'
respuesta += `Empieza por "${primera.titulo}". `

if (primera.fecha && primera.fecha !== 'Sin fecha' && primera.fecha < hoy) {
  respuesta +=
    'Es la más urgente porque ya está atrasada y quitarla de encima debería ser tu prioridad.'
} else if (primera.fecha === hoy) {
  respuesta +=
    'Vence hoy, así que cuanto antes la completes, más tranquilo estarás el resto del día.'
} else if (primera.prioridad === 'Alta') {
  respuesta +=
    'Es de prioridad alta, así que merece ser lo primero.'
} else {
  respuesta +=
    'Es una buena primera opción para empezar con algo claro.'
}

if (segunda) {
  respuesta += `\n\nDespués seguiría con "${segunda.titulo}", para mantener un ritmo constante y aprovechar el tiempo.`
}

if (atrasadas > 0) {
  respuesta +=
    '\n\n💪 Si hoy consigues eliminar las tareas atrasadas, volverás a estar completamente al día.'
} else if (hoyCount > 0) {
  respuesta +=
    '\n\n💪 Si completas las tareas de hoy, tendrás una agenda mucho más despejada para los próximos días.'
} else {
  respuesta +=
    '\n\n🎯 Vas bien organizado. Mantén este ritmo.'
}

return res.json({
  respuesta,
  accion: 'priorizar_tareas',
})}

if (decision.accion === 'resumen_dia') {
  const hoy = new Date().toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad
     FROM tareas
     WHERE completada = false
     AND fecha = $1`,
    [hoy]
  )

  const eventos = await pool.query(
    `SELECT titulo, hora
     FROM eventos
     WHERE fecha = $1`,
    [hoy]
  )

  const altas = tareas.rows.filter(
    (t) => t.prioridad === 'Alta'
  ).length

  const total = tareas.rows.length + eventos.rows.length

  const predominanEventos =
  eventos.rows.length > tareas.rows.length

const predominanTareas =
  tareas.rows.length > eventos.rows.length

  let respuesta = '📊 Resumen de hoy\n\n'

  respuesta += `📝 Tareas: ${tareas.rows.length}\n`
  respuesta += `📅 Eventos: ${eventos.rows.length}\n`
  respuesta += `🔥 Prioridad alta: ${altas}\n\n`

  if (total === 0) {

  respuesta +=
    '🎉 Hoy no tienes nada planificado.\n\n'

  respuesta +=
    '💡 Es un buen día para descansar o adelantar tareas de los próximos días.'

}
else if (total <= 2) {

  respuesta +=
    '🟢 Hoy tienes un día bastante tranquilo.\n\n'

  respuesta +=
    'Podrás hacer tus tareas sin prisas.'

}
else if (total <= 5) {

  respuesta +=
    '🟡 Hoy tienes una carga equilibrada.\n\n'

  respuesta +=
    'Si mantienes el ritmo, terminarás el día sin problemas.'

}
else {

  respuesta +=
    '🔴 Hoy tienes un día bastante cargado.\n\n'

  respuesta +=
    'Mi consejo es que te centres primero en las tareas importantes y evites añadir más trabajo.'

}

if (predominanEventos) {

  respuesta +=
    '\n\n📅 Hoy gran parte de tu tiempo estará ocupado por eventos.'

}
else if (predominanTareas) {

  respuesta +=
    '\n\n📝 Hoy el trabajo principal estará en tus tareas pendientes.'

}
else if (total > 0) {

  respuesta +=
    '\n\n⚖️ Hoy tienes un buen equilibrio entre tareas y eventos.'

}

respuesta += '\n\n💡 Siguiente paso recomendado:\n'

if (altas > 0) {

  respuesta +=
    'Pregúntame "¿Qué tarea hago primero?" y te diré por cuál empezar.'

}
else if (total <= 2) {

  respuesta +=
    'Como hoy tienes poco trabajo, también puedes preguntarme "¿Qué puedo adelantar hoy?".'

}
else {

  respuesta +=
    'Cuando termines una tarea importante, vuelve a preguntarme y reorganizaremos el resto del día.'
}
  return res.json({
    respuesta,
    accion: 'resumen_dia',
  })
}



if (decision.accion === 'consultar_semana') {
  const hoy = new Date()
  const fechaInicio = hoy.toLocaleDateString('sv-SE')

  const fechaFinDate = new Date(hoy)
  const diaSemana = hoy.getDay()
  const diasHastaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana

  fechaFinDate.setDate(hoy.getDate() + diasHastaDomingo)

  const fechaFin = fechaFinDate.toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND fecha <> 'Sin fecha'
     AND fecha BETWEEN $1 AND $2
     ORDER BY fecha ASC`,
    [fechaInicio, fechaFin]
  )

  const eventos = await pool.query(
    `SELECT titulo, fecha, hora
     FROM eventos
     WHERE fecha BETWEEN $1 AND $2
     ORDER BY fecha ASC, hora ASC`,
    [fechaInicio, fechaFin]
  )

  if (tareas.rows.length === 0 && eventos.rows.length === 0) {
    return res.json({
      respuesta: '🎉 No tienes tareas ni eventos esta semana.',
      accion: 'consultar_semana',
    })
  }

  let respuesta = `📆 Esto tienes desde hoy hasta el domingo:\n\n`

  if (tareas.rows.length > 0) {
    respuesta += '✅ Tareas:\n'

    tareas.rows.forEach((t) => {
      respuesta += `• ${t.fecha} | ${t.titulo} (${t.prioridad})\n`
    })

    respuesta += '\n'
  }

  if (eventos.rows.length > 0) {
    respuesta += '📅 Eventos:\n'

    eventos.rows.forEach((e) => {
      respuesta += `• ${e.fecha} ${e.hora || ''} | ${e.titulo}\n`
    })
  }

  return res.json({
    respuesta,
    accion: 'consultar_semana',
  })
}

if (decision.accion === 'consultar_proximos_7_dias') {
  const hoy = new Date()
  const fechaInicio = hoy.toLocaleDateString('sv-SE')

  const fechaFinDate = new Date(hoy)
  fechaFinDate.setDate(hoy.getDate() + 7)

  const fechaFin = fechaFinDate.toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND fecha <> 'Sin fecha'
     AND fecha BETWEEN $1 AND $2
     ORDER BY fecha ASC`,
    [fechaInicio, fechaFin]
  )

  const eventos = await pool.query(
    `SELECT titulo, fecha, hora
     FROM eventos
     WHERE fecha BETWEEN $1 AND $2
     ORDER BY fecha ASC, hora ASC`,
    [fechaInicio, fechaFin]
  )

  if (tareas.rows.length === 0 && eventos.rows.length === 0) {
    return res.json({
      respuesta: '🎉 No tienes tareas ni eventos en los próximos 7 días.',
      accion: 'consultar_proximos_7_dias',
    })
  }

  let respuesta = `📆 Esto tienes en los próximos 7 días:\n\n`

  if (tareas.rows.length > 0) {
    respuesta += '✅ Tareas:\n'

    tareas.rows.forEach((t) => {
      respuesta += `• ${t.fecha} | ${t.titulo} (${t.prioridad})\n`
    })

    respuesta += '\n'
  }

  if (eventos.rows.length > 0) {
    respuesta += '📅 Eventos:\n'

    eventos.rows.forEach((e) => {
      respuesta += `• ${e.fecha} ${e.hora || ''} | ${e.titulo}\n`
    })
  }

  return res.json({
    respuesta,
    accion: 'consultar_proximos_7_dias',
  })
}

if (decision.accion === 'consultar_mes') {

  const hoy = new Date()

  const año = hoy.getFullYear()
  const mes = hoy.getMonth()

  const fechaInicio = new Date(año, mes, 1)
  const fechaFin = new Date(año, mes + 1, 0)

  const inicio = fechaInicio.toLocaleDateString('sv-SE')
  const fin = fechaFin.toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND fecha <> 'Sin fecha'
     AND fecha BETWEEN $1 AND $2
     ORDER BY fecha ASC`,
    [inicio, fin]
  )

  const eventos = await pool.query(
    `SELECT titulo, fecha, hora
     FROM eventos
     WHERE fecha BETWEEN $1 AND $2
     ORDER BY fecha ASC, hora ASC`,
    [inicio, fin]
  )

  if (tareas.rows.length === 0 && eventos.rows.length === 0) {
    return res.json({
      respuesta: '📅 No tienes nada programado este mes.',
      accion: 'consultar_mes',
    })
  }

  let respuesta = '📅 Esto tienes este mes:\n\n'

  if (tareas.rows.length) {
    respuesta += '✅ Tareas:\n'

    tareas.rows.forEach((t) => {
      respuesta += `• ${t.fecha} | ${t.titulo} (${t.prioridad})\n`
    })

    respuesta += '\n'
  }

  if (eventos.rows.length) {
    respuesta += '📅 Eventos:\n'

    eventos.rows.forEach((e) => {
      respuesta += `• ${e.fecha} ${e.hora || ''} | ${e.titulo}\n`
    })
  }

  return res.json({
    respuesta,
    accion: 'consultar_mes',
  })
}

if (decision.accion === 'consultar_dia_mas_ocupado') {

  const tareas = await pool.query(
    `SELECT fecha
     FROM tareas
     WHERE completada = false
     AND fecha <> 'Sin fecha'`
  )

  const eventos = await pool.query(
    `SELECT fecha
     FROM eventos`
  )

  const contador = {}

  tareas.rows.forEach((t) => {
    contador[t.fecha] = (contador[t.fecha] || 0) + 1
  })

  eventos.rows.forEach((e) => {
    contador[e.fecha] = (contador[e.fecha] || 0) + 1
  })

  if (Object.keys(contador).length === 0) {
    return res.json({
      respuesta: 'No tienes tareas ni eventos programados.',
      accion: 'consultar_dia_mas_ocupado',
    })
  }

  let mejorFecha = null
  let maximo = 0

  Object.entries(contador).forEach(([fecha, cantidad]) => {
    if (cantidad > maximo) {
      mejorFecha = fecha
      maximo = cantidad
    }
  })

  const tareasDia = await pool.query(
    `SELECT titulo
     FROM tareas
     WHERE fecha = $1
     AND completada = false`,
    [mejorFecha]
  )

  const eventosDia = await pool.query(
    `SELECT titulo,hora
     FROM eventos
     WHERE fecha = $1`,
    [mejorFecha]
  )

  let respuesta =
`📅 Tu día más ocupado es el ${mejorFecha}.

Total de actividades: ${maximo}

`

  if (tareasDia.rows.length) {
    respuesta += '✅ Tareas:\n'

    tareasDia.rows.forEach((t) => {
      respuesta += `• ${t.titulo}\n`
    })

    respuesta += '\n'
  }

  if (eventosDia.rows.length) {
    respuesta += '📅 Eventos:\n'

    eventosDia.rows.forEach((e) => {
      respuesta += `• ${e.titulo} ${e.hora || ''}\n`
    })
  }

  return res.json({
    respuesta,
    accion: 'consultar_dia_mas_ocupado',
  })
}

if (decision.accion === 'adelantar_tareas') {
  const hoy = new Date().toLocaleDateString('sv-SE')

  const mananaDate = new Date()
  mananaDate.setDate(mananaDate.getDate() + 1)
  const manana = mananaDate.toLocaleDateString('sv-SE')

  const tareasHoy = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND fecha = $1`,
    [hoy]
  )

  const eventosHoy = await pool.query(
    `SELECT titulo, hora
     FROM eventos
     WHERE fecha = $1`,
    [hoy]
  )

  const tareasAtrasadas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND fecha <> 'Sin fecha'
     AND fecha < $1
     ORDER BY
       CASE
         WHEN prioridad = 'Alta' THEN 1
         WHEN prioridad = 'Media' THEN 2
         WHEN prioridad = 'Baja' THEN 3
         ELSE 4
       END,
       fecha ASC
     LIMIT 3`,
    [hoy]
  )

  const proximasTareas = await pool.query(
  `SELECT titulo, prioridad, fecha
   FROM tareas
   WHERE completada = false
   AND fecha > $1
   AND fecha <> 'Sin fecha'
   ORDER BY fecha ASC,
   CASE
      WHEN prioridad='Alta' THEN 1
      WHEN prioridad='Media' THEN 2
      ELSE 3
   END
   LIMIT 3`,
  [hoy]
)

  const cargaHoy =
    tareasHoy.rows.length + eventosHoy.rows.length

  if (cargaHoy >= 6) {
    return res.json({
      respuesta:
        `Hoy ya tienes bastante carga (${cargaHoy} actividades). ` +
        `No te recomiendo adelantar más cosas. Mejor céntrate en lo de hoy.`,
      accion: 'adelantar_tareas',
    })
  }

  if (tareasAtrasadas.rows.length > 0) {
    let respuesta =
      `⚠️ Antes de adelantar cosas nuevas, te recomiendo ponerte al día con estas tareas atrasadas:\n\n`

    tareasAtrasadas.rows.forEach((t) => {
      respuesta += `• ${t.titulo} (${t.prioridad}) - vencía el ${t.fecha}\n`
    })

    return res.json({
      respuesta,
      accion: 'adelantar_tareas',
    })
  }

  if (cargaHoy <= 2 && proximasTareas.rows.length > 0) {
    let respuesta =
      `Hoy tienes poca carga (${cargaHoy} actividades). Podrías adelantar alguna tarea de mañana:\n\n`

    proximasTareas.rows.forEach((t) => {
      respuesta += `• ${t.titulo} (${t.prioridad})\n`
    })

    return res.json({
      respuesta,
      accion: 'adelantar_tareas',
    })
  }

  return res.json({
    respuesta:
      `Tu día está bastante equilibrado (${cargaHoy} actividades). ` +
      `No hace falta adelantar tareas; mantén el plan actual.`,
    accion: 'adelantar_tareas',
  })
}


if (decision.accion === 'consultar_tareas_atrasadas') {
  const hoy = new Date().toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND fecha <> 'Sin fecha'
     AND fecha < $1
     ORDER BY fecha ASC`,
    [hoy]
  )

  const respuesta = tareas.rows.length
    ? `⚠️ Tareas atrasadas:\n\n` +
      tareas.rows
        .map(
          (t) =>
            `• ${t.titulo} (${t.prioridad}) - vencía el ${t.fecha}`
        )
        .join('\n')
    : '🎉 No tienes tareas atrasadas.'

  return res.json({
    respuesta,
    accion: 'consultar_tareas_atrasadas',
  })
}

if (decision.accion === 'consultar_tareas_importantes') {
  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND prioridad = 'Alta'
     ORDER BY
       CASE
         WHEN fecha = 'Sin fecha' THEN 1
         ELSE 0
       END,
       fecha ASC`
  )

  const respuesta = tareas.rows.length
    ? `🔥 Tareas importantes pendientes:\n\n` +
      tareas.rows
        .map(
          (t) =>
            `• ${t.titulo} - ${t.fecha || 'Sin fecha'}`
        )
        .join('\n')
    : '🎉 No tienes tareas importantes pendientes.'

  return res.json({
    respuesta,
    accion: 'consultar_tareas_importantes',
  })
}



if (decision.accion === 'consultar_tareas') {
  const tareas = await pool.query(
  `SELECT titulo, prioridad, fecha
   FROM tareas
   WHERE completada = false
   ORDER BY
     CASE
       WHEN fecha <> 'Sin fecha' AND fecha < $1 THEN 1
       WHEN fecha = $1 THEN 2
       WHEN prioridad = 'Alta' THEN 3
       WHEN prioridad = 'Media' THEN 4
       WHEN prioridad = 'Baja' THEN 5
       ELSE 6
     END,
     fecha ASC`,
  [hoy]
)
  const texto = tareas.rows.length
    ? tareas.rows
        .map(
          (t) =>
            `• ${t.titulo} (${t.prioridad})`
        )
        .join('\n')
    : 'No tienes tareas pendientes.'

  return res.json({
    respuesta: texto,
    accion: 'consultar_tareas',
  })
}

if (decision.accion === 'crear_planning') {
  const fechaPlanning = obtenerFecha(
    mensaje,
    decision.fecha,
    true
  )

  const promptPlanning = `
Genera un planning en español para esta petición:

"${mensaje}"

Devuelve SOLO JSON válido con este formato:
{
  "tareas": [
    {
      "titulo": "Calentamiento",
      "prioridad": "Media"
    }
  ]
}

Reglas:
- Genera entre 3 y 6 tareas concretas.
- No incluyas horas.
- No incluyas explicaciones.
- La prioridad debe ser Alta, Media o Baja.
`

  const respuestaOllama = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'phi3',
      prompt: promptPlanning,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.3,
      },
    }),
  })

  const datos = await respuestaOllama.json()

  const planning = JSON.parse(datos.response)

  const tareasCreadas = []

  for (const tarea of planning.tareas) {
    const prioridad = tarea.prioridad || 'Media'

    const clase =
      prioridad === 'Alta'
        ? 'high'
        : prioridad === 'Media'
          ? 'medium'
          : ''

    const result = await pool.query(
      `INSERT INTO tareas (
        titulo,
        fecha,
        prioridad,
        categoria,
        notas,
        clase,
        completada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        tarea.titulo,
        fechaPlanning,
        prioridad,
        decision.categoria || 'Personal',
        '',
        clase,
        false,
      ]
    )

    tareasCreadas.push(result.rows[0])
  }

  return res.json({
    respuesta: `✅ He creado un planning con ${tareasCreadas.length} tareas para el ${fechaPlanning}.`,
    accion: 'crear_planning',
    data: tareasCreadas,
  })
}

if (decision.accion === 'consultar_dia') {
  const fecha = obtenerFecha(mensaje)

  const planDia = await pool.query(
    `SELECT *
     FROM plan_semanal
     WHERE fecha = $1
     ORDER BY hora_inicio ASC`,
    [fecha]
  )

  let respuesta = `📅 Para el ${fecha}:\n\n`

  const tareas = planDia.rows.filter(
    (item) => item.tipo === 'tarea'
  )

  const eventos = planDia.rows.filter(
    (item) => item.tipo === 'evento'
  )

  if (tareas.length > 0) {
    respuesta += 'Tareas:\n'

    tareas.forEach((tarea) => {
      respuesta += `• ${tarea.hora_inicio} - ${tarea.hora_fin} | ${tarea.titulo} (${tarea.prioridad})\n`
    })

    respuesta += '\n'
  }

  if (eventos.length > 0) {
    respuesta += 'Eventos:\n'

    eventos.forEach((evento) => {
      respuesta += `• ${evento.hora_inicio || 'Sin hora'} | ${evento.titulo}\n`
    })
  }

  if (
    tareas.length === 0 &&
    eventos.length === 0
  ) {
    respuesta = `No tienes nada planificado para el ${fecha}.`
  }

  return res.json({
    respuesta,
    accion: 'consultar_dia',
  })
}

if (decision.accion === 'recomendacion_hoy') {
  const hoy = new Date().toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND (
       fecha >= $1
       OR fecha = 'Sin fecha'
     )
     ORDER BY
       CASE
         WHEN prioridad = 'Alta' THEN 1
         WHEN prioridad = 'Media' THEN 2
         WHEN prioridad = 'Baja' THEN 3
         ELSE 4
       END`,
    [hoy]
  )

  const eventos = await pool.query(
    `SELECT titulo, hora
     FROM eventos
     WHERE fecha = $1
     ORDER BY hora ASC`,
    [hoy]
  )

  const franjas = {
    Alta: [
      { inicio: '09:00', fin: '11:00' },
      { inicio: '16:30', fin: '18:30' },
    ],
    Media: [
      { inicio: '11:30', fin: '12:30' },
      { inicio: '18:30', fin: '19:30' },
    ],
    Baja: [
      { inicio: '19:30', fin: '20:00' },
    ],
  }

  const planDia = []

  eventos.rows.forEach((evento) => {
    planDia.push({
      tipo: 'evento',
      titulo: evento.titulo,
      inicio: evento.hora || 'Sin hora',
      fin: '',
      prioridad: 'Evento',
    })
  })

  let contadorAlta = 0
  let contadorMedia = 0
  let contadorBaja = 0

  tareas.rows.forEach((tarea) => {
    let franja

    if (tarea.prioridad === 'Alta') {
      franja = franjas.Alta[contadorAlta % franjas.Alta.length]
      contadorAlta++
    } else if (tarea.prioridad === 'Media') {
      franja = franjas.Media[contadorMedia % franjas.Media.length]
      contadorMedia++
    } else {
      franja = franjas.Baja[contadorBaja % franjas.Baja.length]
      contadorBaja++
    }

    const ocupado = planDia.some((item) => {
      return item.inicio === franja.inicio
    })

    if (!ocupado) {
      planDia.push({
        tipo: 'tarea',
        titulo: tarea.titulo,
        inicio: franja.inicio,
        fin: franja.fin,
        prioridad: tarea.prioridad,
      })
    }
  })

  planDia.sort((a, b) =>
    a.inicio.localeCompare(b.inicio)
  )

  let respuesta = '🤖 Recomendación para hoy:\n\n'

  if (planDia.length === 0) {
    respuesta = '🎉 No tienes tareas ni eventos para hoy.'
  } else {
    planDia.forEach((item) => {
      if (item.tipo === 'evento') {
        respuesta += `📅 ${item.inicio} | ${item.titulo}\n`
      } else {
        respuesta += `✅ ${item.inicio} - ${item.fin} | ${item.titulo} (${item.prioridad})\n`
      }
    })
  }

  return res.json({
    respuesta,
    accion: 'recomendacion_hoy',
    planDia,
  })
}
if (decision.accion === 'organizar_semana') {
  const fechaHoy = new Date().toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     AND (
       fecha >= $1
       OR fecha = 'Sin fecha'
     )
     ORDER BY
       CASE
         WHEN prioridad = 'Alta' THEN 1
         WHEN prioridad = 'Media' THEN 2
         WHEN prioridad = 'Baja' THEN 3
         ELSE 4
       END`,
    [fechaHoy]
  )

  const eventos = await pool.query(
    `SELECT titulo, fecha, hora
     FROM eventos
     WHERE fecha >= $1
     ORDER BY fecha ASC, hora ASC`,
    [fechaHoy]
  )

  const hoy = new Date()
  const diasSemana = []

  for (let i = 0; i < 7; i++) {
    const fecha = new Date()
    fecha.setDate(hoy.getDate() + i)

    diasSemana.push({
      fecha: fecha.toLocaleDateString('sv-SE'),
      nombre: fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
      }),
      tareas: [],
      eventos: [],
      minutosOcupados: 0,
    })
  }

  eventos.rows.forEach((evento) => {
    const dia = diasSemana.find((d) => d.fecha === evento.fecha)

    if (!dia) return

    let horaLimpia = evento.hora

    if (horaLimpia && horaLimpia.includes('T')) {
      horaLimpia = horaLimpia
        .split('T')[1]
        .replace('Z', '')
        .slice(0, 5)
    }

    dia.eventos.push({
      titulo: evento.titulo,
      hora: horaLimpia || 'Sin hora',
    })
  })

  const obtenerConfigPrioridad = (prioridad) => {
    if (prioridad === 'Alta') {
      return {
        repeticiones: 3,
        minutos: 120,
        texto: '2h',
      }
    }

    if (prioridad === 'Media') {
      return {
        repeticiones: 2,
        minutos: 60,
        texto: '1h',
      }
    }

    return {
      repeticiones: 1,
      minutos: 30,
      texto: '30min',
    }
  }

  const convertirMinutosAHora = (minutosTotales) => {
    const horas = Math.floor(minutosTotales / 60)
      .toString()
      .padStart(2, '0')

    const minutos = (minutosTotales % 60)
      .toString()
      .padStart(2, '0')

    return `${horas}:${minutos}`
  }

  let indiceDia = 0
  const inicioDia = 9 * 60
  const descanso = 30

 const franjas = {
  Alta: [
    { inicio: '09:00', fin: '11:00' },
    { inicio: '16:30', fin: '18:30' },
  ],

  Media: [
    { inicio: '11:30', fin: '12:30' },
    { inicio: '18:30', fin: '19:30' },
  ],

  Baja: [
    { inicio: '19:30', fin: '20:00' },
  ],
}

const horaAMinutos = (hora) => {
  if (!hora || hora === 'Sin hora') return null

  const partes = hora.split(':')

  return Number(partes[0]) * 60 + Number(partes[1])
}
const hayChoqueConEvento = (dia, franja) => {
  const inicioTarea = horaAMinutos(franja.inicio)
  const finTarea = horaAMinutos(franja.fin)

  return dia.eventos.some((evento) => {
    const horaEvento = horaAMinutos(evento.hora)

    if (horaEvento === null) return false

    return horaEvento >= inicioTarea && horaEvento < finTarea
  })
}

const hayChoqueConTarea = (dia, franja) => {
  return dia.tareas.some((tarea) => {
    return tarea.horaInicio === franja.inicio
  })
}

let contadorAlta = 0
let contadorMedia = 0
let contadorBaja = 0

tareas.rows.forEach((tarea) => {
 const config = obtenerConfigPrioridad(tarea.prioridad)

const tieneFechaConcreta =
  tarea.fecha && tarea.fecha !== 'Sin fecha'

const diasDisponiblesHastaFecha = tieneFechaConcreta
  ? diasSemana.filter((dia) => dia.fecha <= tarea.fecha)
  : diasSemana

const repeticiones = tieneFechaConcreta
  ? Math.min(config.repeticiones, diasDisponiblesHastaFecha.length)
  : config.repeticiones

for (let i = 0; i < repeticiones; i++) {
  let dia

if (tieneFechaConcreta) {
  const indice =
    i === repeticiones - 1
      ? diasDisponiblesHastaFecha.length - 1
      : i

  dia = diasDisponiblesHastaFecha[indice]
} else {
  dia = diasSemana[indiceDia % diasSemana.length]
}

  let horaAsignada

  if (tarea.prioridad === 'Alta') {
    horaAsignada =
      franjas.Alta[
        contadorAlta % franjas.Alta.length
      ]

    contadorAlta++
  } else if (tarea.prioridad === 'Media') {
    horaAsignada =
      franjas.Media[
        contadorMedia % franjas.Media.length
      ]

    contadorMedia++
  } else {
    horaAsignada =
      franjas.Baja[
        contadorBaja % franjas.Baja.length
      ]

    contadorBaja++
  }

    if (
      hayChoqueConEvento(dia, horaAsignada) ||
      hayChoqueConTarea(dia, horaAsignada)
    ) {
      const franjasDisponibles = franjas[tarea.prioridad].filter(
        (franja) =>
          !hayChoqueConEvento(dia, franja) &&
          !hayChoqueConTarea(dia, franja)
      )

      if (franjasDisponibles.length > 0) {
        horaAsignada = franjasDisponibles[0]
      } else {
        const siguienteDia = diasSemana.find((d) => {
          return franjas[tarea.prioridad].some(
            (franja) =>
              !hayChoqueConEvento(d, franja) &&
              !hayChoqueConTarea(d, franja)
          )
        })

        if (!siguienteDia) {
          indiceDia++
          continue
        }

        dia = siguienteDia

        horaAsignada = franjas[tarea.prioridad].find(
          (franja) =>
            !hayChoqueConEvento(dia, franja) &&
            !hayChoqueConTarea(dia, franja)
        )
      }
    }

    dia.tareas.push({
      titulo: tarea.titulo,
      prioridad: tarea.prioridad,
      duracion: config.texto,
      horaInicio: horaAsignada.inicio,
      horaFin: horaAsignada.fin,
    })

    indiceDia++
  }
})

diasSemana.forEach((dia) => {
  dia.tareas.sort((a, b) =>
    a.horaInicio.localeCompare(b.horaInicio)
  )
})

let respuesta = '📆 Plan semanal sugerido:\n\n'

diasSemana.forEach((dia) => {
  respuesta += `${dia.nombre.toUpperCase()} ${dia.fecha}\n`

  if (dia.tareas.length === 0 && dia.eventos.length === 0) {
    respuesta += '• Sin tareas ni eventos asignados\n\n'
    return
  }

  if (dia.eventos.length > 0) {
    respuesta += 'Eventos:\n'

    dia.eventos.forEach((evento) => {
      respuesta += `• ${evento.hora} | ${evento.titulo}\n`
    })

    respuesta += '\n'
  }

  if (dia.tareas.length > 0) {
    respuesta += 'Tareas:\n'

    dia.tareas.forEach((tarea) => {
      respuesta += `• ${tarea.horaInicio} - ${tarea.horaFin} | ${tarea.titulo} (${tarea.prioridad}) → ${tarea.duracion}\n`
    })
  }

  respuesta += '\n'
})

await pool.query('DELETE FROM plan_semanal')

for (const dia of diasSemana) {
  for (const tarea of dia.tareas) {
    await pool.query(
      `INSERT INTO plan_semanal (
        titulo,
        fecha,
        hora_inicio,
        hora_fin,
        prioridad,
        tipo
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tarea.titulo,
        dia.fecha,
        tarea.horaInicio,
        tarea.horaFin,
        tarea.prioridad,
        'tarea',
      ]
    )
  }

  for (const evento of dia.eventos) {
    await pool.query(
      `INSERT INTO plan_semanal (
        titulo,
        fecha,
        hora_inicio,
        hora_fin,
        prioridad,
        tipo
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        evento.titulo,
        dia.fecha,
        evento.hora,
        null,
        'Evento',
        'evento',
      ]
    )
  }
}

return res.json({
  respuesta,
  accion: 'organizar_semana',
  plan: diasSemana,
})}

    if (decision.accion === 'crear_nota') {
      const result = await pool.query(
        `INSERT INTO notas (titulo, categoria, contenido, color)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          decision.titulo || 'Nueva nota',
          decision.categoria || 'Ideas',
          '',
          'purple',
        ]
      )

      

      return res.json({
        respuesta: decision.respuesta || `📝 He creado la nota "${decision.titulo}".`,
        accion: 'crear_nota',
        data: result.rows[0],
      })
    }

    if (decision.accion === 'borrar_nota') {
      const nota = await borrarPorTitulo('notas', decision.titulo)

      return res.json({
        respuesta: nota
          ? `🗑️ He borrado la nota "${nota.titulo}".`
          : `No he encontrado una nota llamada "${decision.titulo}".`,
        accion: 'borrar_nota',
        data: nota,
      })
    }

    if (decision.accion === 'tiempo_libre') {
  const hoy = new Date().toLocaleDateString('sv-SE')

  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     ORDER BY
       CASE
         WHEN fecha <> 'Sin fecha' AND fecha < $1 THEN 1
         WHEN fecha = $1 THEN 2
         WHEN prioridad = 'Alta' THEN 3
         WHEN prioridad = 'Media' THEN 4
         ELSE 5
       END,
       fecha ASC
     LIMIT 3`,
    [hoy]
  )

  if (tareas.rows.length === 0) {
    return res.json({
      respuesta:
        '🎉 No tienes tareas pendientes. Aprovecha ese rato para descansar o hacer algo que te guste.',
      accion: 'tiempo_libre',
    })
  }

  let respuesta =
    '⏳ Si tienes un rato libre, yo aprovecharía para avanzar estas tareas:\n\n'

  tareas.rows.forEach((t, index) => {
    respuesta += `${index + 1}. ${t.titulo} (${t.prioridad})`

    if (t.fecha && t.fecha !== 'Sin fecha') {
      respuesta += ` - ${t.fecha}`
    }

    respuesta += '\n'
  })

  respuesta +=
    '\n💡 No te pongo un horario exacto porque todavía no sabemos la duración estimada de cada tarea. De momento, te recomiendo empezar por la primera y avanzar lo que puedas.'

  return res.json({
    respuesta,
    accion: 'tiempo_libre',
  })
}

    if (decision.accion === 'crear_tarea') {
  decision.titulo = mensaje
  .toLowerCase()
  .replace('creame', '')
  .replace('créame', '')
  .replace('crea', '')
  .replace('crear', '')

  .replace(/para el \d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, '')
.replace(/el \d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, '')
.replace(/\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, '')

  .replace('una tarea de', '')
  .replace('una tarea para', '')
  .replace('una tarea', '')
  .replace('la tarea de', '')
  .replace('la tarea para', '')
  .replace('la tarea', '')
  .replace('el tarea', '')

  

  .replace('tarea de', '')
  .replace('tarea para', '')
  .replace('tarea', '')

  .replace('de estudio', 'estudiar')
  .replace('para estudiar', 'estudiar')

  .replace('para pasado mañana', '')
  .replace('pasado mañana', '')
  .replace('para mañana', '')
  .replace('mañana', '')
  .replace('para hoy', '')
  .replace('hoy', '')

  .replace(/para el \d{1,2}\/\d{1,2}\/\d{4}/gi, '')
  .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '')

  .replace('con prioridad alta', '')
  .replace('prioridad alta', '')
  .replace('con prioridad media', '')
  .replace('prioridad media', '')
  .replace('con prioridad baja', '')
  .replace('prioridad baja', '')

  .replace(/a las .*/i, '')

  .replace(/^la\s+/i, '')
  .replace(/^el\s+/i, '')
  .replace(/^los\s+/i, '')
  .replace(/^las\s+/i, '')
  .replace(/para el \d{1,2}\/\d{1,2}\/\d{4}/gi, '')
.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '')

.replace(/el día \d{1,2}/gi, '')


  .replace(/\s+/g, ' ')
  
  .trim()

  // Primera letra en mayúscula
  decision.titulo =
    decision.titulo.charAt(0).toUpperCase() +
    decision.titulo.slice(1)


  const prioridad = decision.prioridad || 'Alta'

const fechaTarea = obtenerFecha(mensaje, decision.fecha)

const tareaDuplicada = await pool.query(
  `SELECT titulo
   FROM tareas
   WHERE completada = false
   AND LOWER(titulo) = LOWER($1)
   AND fecha = $2`,
  [
    decision.titulo || 'Nueva tarea',
    fechaTarea,
  ]
)

if (tareaDuplicada.rows.length > 0) {
  return res.json({
    respuesta:
      `⚠️ Ya tienes una tarea llamada "${decision.titulo}" para esa fecha.\n\n` +
      `No la he creado para evitar duplicados.`,
    accion: 'tarea_duplicada',
  })
}

const clase =
  prioridad === 'Alta'
    ? 'high'
    : prioridad === 'Media'
      ? 'medium'
      : ''

const result = await pool.query(
  `INSERT INTO tareas (
    titulo,
    fecha,
    prioridad,
    categoria,
    notas,
    clase,
    completada
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *`,
  [
    decision.titulo || 'Nueva tarea',
    fechaTarea,
    prioridad,
    decision.categoria || 'Personal',
    '',
    clase,
    false,
  ]
)

return res.json({
  respuesta: `✅ He creado la tarea "${decision.titulo}".`,
  accion: 'crear_tarea',
  data: result.rows[0],
})
}

if (
  textoMensaje.includes('borrame') ||
  textoMensaje.includes('bórrame') ||
  textoMensaje.includes('borra') ||
  textoMensaje.includes('borrar') ||
  textoMensaje.includes('elimina') ||
  textoMensaje.includes('quitar')
) {
  if (
    textoMensaje.includes('tarea') ||
    textoMensaje.includes('tareas')
  ) {
    decision.accion = 'borrar_tarea'

    decision.titulo = mensaje
      .toLowerCase()
      .replace('borrame', '')
      .replace('bórrame', '')
      .replace('borra', '')
      .replace('borrar', '')
      .replace('elimina', '')
      .replace('quitar', '')
      .replace('la tarea', '')
      .replace('una tarea', '')
      .replace('tarea', '')
      .replace('para mañana', '')
      .replace('mañana', '')
      .replace('para hoy', '')
      .replace('hoy', '')
      .replace('pasado mañana', '')
      .replace('con prioridad alta', '')
      .replace('prioridad alta', '')
      .replace('con prioridad media', '')
      .replace('prioridad media', '')
      .replace('con prioridad baja', '')
      .replace('prioridad baja', '')
      .replace(/a las .*/i, '')
      .trim()

    decision.titulo =
      decision.titulo.charAt(0).toUpperCase() +
      decision.titulo.slice(1)
  }
}

    if (decision.accion === 'borrar_tarea') {
      const tarea = await borrarPorTitulo('tareas', decision.titulo)

      return res.json({
        respuesta: tarea
          ? `🗑️ He borrado la tarea "${tarea.titulo}".`
          : `No he encontrado una tarea llamada "${decision.titulo}".`,
        accion: 'borrar_tarea',
        data: tarea,
      })
    }

    if (decision.accion === 'crear_objetivo') {
      const result = await pool.query(
        `INSERT INTO objetivos (
          titulo,
          categoria,
          progreso,
          completado
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          decision.titulo || 'Nuevo objetivo',
          decision.categoria || 'Personal',
          0,
          false,
        ]
      )

      return res.json({
        respuesta: decision.respuesta || `🎯 He creado el objetivo "${decision.titulo}".`,
        accion: 'crear_objetivo',
        data: result.rows[0],
      })
    }

    if (decision.accion === 'borrar_objetivo') {
      const objetivo = await borrarPorTitulo('objetivos', decision.titulo)

      return res.json({
        respuesta: objetivo
          ? `🗑️ He borrado el objetivo "${objetivo.titulo}".`
          : `No he encontrado un objetivo llamado "${decision.titulo}".`,
        accion: 'borrar_objetivo',
        data: objetivo,
      })
    }

    if (decision.accion === 'crear_evento') {

  const fecha = obtenerFecha(mensaje, decision.fecha, true)
  const hora = decision.hora || 'Sin hora'

  // Comprobar si ya existe un evento a esa hora
  if (hora !== 'Sin hora') {
    const conflicto = await pool.query(
      `SELECT titulo
       FROM eventos
       WHERE fecha = $1
       AND hora = $2`,
      [fecha, hora]
    )

    if (conflicto.rows.length > 0) {
      return res.json({
        accion: 'conflicto_horario',
        respuesta:
          `⚠️ Ya tienes un evento a las ${hora}.\n\n` +
          `• ${conflicto.rows[0].titulo}\n\n` +
          `¿Quieres crear el nuevo igualmente?`,
      })
    }
  }

  const result = await pool.query(
    `INSERT INTO eventos (
      titulo,
      fecha,
      hora,
      categoria,
      color
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      decision.titulo || 'Evento',
      fecha,
      hora,
      decision.categoria || 'Personal',
      'pink',
    ]
  )

  return res.json({
    respuesta:
      decision.respuesta ||
      `📅 He creado el evento "${decision.titulo}".`,
    accion: 'crear_evento',
    data: result.rows[0],
  })
}

    if (decision.accion === 'borrar_evento') {
      const evento = await borrarPorTitulo('eventos', decision.titulo)

      return res.json({
        respuesta: evento
          ? `🗑️ He borrado el evento "${evento.titulo}".`
          : `No he encontrado un evento llamado "${decision.titulo}".`,
        accion: 'borrar_evento',
        data: evento,
      })
    }

    return res.json({
      respuesta: decision.respuesta || '🤖 Dime qué quieres crear, borrar o consultar.',
    })
  } catch (error) {
  console.log('ERROR IA:', error)

  res.status(500).json({
    respuesta: `❌ Error real: ${error.message}`,
  })
}


}

