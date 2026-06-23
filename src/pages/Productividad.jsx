import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'

function Productividad({
  objetivosPendientes,
  objetivosCompletados,
  eventos,
}) {
  const [tareas, setTareas] = useState([])

  useEffect(() => {
    cargarTareas()
  }, [])

  const cargarTareas = async () => {
    try {
      const res = await fetch('http://localhost:3001/tareas')
      const data = await res.json()
      setTareas(data)
    } catch (error) {
      console.log(error)
    }
  }

  const completadas = tareas.filter((t) => t.completada)
  const pendientes = tareas.filter((t) => !t.completada)

  const porcentaje =
    tareas.length > 0
      ? Math.round((completadas.length / tareas.length) * 100)
      : 0

  let racha = 0

  for (let i = 0; i < 365; i++) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - i)

    const fechaTexto = fecha.toLocaleDateString('sv-SE')

    const hizoAlgo = completadas.some(
      (t) =>
        t.fecha_completada &&
        t.fecha_completada.slice(0, 10) === fechaTexto
    )

    if (hizoAlgo) {
      racha++
    } else {
      break
    }
  }

  const prioridadesData = [
    {
      name: 'Alta',
      value: pendientes.filter((t) => t.prioridad === 'Alta').length,
    },
    {
      name: 'Media',
      value: pendientes.filter((t) => t.prioridad === 'Media').length,
    },
    {
      name: 'Baja',
      value: pendientes.filter((t) => t.prioridad === 'Baja').length,
    },
  ]

  const estadoData = [
    { name: 'Completadas', value: completadas.length },
    { name: 'Pendientes', value: pendientes.length },
  ]

  const categoriasCompletadas = completadas.reduce((acc, tarea) => {
  const categoria = tarea.categoria || 'Sin categoría'

  acc[categoria] = (acc[categoria] || 0) + 1

  return acc
}, {})

const categoriasCompletadasData = Object.entries(
  categoriasCompletadas
).map(([name, value]) => ({
  name,
  value,
}))

  const completadasPorDia = completadas.reduce((acc, tarea) => {
    if (!tarea.fecha_completada) return acc

    const fecha = tarea.fecha_completada.slice(0, 10)
    acc[fecha] = (acc[fecha] || 0) + 1

    return acc
  }, {})

  const completadasData = Object.entries(completadasPorDia)
    .map(([fecha, cantidad]) => ({
      fecha,
      cantidad,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const ultimos7Dias = []

  for (let i = 6; i >= 0; i--) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - i)

    const fechaTexto = fecha.toLocaleDateString('sv-SE')

    const cantidad = completadas.filter(
      (t) =>
        t.fecha_completada &&
        t.fecha_completada.slice(0, 10) === fechaTexto
    ).length

    ultimos7Dias.push({
      dia: fecha.toLocaleDateString('es-ES', {
        weekday: 'short',
      }),
      fecha: fechaTexto,
      cantidad,
    })
  }

  const tareasConTiempo = completadas.filter(
    (t) => t.fecha_creacion && t.fecha_completada
  )

  const tiempoMedioHoras =
    tareasConTiempo.length > 0
      ? (
          tareasConTiempo.reduce((total, tarea) => {
            const inicio = new Date(tarea.fecha_creacion)
            const fin = new Date(tarea.fecha_completada)

            return total + (fin - inicio) / (1000 * 60 * 60)
          }, 0) / tareasConTiempo.length
        ).toFixed(1)
      : 0

    const completadasPorMes = {}

    completadas.forEach((tarea) => {
        if (!tarea.fecha_completada) return

        const fecha = new Date(tarea.fecha_completada)

        const mes = fecha.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
        })

        completadasPorMes[mes] = (completadasPorMes[mes] || 0) + 1
    })

    const completadasMesData = Object.entries(completadasPorMes).map(
        ([mes, cantidad]) => ({
        mes,
        cantidad,
        })
    )

    const creadasPorMes = {}

tareas.forEach((tarea) => {
  if (!tarea.fecha_creacion) return

  const fecha = new Date(tarea.fecha_creacion)

  const mes = fecha.toLocaleDateString('es-ES', {
    month: 'short',
    year: 'numeric',
  })

  creadasPorMes[mes] = (creadasPorMes[mes] || 0) + 1
})

const comparativaMeses = {}

Object.entries(creadasPorMes).forEach(([mes, cantidad]) => {
  comparativaMeses[mes] = {
    mes,
    creadas: cantidad,
    completadas: 0,
  }
})

Object.entries(completadasPorMes).forEach(([mes, cantidad]) => {
  if (!comparativaMeses[mes]) {
    comparativaMeses[mes] = {
      mes,
      creadas: 0,
      completadas: cantidad,
    }
  } else {
    comparativaMeses[mes].completadas = cantidad
  }
})

const comparativaMesesData =
  Object.values(comparativaMeses)

  const diasSemana = {
  lunes: 0,
  martes: 0,
  miércoles: 0,
  jueves: 0,
  viernes: 0,
  sábado: 0,
  domingo: 0,
}

const hoySemana = new Date()
const primerDiaSemana = new Date(hoySemana)

const diaActual = hoySemana.getDay()
const diferenciaLunes = diaActual === 0 ? -6 : 1 - diaActual

primerDiaSemana.setDate(hoySemana.getDate() + diferenciaLunes)
primerDiaSemana.setHours(0, 0, 0, 0)

const ultimoDiaSemana = new Date(primerDiaSemana)
ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6)
ultimoDiaSemana.setHours(23, 59, 59, 999)

