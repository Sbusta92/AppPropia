import express from 'express'

import {
  responderIA,
} from '../controllers/iaController.js'

const router = express.Router()

router.post('/', responderIA)

export default router