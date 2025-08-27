const express = require("express");
const router = express.Router();

// const jwt = require("jsonwebtoken")
const { auth, isAdmin, isFaculty, isStudent } = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const authController = require('../controllers/authController');
require("../DB/conn");
// const cookieParser = require("cookie-parser");
router.use(cookieParser());

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/passwordLink', authController.passwordLink);
router.get('/forgotPassword/:id/:token', authController.forgotPassword);
router.post('/:id/:token', authController.setNewPassword);

router.post('/emailVerificationLink', auth, isFaculty,  authController.emailVerificationLink);
router.get('/getuser', auth, isAdmin, authController.getallInstructor);
router.delete('/deleteuser/:userID', auth, isAdmin, authController.deleteFaculty);


router.get('/verifyEmail/:id/:token', authController.verifyEmail);



router.get('/logout/:userId', authController.logout);
router.put('/updateProfile', auth, authController.updateProfile);


router.get('/about', auth, authController.about);
router.get('/getdata', auth, authController.getdata);
router.post('/contact', auth, isStudent, authController.contact);

module.exports = router;
