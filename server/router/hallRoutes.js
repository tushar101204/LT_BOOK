const express = require('express');
const router = express.Router();
const hallController = require('../controllers/hallController');
const { auth, isAdmin } = require("../middleware/authenticate");


router.get('/halls', hallController.getHalls);
router.get('/halls/:hallId',auth, hallController.getHallById);
router.post('/halls',auth, isAdmin, hallController.createHall);
router.put('/halls/:hallId',auth, isAdmin, hallController.updateHall);
router.delete('/halls/:hallId',auth, isAdmin, hallController.deleteHall);

module.exports = router;
