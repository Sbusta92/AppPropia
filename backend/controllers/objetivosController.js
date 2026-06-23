import pool from '../db.js'

export const getObjetivos = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM objetivos ORDER BY id DESC'
    )

    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al obtener objetivos')
  }
}

export const createObjetivo = async (req, res) => {
  try {
    const { titulo, descripcion, progreso, categoria, completado } = req.body

    if (!titulo) {
      return res.status(400).json({
        error: 'El título es obligatorio',
      })
    }

    const result = await pool.query(
      `INSERT INTO objetivos (
        titulo,
        descripcion,
        progreso,
        categoria,
        completado
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        titulo,
        descripcion,
        progreso || 0,
        categoria,
        completado || false,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al crear objetivo')
  }
}

export const deleteObjetivo = async (req, res) => {
  try {
    const { id } = req.params

    await pool.query(
      'DELETE FROM objetivos WHERE id = $1',
      [id]
    )

    res.json({
      message: 'Objetivo eliminado correctamente',
    })
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al eliminar objetivo')
  }
}

export const completarObjetivo = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `UPDATE objetivos
       SET completado = true,
           progreso = 100
       WHERE id = $1
       RETURNING *`,
      [id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al completar objetivo')
  }
}

export const actualizarProgreso = async (req, res) => {
  try {
    const { id } = req.params
    const { progreso } = req.body

    const result = await pool.query(
      `UPDATE objetivos
       SET progreso = $1
       WHERE id = $2
       RETURNING *`,
      [progreso, id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al actualizar progreso')
  }
}