import { useEffect, useState } from 'react'

function Objetivos({
  objetivosPendientes,
  setObjetivosPendientes,
  objetivosCompletados,
  setObjetivosCompletados,
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('Personal')
  const [progreso, setProgreso] = useState(0)

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
    cargarObjetivos()
  }, [])

  const cargarObjetivos = async () => {
    try {
      const respuesta = await fetch('http://localhost:3001/objetivos')
      const datos = await respuesta.json()

      setObjetivosPendientes(
        datos.filter((objetivo) => !objetivo.completado)
      )

      setObjetivosCompletados(
        datos.filter((objetivo) => objetivo.completado)
      )
    } catch (error) {
      console.log('Error cargando objetivos:', error)
    }
  }

  const guardarObjetivo = async () => {
    if (titulo.trim() === '') return

    const nuevoObjetivo = {
      titulo,
      categoria,
      progreso,
      completado: false,
      color: coloresCategorias[categoria] || 'purple',
    }

    try {
      const respuesta = await fetch('http://localhost:3001/objetivos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoObjetivo),
      })

      const objetivoGuardado = await respuesta.json()

      setObjetivosPendientes([
        objetivoGuardado,
        ...objetivosPendientes,
      ])

      setTitulo('')
      setCategoria('Personal')
      setProgreso(0)
      setMostrarFormulario(false)
    } catch (error) {
      console.log('Error guardando objetivo:', error)
    }
  }

  const eliminarPendiente = async (idEliminar) => {
    try {
      await fetch(`http://localhost:3001/objetivos/${idEliminar}`, {
        method: 'DELETE',
      })

      setObjetivosPendientes(
        objetivosPendientes.filter(
          (objetivo) => objetivo.id !== idEliminar
        )
      )
    } catch (error) {
      console.log('Error eliminando objetivo:', error)
    }
  }

  const eliminarCompletado = async (idEliminar) => {
    try {
      await fetch(`http://localhost:3001/objetivos/${idEliminar}`, {
        method: 'DELETE',
      })

      setObjetivosCompletados(
        objetivosCompletados.filter(
          (objetivo) => objetivo.id !== idEliminar
        )
      )
    } catch (error) {
      console.log('Error eliminando objetivo:', error)
    }
  }

  const completarObjetivo = async (idCompletar) => {
    try {
      const respuesta = await fetch(
        `http://localhost:3001/objetivos/${idCompletar}/completar`,
        {
          method: 'PUT',
        }
      )

      const objetivoActualizado = await respuesta.json()

      setObjetivosPendientes(
        objetivosPendientes.filter(
          (objetivo) => objetivo.id !== idCompletar
        )
      )

      setObjetivosCompletados([
        objetivoActualizado,
        ...objetivosCompletados,
      ])
    } catch (error) {
      console.log('Error completando objetivo:', error)
    }
  }

  const actualizarProgreso = async (idActualizar, nuevoProgreso) => {
    try {
      const respuesta = await fetch(
        `http://localhost:3001/objetivos/${idActualizar}/progreso`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            progreso: nuevoProgreso,
          }),
        }
      )

      const objetivoActualizado = await respuesta.json()

      setObjetivosPendientes(
        objetivosPendientes.map((objetivo) =>
          objetivo.id === idActualizar
            ? objetivoActualizado
            : objetivo
        )
      )
    } catch (error) {
      console.log('Error actualizando progreso:', error)
    }
  }

  const hayObjetivos =
    objetivosPendientes.length > 0 || objetivosCompletados.length > 0

  return (
    <section className="tasks-page">
      <div className="tasks-header">
        <div>
          <small>🎯 Metas y progreso</small>
          <h1>Objetivos</h1>
          <p>Sigue tu progreso y alcanza tus metas.</p>
        </div>

        <button
  className="add-task-btn"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          + Nuevo objetivo
        </button>
      </div>

      <div className="task-layout">
        {mostrarFormulario && (
          <div className="note-form">
            <h2>Nuevo objetivo</h2>

            <input
              type="text"
              placeholder="Título del objetivo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

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

            <input
              type="range"
              min="0"
              max="100"
              value={progreso}
              onChange={(e) => setProgreso(e.target.value)}
            />

            <p>📈 Progreso: {progreso}%</p>

            <button
              className="primary-btn"
              onClick={guardarObjetivo}
            >
              Guardar objetivo
            </button>
          </div>
        )}

        {hayObjetivos ? (
          <div>
            {objetivosPendientes.length > 0 && (
              <>
                <h2 className="section-title">Pendientes</h2>

                <div className="tasks-list">
                  {objetivosPendientes.map((objetivo) => (
                    <div
                      className={`note-card ${objetivo.color || 'grey'}`}
                      key={objetivo.id}
                    >
                      <button
                        className="delete-note"
                        onClick={() => eliminarPendiente(objetivo.id)}
                      >
                        🗑
                      </button>

                      <span>
                        {iconosCategorias[objetivo.categoria]}{' '}
                        {objetivo.categoria}
                      </span>

                      <h3>{objetivo.titulo}</h3>

                      <p>📈 Progreso: {objetivo.progreso}%</p>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={objetivo.progreso}
                        onChange={(e) =>
                          actualizarProgreso(
                            objetivo.id,
                            e.target.value
                          )
                        }
                      />

                      <button
                        className="complete-btn"
                        onClick={() =>
                          completarObjetivo(objetivo.id)
                        }
                      >
                        ✅ Completar
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {objetivosCompletados.length > 0 && (
              <>
                <h2 className="section-title completed-title">
                  Completados
                </h2>

                <div className="notes-grid">
                  {objetivosCompletados.map((objetivo) => (
                    <div
                      className={`note-card ${objetivo.color || 'green'}`}
                      key={objetivo.id}
                    >
                      <button
                        className="delete-note"
                        onClick={() =>
                          eliminarCompletado(objetivo.id)
                        }
                      >
                        🗑
                      </button>

                      <span>✅ Completado</span>

                      <h3>{objetivo.titulo}</h3>

                      <p>📈 Progreso: 100%</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="empty-tasks">
            <h2>🎯 No tienes objetivos todavía</h2>
            <p>Pulsa “Nuevo objetivo” para empezar.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Objetivos