import express from 'express'

import {
  getNotas,
  createNota,
  deleteNota,
} from '../controllers/notasController.js'

const router = express.Router()

router.get('/', getNotas)

router.post('/', createNota)

router.delete('/:id', deleteNota)

export default router