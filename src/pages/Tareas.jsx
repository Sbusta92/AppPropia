import { useEffect, useState } from 'react'

function Tareas({
  tareasPendientes,
  setTareasPendientes,
  tareasCompletadas,
  setTareasCompletadas,
}) {

  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [prioridad, setPrioridad] = useState('Alta')
  const [categoria, setCategoria] = useState('Personal')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')

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
    cargarTareas()
  }, [])

  const cargarTareas = async () => {

    try {

      const respuesta = await fetch(
        'http://localhost:3001/tareas'
      )

      const datos = await respuesta.json()

      const pendientes = datos.filter(
        (tarea) => !tarea.completada
      )

      const completadas = datos.filter(
        (tarea) => tarea.completada
      )

      setTareasPendientes(pendientes)

      setTareasCompletadas(completadas)

    } catch (error) {

      console.log(
        'Error cargando tareas:',
        error
      )

    }
  }

  const hayTareas =
    tareasPendientes.length > 0 ||
    tareasCompletadas.length > 0

  const guardarTarea = async () => {

    if (titulo.trim() === '') return

    const nuevaTarea = {
      titulo,
      fecha: fecha || 'Sin fecha',
      prioridad,
      categoria,
      notas,

      clase:
        prioridad === 'Alta'
          ? 'high'
          : prioridad === 'Media'
            ? 'medium'
            : '',

      completada: false,
    }

    try {

      const respuesta = await fetch(
        'http://localhost:3001/tareas',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify(nuevaTarea),
        }
      )

      const tareaGuardada =
        await respuesta.json()

      setTareasPendientes([
        tareaGuardada,
        ...tareasPendientes,
      ])

      setTitulo('')
      setPrioridad('Alta')
      setCategoria('Personal')
      setFecha('')
      setNotas('')

      setMostrarFormulario(false)

    } catch (error) {

      console.log(
        'Error guardando tarea:',
        error
      )

    }
  }

  const completarTarea = async (idCompletar) => {

  try {

    const respuesta = await fetch(
      `http://localhost:3001/tareas/${idCompletar}/completar`,
      {
        method: 'PUT',
      }
    )

    const tareaActualizada =
      await respuesta.json()

    setTareasPendientes(
      tareasPendientes.filter(
        (tarea) =>
          tarea.id !== idCompletar
      )
    )

    setTareasCompletadas([
      tareaActualizada,
      ...tareasCompletadas,
    ])

  } catch (error) {

    console.log(
      'Error completando tarea:',
      error
    )

  }
}

  const eliminarPendiente = async (idEliminar) => {

    try {

      await fetch(
        `http://localhost:3001/tareas/${idEliminar}`,
        {
          method: 'DELETE',
        }
      )

      setTareasPendientes(
        tareasPendientes.filter(
          (tarea) =>
            tarea.id !== idEliminar
        )
      )

    } catch (error) {

      console.log(
        'Error eliminando tarea:',
        error
      )

    }
  }

  const eliminarCompletada = async (idEliminar) => {

    try {

      await fetch(
        `http://localhost:3001/tareas/${idEliminar}`,
        {
          method: 'DELETE',
        }
      )

      setTareasCompletadas(
        tareasCompletadas.filter(
          (tarea) =>
            tarea.id !== idEliminar
        )
      )

    } catch (error) {

      console.log(
        'Error eliminando tarea:',
        error
      )

    }
  }

  return (
    <section className="tasks-page">

      <div className="tasks-header">

        <div className="tasks-title">

          <small>✅ Gestión de tareas</small>

          <h1>Mis tareas</h1>

          <p>
            Crea, organiza y prioriza lo que tienes pendiente.
          </p>

        </div>

        <button
          className="add-task-btn"
          onClick={() =>
            setMostrarFormulario(!mostrarFormulario)
          }
        >
          + Nueva tarea
        </button>

      </div>

      <div className="task-layout">

        {mostrarFormulario && (

          <div className="task-form">

            <h2>Añadir tarea</h2>

            <input
              type="text"
              placeholder="Nombre de la tarea"
              value={titulo}
              onChange={(e) =>
                setTitulo(e.target.value)
              }
            />

            <div className="form-row">

              <select
                value={prioridad}
                onChange={(e) =>
                  setPrioridad(e.target.value)
                }
              >
                <option>Alta</option>
                <option>Media</option>
                <option>Baja</option>
              </select>

              <input
                type="date"
                value={fecha}
                onChange={(e) =>
                  setFecha(e.target.value)
                }
              />

            </div>

            <select
              value={categoria}
              onChange={(e) =>
                setCategoria(e.target.value)
              }
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

            <textarea
              placeholder="Notas o detalles..."
              value={notas}
              onChange={(e) =>
                setNotas(e.target.value)
              }
            />

            <button
              className="primary-btn"
              onClick={guardarTarea}
            >
              Guardar tarea
            </button>

          </div>

        )}

        {hayTareas ? (

          <div className="task-list">

            {tareasPendientes.length > 0 && (
              <>

                <h2>Pendientes</h2>

                {tareasPendientes.map((tarea) => (

                  <div
                    className={`task-item ${tarea.clase}`}
                    key={tarea.id}
                  >

                    <div>

                      <p className="task-category">
                        {
                          iconosCategorias[
                            tarea.categoria
                          ]
                        }

                        {' '}

                        {tarea.categoria}
                      </p>

                      <h3>{tarea.titulo}</h3>

                      <p>
                        Fecha límite:
                        {' '}
                        {tarea.fecha}
                      </p>

                      {tarea.notas && (
                        <p className="task-notes">
                          📝 {tarea.notas}
                        </p>
                      )}

                     <div className="task-actions">

  <button
    className="complete-btn"
    onClick={() =>
      completarTarea(
        tarea.id
      )
    }
  >
    ✅ Completar
  </button>

  <button
    className="delete-btn"
    onClick={() =>
      eliminarPendiente(
        tarea.id
      )
    }
  >
    🗑️ Eliminar
  </button>

</div>

                    </div>

                    <span>

                      {tarea.prioridad === 'Alta' &&
                        '🔥 Alta'}

                      {tarea.prioridad === 'Media' &&
                        '⚡ Media'}

                      {tarea.prioridad === 'Baja' &&
                        '🌱 Baja'}

                    </span>

                  </div>

                ))}

              </>
            )}

            {tareasCompletadas.length > 0 && (
              <>

                <h2 className="completed-title">
                  Completadas
                </h2>

                {tareasCompletadas.map((tarea) => (

                  <div
                    className="task-item done"
                    key={tarea.id}
                  >

                    <div>

                      <p className="task-category">
                        {
                          iconosCategorias[
                            tarea.categoria
                          ]
                        }

                        {' '}

                        {tarea.categoria}
                      </p>

                      <h3>{tarea.titulo}</h3>

                      <p>Finalizada</p>

                      {tarea.notas && (
                        <p className="task-notes">
                          📝 {tarea.notas}
                        </p>
                      )}

                      <div className="task-actions">

                        <button
                          className="delete-btn"
                          onClick={() =>
                            eliminarCompletada(
                              tarea.id
                            )
                          }
                        >
                          🗑️ Eliminar
                        </button>

                      </div>

                    </div>

                    <span>✅ Hecha</span>

                  </div>

                ))}

              </>
            )}

          </div>

        ) : (

          <div className="empty-tasks">

            <h2>
              🎉 No tienes tareas todavía
            </h2>

            <p>
              Pulsa “Nueva tarea” para crear la primera.
            </p>

          </div>

        )}

      </div>

    </section>
  )
}

export default Tareas