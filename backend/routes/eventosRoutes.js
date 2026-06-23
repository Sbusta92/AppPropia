import express from 'express'

import {
  getEventos,
  createEvento,
  deleteEvento,
} from '../controllers/eventosController.js'

const router = express.Router()

router.get('/', getEventos)

router.post('/', createEvento)

router.delete('/:id', deleteEvento)

export default router