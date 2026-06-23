import express from 'express'

import {
  getTareas,
  createTarea,
  deleteTarea,
  completarTarea,
  reprogramarTareasVencidas,
} from '../controllers/tareasController.js'

const router = express.Router()

router.get('/', getTareas)

router.post('/', createTarea)



router.delete('/:id', deleteTarea)

router.put('/:id/completar', completarTarea)

router.post(
  '/reprogramar-vencidas',
  reprogramarTareasVencidas
)



export default router