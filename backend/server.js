import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import notasRoutes from './routes/notasRoutes.js'
import tareasRoutes from './routes/tareasRoutes.js'
import objetivosRoutes from './routes/objetivosRoutes.js'
import eventosRoutes from './routes/eventosRoutes.js'
import iaRoutes from './routes/iaRoutes.js'
import planSemanalRoutes from './routes/planSemanalRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use('/tareas', tareasRoutes)
app.use('/objetivos', objetivosRoutes)
app.use('/eventos', eventosRoutes)
app.use('/ia', iaRoutes)
app.use('/plan-semanal', planSemanalRoutes)
app.get('/', (req, res) => {
  res.send('Backend funcionando 🚀')
})

app.use('/notas', notasRoutes)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})