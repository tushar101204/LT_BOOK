const express = require('express');
const router = express.Router();
const hallController = require('../controllers/hallController');
const { auth } = require("../middleware/authenticate");


router.get('/halls', hallController.getHalls);
router.get('/halls/:hallId',auth, hallController.getHallById);
router.post('/halls',auth, hallController.createHall);
router.put('/halls/:hallId',auth, hallController.updateHall);
router.delete('/halls/:hallId',auth, hallController.deleteHall);

module.exports = router;
