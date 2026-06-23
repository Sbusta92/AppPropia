import pool from '../db.js'

export const getNotas = async (req, res) => {
  try {

    const result = await pool.query(
      'SELECT * FROM notas ORDER BY id DESC'
    )

    res.json(result.rows)

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al obtener notas')

  }
}

export const createNota = async (req, res) => {
  try {

    const {
      titulo,
      categoria,
      contenido,
      color,
    } = req.body

    if (!titulo) {
      return res.status(400).json({
        error: 'El título es obligatorio',
      })
    }

    const result = await pool.query(
      `INSERT INTO notas (
        titulo,
        categoria,
        contenido,
        color
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        titulo,
        categoria,
        contenido,
        color,
      ]
    )

    res.status(201).json(result.rows[0])

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al crear nota')

  }
}

export const deleteNota = async (req, res) => {
  try {

    const { id } = req.params

    await pool.query(
      'DELETE FROM notas WHERE id = $1',
      [id]
    )

    res.json({
      message: 'Nota eliminada correctamente',
    })

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al eliminar nota')

  }
}