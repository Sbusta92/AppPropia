import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

function Agenda({ eventos, setEventos }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [categoria, setCategoria] = useState('Personal')

  const coloresCategorias = {
    Ideas: 'purple',
    Estudio: 'blue',
    Trabajo: 'red',
    Personal: 'pink',
    Importante: 'green',
    Recordatorio: 'orange',
    Proyecto: 'cyan',
    Compras: 'yellow',
    Objetivos: 'lime',
    Salud: 'emerald',
    Viajes: 'sky',
    Deportes: 'grey',
  }

  const iconosCategorias = {
    Ideas: '💡',
    Estudio: '📚',
    Trabajo: '💼',
    Personal: '👤',
    Importante: '🔥',
    Recordatorio: '⚡',
    Proyecto: '🚀',
    Compras: '🛒',
    Objetivos: '🎯',
    Salud: '💚',
    Viajes: '✈️',
    Deportes: '⚽',
  }

  useEffect(() => {
    cargarEventos()
  }, [])

  const cargarEventos = async () => {
    try {
      const respuesta = await fetch('http://localhost:3001/eventos')
      const datos = await respuesta.json()

      setEventos(datos)
    } catch (error) {
      console.log('Error cargando eventos:', error)
    }
  }

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('sv-SE')
  }

  const fechaFormateada = formatearFecha(fechaSeleccionada)

  const eventosDelDia = eventos.filter(
    (evento) => evento.fecha === fechaFormateada
  )

  const guardarEvento = async () => {
    if (titulo.trim() === '' || fecha === '' || hora === '') return

    const nuevoEvento = {
      titulo,
      fecha,
      hora,
      categoria,
      color: coloresCategorias[categoria] || 'purple',
    }

    try {
      const respuesta = await fetch('http://localhost:3001/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoEvento),
      })

      const eventoGuardado = await respuesta.json()

      setEventos([
        ...eventos,
        eventoGuardado,
      ])

      setTitulo('')
      setFecha('')
      setHora('')
      setCategoria('Personal')
      setMostrarFormulario(false)
    } catch (error) {
      console.log('Error guardando evento:', error)
    }
  }

  const eliminarEvento = async (idEliminar) => {
    try {
      await fetch(`http://localhost:3001/eventos/${idEliminar}`, {
        method: 'DELETE',
      })

      setEventos(
        eventos.filter((evento) => evento.id !== idEliminar)
      )
    } catch (error) {
      console.log('Error eliminando evento:', error)
    }
  }

  return (
    <section className="goals-page">
      <div className="notes-header">
        <div>
          <small>📅 Organización del tiempo</small>
          <h1>Agenda</h1>
          <p>Gestiona tus eventos y fechas importantes.</p>
        </div>

        <button
          className="add-note-btn"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          + Nuevo evento
        </button>
      </div>

      <div className="calendar-box">
        <Calendar
          onChange={setFechaSeleccionada}
          value={fechaSeleccionada}
          tileClassName={({ date, view }) => {
            if (view === 'month') {
              const fechaCalendario = formatearFecha(date)

              const tieneEvento = eventos.some(
                (evento) => evento.fecha === fechaCalendario
              )

              if (tieneEvento) {
                return 'evento-dia'
              }
            }
          }}
        />
      </div>

      <div className="task-layout">
        {mostrarFormulario && (
          <div className="note-form">
            <h2>Nuevo evento</h2>

            <input
              type="text"
              placeholder="Título del evento"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <div className="form-row">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />

              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option>Ideas</option>
              <option>Estudio</option>
              <option>Trabajo</option>
              <option>Personal</option>
              <option>Importante</option>
              <option>Recordatorio</option>
              <option>Proyecto</option>
              <option>Compras</option>
              <option>Objetivos</option>
              <option>Salud</option>
              <option>Viajes</option>
              <option>Deportes</option>
            </select>

            <button
              className="primary-btn"
              onClick={guardarEvento}
            >
              Guardar evento
            </button>
          </div>
        )}

        {eventosDelDia.length > 0 ? (
          <div className="goals-grid">
            {eventosDelDia.map((evento) => (
              <div
                className={`note-card ${evento.color}`}
                key={evento.id}
              >
                <button
                  className="delete-note"
                  onClick={() => eliminarEvento(evento.id)}
                >
                  🗑
                </button>

                <span>
                  {iconosCategorias[evento.categoria]} {evento.categoria}
                </span>

                <h3>{evento.titulo}</h3>

                <p>📅 {evento.fecha}</p>
                <p>⏰ {evento.hora}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-tasks">
            <h2>📅 No tienes eventos este día</h2>
            <p>Selecciona otro día o crea un nuevo evento.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Agenda