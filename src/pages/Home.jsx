import { Link } from 'react-router-dom'

function Home({
  tareasPendientes,
  tareasCompletadas,
  notas,
  objetivosPendientes,
  eventos,
}) {
  const totalTareas =
    tareasPendientes.length + tareasCompletadas.length

  const porcentajeCompletado =
    totalTareas > 0
      ? Math.round((tareasCompletadas.length / totalTareas) * 100)
      : 0

  const tareasAltas = tareasPendientes.filter(
    (tarea) => tarea.prioridad === 'Alta'
  ).length

  const tareasMedias = tareasPendientes.filter(
    (tarea) => tarea.prioridad === 'Media'
  ).length

  const tareasBajas = tareasPendientes.filter(
    (tarea) => tarea.prioridad === 'Baja'
  ).length

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('sv-SE')
  }

  const hoy = formatearFecha(new Date())

  const mananaDate = new Date()
  mananaDate.setDate(mananaDate.getDate() + 1)

  const manana = formatearFecha(mananaDate)

  const eventosProximos = eventos.filter(
    (evento) => evento.fecha >= hoy
  )

  const eventosHoy = eventos.filter(
    (evento) => evento.fecha === hoy
  )

  const eventosManana = eventos.filter(
    (evento) => evento.fecha === manana
  )

  const tareasHoy = tareasPendientes.filter(
    (tarea) => tarea.fecha === hoy
  )

  const tareasManana = tareasPendientes.filter(
    (tarea) => tarea.fecha === manana
  )

  const tareasVencidas = tareasPendientes.filter(
    (tarea) =>
      tarea.fecha &&
      tarea.fecha !== 'Sin fecha' &&
      tarea.fecha < hoy
  )

  const reprogramarVencidas = async () => {
    try {
      const res = await fetch(
        'http://localhost:3001/tareas/reprogramar-vencidas',
        { method: 'POST' }
      )

      const data = await res.json()

      alert(`Se han reprogramado ${data.length} tareas vencidas.`)

      window.location.reload()
    } catch (error) {
      console.log(error)
      alert('Error al reprogramar tareas vencidas')
    }
  }

  const generarInsightsIA = () => {
    const insights = []

    if (tareasVencidas.length > 0) {
      insights.push(
        `⚠️ Tienes ${tareasVencidas.length} tareas vencidas`
      )
    }

    if (tareasAltas >= 3) {
      insights.push(
        `🔥 Tienes ${tareasAltas} tareas de prioridad alta`
      )
    }

    if (eventosHoy.length > 0) {
      insights.push(
        `📅 Tienes ${eventosHoy.length} eventos hoy`
      )
    }

    if (porcentajeCompletado >= 70) {
      insights.push(
        `🚀 Productividad excelente (${porcentajeCompletado}%)`
      )
    } else if (porcentajeCompletado >= 40) {
      insights.push(
        `👍 Productividad buena (${porcentajeCompletado}%)`
      )
    } else {
      insights.push(
        `📊 Productividad mejorable (${porcentajeCompletado}%)`
      )
    }

    if (
      tareasPendientes.length === 0 &&
      eventosProximos.length === 0
    ) {
      insights.push('🎉 Todo al día')
    }

    return insights
  }

  const insightsIA = generarInsightsIA()

  const hayAvisos =
    eventosHoy.length > 0 ||
    eventosManana.length > 0 ||
    tareasHoy.length > 0 ||
    tareasManana.length > 0

  return (
    <>
      <header>
        <h1>Buenas tardes 👋</h1>
        <p>Organiza tu día con ayuda de IA</p>
      </header>

      <section className="cards">
        <Link to="/tareas" className="card dashboard-link-card">
          <h3>Tareas pendientes</h3>
          <p>{tareasPendientes.length} tareas pendientes</p>
        </Link>

        <Link to="/objetivos" className="card dashboard-link-card">
          <h3>Objetivos</h3>
          <p>{objetivosPendientes.length} objetivos activos</p>
        </Link>

        <Link to="/notas" className="card dashboard-link-card">
          <h3>Notas rápidas</h3>
          <p>{notas.length} notas guardadas</p>
        </Link>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>✅ Productividad</span>
          <h3>{porcentajeCompletado}%</h3>
          <p>Tareas completadas</p>
        </div>

        <Link to="/agenda" className="stat-card dashboard-link-card">
          <span>📅 Agenda</span>
          <h3>{eventosProximos.length}</h3>
          <p>Próximos eventos</p>
        </Link>

        <Link to="/tareas" className="stat-card dashboard-link-card">
          <span>🔥 Prioridad alta</span>
          <h3>{tareasAltas}</h3>
          <p>Tareas importantes</p>
        </Link>
      </section>

      {hayAvisos && (
        <section className="alerts-box">
          {tareasHoy.map((tarea, index) => (
            <div
              className="alert-card today"
              key={`tarea-hoy-${index}`}
            >
              ✅ Hoy tienes una tarea:
              <strong> {tarea.titulo} </strong>
              {tarea.prioridad && (
                <span>({tarea.prioridad})</span>
              )}
            </div>
          ))}

          {eventosHoy.map((evento, index) => (
            <div
              className="alert-card today"
              key={`evento-hoy-${index}`}
            >
              ⏰ Hoy tienes un evento:
              <strong> {evento.titulo} </strong>
              a las {evento.hora}
            </div>
          ))}

          {tareasManana.map((tarea, index) => (
            <div
              className="alert-card tomorrow"
              key={`tarea-manana-${index}`}
            >
              ✅ Mañana tienes una tarea:
              <strong> {tarea.titulo} </strong>
              {tarea.prioridad && (
                <span>({tarea.prioridad})</span>
              )}
            </div>
          ))}

          {eventosManana.map((evento, index) => (
            <div
              className="alert-card tomorrow"
              key={`evento-manana-${index}`}
            >
              📅 Mañana tienes un evento:
              <strong> {evento.titulo} </strong>
              a las {evento.hora}
            </div>
          ))}
        </section>
      )}

      <section className="ia-box">
        <h2>✨ IA Insights</h2>

        <div className="insight-card">
          {tareasPendientes.length > 0 && (
            <div className="priority-summary">
              {tareasAltas > 0 && (
                <span>🔥 {tareasAltas} altas</span>
              )}

              {tareasMedias > 0 && (
                <span>⚡ {tareasMedias} medias</span>
              )}

              {tareasBajas > 0 && (
                <span>🌱 {tareasBajas} bajas</span>
              )}
            </div>
          )}

          <div className="insights-list">
            {insightsIA.map((insight, index) => (
              <p key={index}>{insight}</p>
            ))}
          </div>

          {tareasVencidas.length > 0 && (
            <>
              <small className="insight-advice">
                La IA recomienda reprogramarlas o marcarlas como completadas.
              </small>

              <button
                className="primary-btn"
                onClick={reprogramarVencidas}
                style={{ marginTop: '18px' }}
              >
                🔄 Reprogramar tareas vencidas
              </button>
            </>
          )}

          {tareasVencidas.length === 0 && tareasAltas >= 3 && (
            <small className="insight-advice">
              Prioriza 2 tareas importantes hoy para evitar acumulación.
            </small>
          )}

          {tareasVencidas.length === 0 &&
            tareasAltas < 3 &&
            eventosHoy.length > 0 && (
              <small className="insight-advice">
                Revisa tu agenda antes de planificar nuevas tareas.
              </small>
            )}
        </div>
      </section>
    </>
  )
}

export default Home