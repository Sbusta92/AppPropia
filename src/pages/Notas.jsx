import { useEffect, useState } from 'react'

function Notas({ notas, setNotas }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('Ideas')
  const [contenido, setContenido] = useState('')

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
    cargarNotas()
  }, [])

  const cargarNotas = async () => {
    try {
      const respuesta = await fetch('http://localhost:3001/notas')

      const datos = await respuesta.json()

      setNotas(datos)
    } catch (error) {
      console.log('Error cargando notas:', error)
    }
  }

  const guardarNota = async () => {
    if (titulo.trim() === '') return

    const nuevaNota = {
      titulo,
      categoria,
      contenido,
      color: coloresCategorias[categoria] || 'purple',
    }

    try {
      const respuesta = await fetch('http://localhost:3001/notas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevaNota),
      })

      const notaGuardada = await respuesta.json()

      setNotas([
        notaGuardada,
        ...notas,
      ])

      setTitulo('')
      setCategoria('Ideas')
      setContenido('')
      setMostrarFormulario(false)
    } catch (error) {
      console.log('Error guardando nota:', error)
    }
  }

  const eliminarNota = async (idEliminar) => {
    try {
      await fetch(`http://localhost:3001/notas/${idEliminar}`, {
        method: 'DELETE',
      })

      const nuevasNotas = notas.filter(
        (nota) => nota.id !== idEliminar
      )

      setNotas(nuevasNotas)
    } catch (error) {
      console.log('Error eliminando nota:', error)
    }
  }

  return (
    <section className="notes-page">
      <div className="notes-header">
        <div>
          <small>📝 Organización rápida</small>

          <h1>Mis notas</h1>

          <p>Guarda ideas, recordatorios y apuntes rápidos.</p>
        </div>

        <button
          className="add-note-btn"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          + Nueva nota
        </button>
      </div>

      {mostrarFormulario && (
        <div className="note-form">
          <h2>Nueva nota</h2>

          <input
            type="text"
            placeholder="Título"
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

          <textarea
            placeholder="Contenido de la nota..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />

          <button
            className="primary-btn"
            onClick={guardarNota}
          >
            Guardar nota
          </button>
        </div>
      )}

      {notas.length > 0 ? (
        <div className="notes-grid">
          {notas.map((nota) => (
            <div
              className={`note-card ${nota.color}`}
              key={nota.id}
            >
              <button
                className="delete-note"
                onClick={() => eliminarNota(nota.id)}
              >
                🗑
              </button>

              <span>
                {iconosCategorias[nota.categoria]} {nota.categoria}
              </span>

              <h3>{nota.titulo}</h3>

              <p>{nota.contenido}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-tasks">
          <h2>📝 No tienes notas todavía</h2>

          <p>Pulsa “Nueva nota” para empezar.</p>
        </div>
      )}
    </section>
  )
}

export default Notas