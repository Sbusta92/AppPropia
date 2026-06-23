import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM plan_semanal
      ORDER BY fecha ASC, hora_inicio ASC
    `)

    res.json(result.rows)
  } catch (error) {
    console.log(error)

    res.status(500).json({
      error: 'Error al obtener el plan semanal',
    })
  }
})

export default router