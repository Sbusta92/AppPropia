import express from 'express'

import {
  getObjetivos,
  createObjetivo,
  deleteObjetivo,
  completarObjetivo,
  actualizarProgreso,
} from '../controllers/objetivosController.js'

const router = express.Router()

router.get('/', getObjetivos)

router.post('/', createObjetivo)

router.delete('/:id', deleteObjetivo)

router.put('/:id/completar', completarObjetivo)

router.put('/:id/progreso', actualizarProgreso)

export default router