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
- Si pregunta por sus tareas -> consultar_tareas.
- Si pregunta qué tiene pendiente -> consultar_tareas.
- Si pregunta qué tiene hoy, mañana, pasado mañana o un día de la semana -> consultar_dia.
- Si el usuario dice "organízame la semana", "organiza mi semana", "hazme un horario semanal", "planifica mi semana" o "qué debería hacer esta semana" -> organizar_semana.
- Si el usuario dice "qué hago hoy", "que hago hoy", "qué debería hacer hoy", "que deberia hacer hoy", "recomiéndame el día", "recomiendame el dia", "organizame el día", "organízame el día", "organiza mi día" o "organiza mi dia" -> recomendacion_hoy.
- Si el usuario dice "hazme un planning", "hazme un plan", "créame un planning", "crea un planning", "organízame un planning" o "plan de estudio", "plan de ejercicio", "planning de ejercicio" -> crear_planning.
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
  if (fechaIA) return fechaIA

  const texto = mensaje.toLowerCase()

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

if (
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

if (decision.accion === 'consultar_tareas') {
  const tareas = await pool.query(
    `SELECT titulo, prioridad, fecha
     FROM tareas
     WHERE completada = false
     ORDER BY fecha ASC`
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

    if (decision.accion === 'crear_tarea') {
  decision.titulo = mensaje
    .toLowerCase()
    .replace('creame', '')
    .replace('créame', '')
    .replace('crea', '')
    .replace('crear', '')
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

  const prioridad = decision.prioridad || 'Alta'

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
      obtenerFecha(mensaje, decision.fecha),
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
          obtenerFecha(mensaje, decision.fecha, true),
          decision.hora || 'Sin hora',
          decision.categoria || 'Personal',
          'pink',
        ]
      )

      return res.json({
        respuesta: decision.respuesta || `📅 He creado el evento "${decision.titulo}".`,
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