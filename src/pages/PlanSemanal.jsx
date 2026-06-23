import { useEffect, useState } from 'react'

function PlanSemanal() {
  const [planVisual, setPlanVisual] = useState([])

  useEffect(() => {
  cargarPlanGuardado()
}, [])

const cargarPlanGuardado = async () => {
  try {
    const res = await fetch('http://localhost:3001/plan-semanal')
    const data = await res.json()

    const planAgrupado = []

    data.forEach((item) => {
      let dia = planAgrupado.find((d) => d.fecha === item.fecha)

      if (!dia) {
        dia = {
          fecha: item.fecha,
          nombre: new Date(item.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
          }),
          tareas: [],
          eventos: [],
        }

        planAgrupado.push(dia)
      }

      if (item.tipo === 'evento') {
        dia.eventos.push({
          titulo: item.titulo,
          hora: item.hora_inicio,
        })
      } else {
        dia.tareas.push({
          titulo: item.titulo,
          prioridad: item.prioridad,
          duracion:
            item.prioridad === 'Alta'
              ? '2h'
              : item.prioridad === 'Media'
                ? '1h'
                : '30min',
          horaInicio: item.hora_inicio,
          horaFin: item.hora_fin,
        })
      }
    })

    setPlanVisual(planAgrupado)
  } catch (error) {
    console.log(error)
  }
}

  const generarPlan = async () => {
    try {
      const res = await fetch('http://localhost:3001/ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: 'organizame la semana',
        }),
      })

      const data = await res.json()

      setPlanVisual(data.plan || [])
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <section className="ia-page">
      <div className="ia-header">
        <small>📆 Organización inteligente</small>

        <h1>Plan semanal</h1>

        <p>
          Genera automáticamente tu horario semanal según prioridades.
        </p>

        <button
          className="primary-btn"
          onClick={generarPlan}
        >
          Generar plan
        </button>
      </div>

      {planVisual.length === 0 && (
        <div className="smart-chat">
          Pulsa "Generar plan".
        </div>
      )}

      {planVisual.length > 0 && (
        <section className="weekly-grid">
          {planVisual.map((dia) => (
            <div className="weekly-card" key={dia.fecha}>
              <h3>
                {dia.nombre} <span>{dia.fecha}</span>
              </h3>

              {dia.eventos && dia.eventos.length > 0 && (
  dia.eventos.map((evento, index) => (
    <div className="weekly-event-card" key={index}>
      <strong>📅 {evento.hora}</strong>
      <p>{evento.titulo}</p>
      <small>Evento</small>
    </div>
  ))
)}

              {dia.tareas.length === 0 ? (
                <p className="empty-day">Sin tareas asignadas</p>
              ) : (
                dia.tareas.map((tarea, index) => (
                  <div
                    className={`weekly-task ${tarea.prioridad?.toLowerCase()}`}
                    key={index}
                  >
                    <strong>
                      {tarea.horaInicio} - {tarea.horaFin}
                    </strong>

                    <p>{tarea.titulo}</p>

                    <small>
                      {tarea.prioridad} · {tarea.duracion}
                    </small>
                  </div>
                ))
              )}
            </div>
          ))}
        </section>
      )}
    </section>
  )
}

export default PlanSemanal