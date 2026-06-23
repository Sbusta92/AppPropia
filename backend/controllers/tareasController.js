import pool from '../db.js'

export const getTareas = async (req, res) => {
  try {

    const result = await pool.query(
      'SELECT * FROM tareas ORDER BY id DESC'
    )

    res.json(result.rows)

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al obtener tareas')

  }
}

export const createTarea = async (req, res) => {
  try {

    const {
      titulo,
      fecha,
      prioridad,
      categoria,
      notas,
      clase,
      completada,
    } = req.body

    if (!titulo) {
      return res.status(400).json({
        error: 'El título es obligatorio',
      })
    }

    const result = await pool.query(
      `INSERT INTO tareas (
        titulo,
        fecha,
        prioridad,
        categoria,
        notas,
        clase,
        completada
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        titulo,
        fecha,
        prioridad,
        categoria,
        notas,
        clase,
        completada || false,
      ]
    )

    res.status(201).json(result.rows[0])

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al crear tarea')

  }
}

export const deleteTarea = async (req, res) => {
  try {

    const { id } = req.params

    await pool.query(
      'DELETE FROM tareas WHERE id = $1',
      [id]
    )

    res.json({
      message: 'Tarea eliminada correctamente',
    })

  } catch (error) {

    console.log(error)

    res.status(500).send('Error al eliminar tarea')

  }
}

export const completarTarea = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `UPDATE tareas
SET completada = true,
    fecha_completada = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *`,
      [id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al completar tarea')
  }
}

export const reprogramarTareasVencidas = async (req, res) => {
  try {
    const nuevaFecha = new Date()
nuevaFecha.setDate(nuevaFecha.getDate() + 3)

const fechaNueva = nuevaFecha.toLocaleDateString('sv-SE')

    const result = await pool.query(
  `UPDATE tareas
   SET fecha = $1
   WHERE completada = false
   AND fecha < $2
   AND fecha <> 'Sin fecha'
   RETURNING *`,
  [fechaNueva, new Date().toLocaleDateString('sv-SE')]
)

    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).send('Error al reprogramar tareas')
  }
}