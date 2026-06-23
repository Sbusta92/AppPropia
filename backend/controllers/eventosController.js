import pool from '../db.js'

export const getEventos = async (req, res) => {
  try {

    const result = await pool.query(
      'SELECT * FROM eventos ORDER BY fecha ASC'
    )

    res.json(result.rows)

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al obtener eventos')

  }
}

export const createEvento = async (req, res) => {
  try {

    const {
      titulo,
      fecha,
      hora,
      categoria,
      color,
    } = req.body

    if (!titulo || !fecha || !hora) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios',
      })
    }

    const result = await pool.query(
      `INSERT INTO eventos (
        titulo,
        fecha,
        hora,
        categoria,
        color
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        titulo,
        fecha,
        hora,
        categoria,
        color,
      ]
    )

    res.status(201).json(result.rows[0])

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al crear evento')

  }
}

export const deleteEvento = async (req, res) => {
  try {

    const { id } = req.params

    await pool.query(
      'DELETE FROM eventos WHERE id = $1',
      [id]
    )

    res.json({
      message: 'Evento eliminado correctamente',
    })

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al eliminar evento')

  }
}