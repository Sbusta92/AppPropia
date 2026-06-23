import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Notas from './pages/Notas'
import Tareas from './pages/Tareas'
import Objetivos from './pages/Objetivos'
import IA from './pages/IA'
import Agenda from './pages/Agenda'
import PlanSemanal from './pages/PlanSemanal'
import Productividad from './pages/Productividad'
import './App.css'

function App() {
  const [tareasPendientes, setTareasPendientes] = useState([])
  const [tareasCompletadas, setTareasCompletadas] = useState([])
  const [notas, setNotas] = useState([])
  const [objetivosPendientes, setObjetivosPendientes] = useState([])
  const [objetivosCompletados, setObjetivosCompletados] = useState([])
  const [eventos, setEventos] = useState([])

  const [mensajesIA, setMensajesIA] = useState([
    {
      autor: 'ia',
      texto: '👋 Hola, soy tu asistente IA conectado con Ollama.',
    },
  ])

  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  const cargarDatosIniciales = async () => {
    try {
      const [resTareas, resNotas, resObjetivos, resEventos] =
        await Promise.all([
          fetch('http://localhost:3001/tareas'),
          fetch('http://localhost:3001/notas'),
          fetch('http://localhost:3001/objetivos'),
          fetch('http://localhost:3001/eventos'),
        ])

      const tareas = await resTareas.json()
      const notasBD = await resNotas.json()
      const objetivos = await resObjetivos.json()
      const eventosBD = await resEventos.json()

      setTareasPendientes(
        tareas.filter((tarea) => !tarea.completada)
      )

      setTareasCompletadas(
        tareas.filter((tarea) => tarea.completada)
      )

      setNotas(notasBD)

      setObjetivosPendientes(
        objetivos.filter((objetivo) => !objetivo.completado)
      )

      setObjetivosCompletados(
        objetivos.filter((objetivo) => objetivo.completado)
      )

      setEventos(eventosBD)
    } catch (error) {
      console.log('Error cargando datos iniciales:', error)
    }
  }

  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <h2>🧠 IA Dashboard</h2>

          <nav>
            <Link to="/">🏠 Inicio</Link>
            <Link to="/notas">📝 Notas</Link>
            <Link to="/tareas">✅ Tareas</Link>
            <Link to="/objetivos">🎯 Objetivos</Link>
            <Link to="/ia">🤖 IA</Link>
            <Link to="/agenda">📅 Agenda</Link>
            <Link to="/plan-semanal">📆 Plan semanal</Link>
            <Link to="/productividad">📊 Productividad</Link>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  tareasPendientes={tareasPendientes}
                  tareasCompletadas={tareasCompletadas}
                  notas={notas}
                  objetivosPendientes={objetivosPendientes}
                  eventos={eventos}
                />
              }
            />

            <Route
              path="/notas"
              element={
                <Notas
                  notas={notas}
                  setNotas={setNotas}
                />
              }
            />

            <Route
              path="/tareas"
              element={
                <Tareas
                  tareasPendientes={tareasPendientes}
                  setTareasPendientes={setTareasPendientes}
                  tareasCompletadas={tareasCompletadas}
                  setTareasCompletadas={setTareasCompletadas}
                />
              }
            />

            <Route
              path="/objetivos"
              element={
                <Objetivos
                  objetivosPendientes={objetivosPendientes}
                  setObjetivosPendientes={setObjetivosPendientes}
                  objetivosCompletados={objetivosCompletados}
                  setObjetivosCompletados={setObjetivosCompletados}
                />
              }
            />

            <Route
              path="/agenda"
              element={
                <Agenda
                  eventos={eventos}
                  setEventos={setEventos}
                />
              }
            />

            <Route
  path="/plan-semanal"
  element={<PlanSemanal />}
/>

<Route
  path="/productividad"
  element={
    <Productividad
      tareas={tareasPendientes}
      completadas={tareasCompletadas}
      objetivosPendientes={objetivosPendientes}
      objetivosCompletados={objetivosCompletados}
      eventos={eventos}
    />
  }
/>

            

            <Route
              path="/ia"
              element={
                <IA
  mensajes={mensajesIA}
  setMensajes={setMensajesIA}
  setNotas={setNotas}
  setTareasPendientes={setTareasPendientes}
  setObjetivosPendientes={setObjetivosPendientes}
  setEventos={setEventos}

  
/>

            





              }

              
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App