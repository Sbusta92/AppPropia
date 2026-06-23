import { useState } from 'react'

function IA({
  mensajes,
  setMensajes,
  setNotas,
  setTareasPendientes,
  setObjetivosPendientes,
  setEventos,
}) {
  const [mensaje, setMensaje] = useState('')

  const actualizarEstadoPorAccion = (datos) => {
    if (!datos.data) return

    if (datos.accion === 'crear_nota') {
      setNotas((prev) => [
        datos.data,
        ...prev,
      ])
    }

    if (datos.accion === 'crear_tarea') {
      setTareasPendientes((prev) => [
        datos.data,
        ...prev,
      ])
    }

    if (datos.accion === 'crear_objetivo') {
      setObjetivosPendientes((prev) => [
        datos.data,
        ...prev,
      ])
    }

    if (datos.accion === 'crear_evento') {
      setEventos((prev) => [
        datos.data,
        ...prev,
      ])
    }

    if (datos.accion === 'borrar_nota') {
      setNotas((prev) =>
        prev.filter((nota) => nota.id !== datos.data.id)
      )
    }

    if (datos.accion === 'borrar_tarea') {
      setTareasPendientes((prev) =>
        prev.filter((tarea) => tarea.id !== datos.data.id)
      )
    }

    if (datos.accion === 'borrar_objetivo') {
      setObjetivosPendientes((prev) =>
        prev.filter((objetivo) => objetivo.id !== datos.data.id)
      )
    }

    if (datos.accion === 'borrar_evento') {
      setEventos((prev) =>
        prev.filter((evento) => evento.id !== datos.data.id)
      )
    }
  }

  const enviarMensaje = async () => {
    if (mensaje.trim() === '') return

    const mensajeUsuario = {
      autor: 'usuario',
      texto: mensaje,
    }

    setMensajes((prev) => [
      ...prev,
      mensajeUsuario,
    ])

    const mensajeActual = mensaje

    setMensaje('')

    try {
      const respuesta = await fetch(
        'http://localhost:3001/ia',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            mensaje: mensajeActual,
          }),
        }
      )

      const datos = await respuesta.json()

      actualizarEstadoPorAccion(datos)

      const mensajeIA = {
        autor: 'ia',
        texto: datos.respuesta,
      }

      setMensajes((prev) => [
        ...prev,
        mensajeIA,
      ])

    } catch (error) {

      console.log(error)

      setMensajes((prev) => [
        ...prev,
        {
          autor: 'ia',
          texto: '❌ Error conectando con la IA',
        },
      ])
    }
  }

  return (
    <section className="ia-page">
      <div className="ia-header">
        <small>🤖 Asistente inteligente</small>

        <h1>Centro IA</h1>

        <p>
          Tu asistente conectado con IA real usando Ollama.
        </p>
      </div>

      <div className="smart-chat">
        {mensajes.map((msg, index) => (
          <div
            key={index}
            className={
              msg.autor === 'usuario'
                ? 'smart-message user'
                : 'smart-message assistant'
            }
          >
            <p style={{ whiteSpace: 'pre-line' }}>
  {msg.texto}
</p>
          </div>
        ))}
      </div>

      <div className="smart-input">
        <input
          type="text"
          placeholder="Pregúntame algo..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              enviarMensaje()
            }
          }}
        />

        <button onClick={enviarMensaje}>
          Enviar
        </button>
      </div>
    </section>
  )
}

export default IA