completadas.forEach((tarea) => {
  if (!tarea.fecha_completada) return

  const fechaCompletada = new Date(tarea.fecha_completada)

  if (
    fechaCompletada < primerDiaSemana ||
    fechaCompletada > ultimoDiaSemana
  ) {
    return
  }

  const dia = fechaCompletada.toLocaleDateString('es-ES', {
    weekday: 'long',
  })

  diasSemana[dia] = (diasSemana[dia] || 0) + 1
})

  const diasSemanaData = Object.entries(diasSemana).map(
    ([dia, cantidad]) => ({
      dia,
      cantidad,
    })
  )

  const mejorDia =
    diasSemanaData.length > 0
      ? diasSemanaData.reduce((max, actual) =>
          actual.cantidad > max.cantidad ? actual : max
        )
      : { dia: 'Sin datos', cantidad: 0 }

      const recordDiario =
  completadasData.length > 0
    ? completadasData.reduce((max, actual) =>
        actual.cantidad > max.cantidad ? actual : max
      )
    : {
        fecha: 'Sin datos',
        cantidad: 0,
      }

  const calendarioActividad = []

  for (let i = 29; i >= 0; i--) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - i)

    const fechaTexto = fecha.toLocaleDateString('sv-SE')

    const cantidad = completadas.filter(
      (t) =>
        t.fecha_completada &&
        t.fecha_completada.slice(0, 10) === fechaTexto
    ).length

    calendarioActividad.push({
      fecha: fechaTexto,
      cantidad,
    })
  }

  const getActivityClass = (cantidad) => {
    if (cantidad === 0) return 'activity-empty'
    if (cantidad === 1) return 'activity-low'
    if (cantidad === 2) return 'activity-medium'
    return 'activity-high'
  }

  const totalObjetivos =
  objetivosPendientes.length +
  objetivosCompletados.length

const porcentajeObjetivos =
  totalObjetivos > 0
    ? Math.round(
        (objetivosCompletados.length /
          totalObjetivos) *
          100
      )
    : 0

const eventosProximos = eventos.filter(
  (evento) =>
    evento.fecha >=
    new Date().toLocaleDateString('sv-SE')
)

  

  return (
    <div className="productividad-container">
      <h1>📊 Productividad</h1>
      <p>Analiza tu rendimiento, tareas completadas y prioridades.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{tareas.length}</h3>
          <p>Tareas totales</p>
        </div>

        

        <div className="stat-card">
          <h3>{completadas.length}</h3>
          <p>Tareas completadas</p>
        </div>

        <div className="stat-card">
          <h3>{pendientes.length}</h3>
          <p>Tareas pendientes</p>
        </div>

        <div className="stat-card">
          <h3>{porcentaje}%</h3>
          <p>Productividad</p>
        </div>

        <div className="stat-card">
          <h3>{tiempoMedioHoras}</h3>
          <p>Horas medias por tarea</p>
        </div>

        <div className="stat-card">
          <h3>{racha}</h3>
          <p>Días seguidos activo</p>
        </div>

        
      </div>

      <section className="activity-card">
        <h3>🟩 Actividad últimos 30 días</h3>

        <div className="activity-grid">
          {calendarioActividad.map((dia) => (
            <div
              key={dia.fecha}
              className={`activity-box ${getActivityClass(
                dia.cantidad
              )}`}
              title={`${dia.fecha}: ${dia.cantidad} tareas completadas`}
            />
          ))}
        </div>

        <div className="activity-legend">
          <span>Menos</span>
          <div className="activity-box activity-empty" />
          <div className="activity-box activity-low" />
          <div className="activity-box activity-medium" />
          <div className="activity-box activity-high" />
          <span>Más</span>
        </div>
      </section>

      <section className="charts-grid">
        <div className="chart-card">
          <h3>📈 Evolución de tareas completadas</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completadasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="cantidad"
                stroke="#6366f1"
                strokeWidth={4}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>🔥 Productividad últimos 7 días</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ultimos7Dias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="cantidad"
                stroke="#22c55e"
                strokeWidth={4}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
  <h3>🏆 Récord diario</h3>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        fontSize: '70px',
      }}
    >
      🏆
    </div>

    <h2
      style={{
        fontSize: '42px',
        margin: '10px 0',
      }}
    >
      {recordDiario.cantidad}
    </h2>

    <p>Tareas completadas en un día</p>

    <h3
      style={{
        color: '#818cf8',
      }}
    >
      {recordDiario.fecha}
    </h3>
  </div>
</div>
        

        <div className="chart-card">
          <h3>📆 Productividad por día de la semana</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diasSemanaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>


        <div className="chart-card">
  <h3>📂 Completadas por categoría</h3>

  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={categoriasCompletadasData}
        dataKey="value"
        nameKey="name"
        outerRadius={100}
        label
      >
        {categoriasCompletadasData.map((entry, index) => (
          <Cell
            key={`categoria-${index}`}
            fill={[
              '#6366f1',
              '#22c55e',
              '#f59e0b',
              '#ef4444',
              '#06b6d4',
              '#a855f7',
            ][index % 6]}
          />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
</div>

<div className="chart-card">
  <h3>📈 Creadas vs completadas</h3>

  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={comparativaMesesData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="mes" />
      <YAxis allowDecimals={false} />
      <Tooltip />

      <Bar
        dataKey="creadas"
        fill="#f59e0b"
        name="Creadas"
      />

      <Bar
        dataKey="completadas"
        fill="#22c55e"
        name="Completadas"
      />
    </BarChart>
  </ResponsiveContainer>
</div>

        <div className="chart-card">
          <h3>✅ Pendientes vs completadas</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={estadoData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>🔥 Tareas pendientes por prioridad</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={prioridadesData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
                <Cell fill="#22c55e" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

export default Productividad