const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { validate, surveySchema, voteSchema } = require('../middleware/validation');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// Rutas públicas (con autenticación opcional para ver encuestas)
router.get('/', optionalAuth, surveyController.getActiveSurveys);
router.get('/:id', optionalAuth, surveyController.getSurveyById);

// Rutas que requieren autenticación
router.get('/user/surveys', authenticateToken, surveyController.getUserSurveys);
router.post('/vote', authenticateToken, validate(voteSchema), surveyController.voteInSurvey);
router.put('/change-vote', authenticateToken, validate(voteSchema), surveyController.changeVote);

// Rutas solo para administradores
router.post('/', authenticateToken, requireAdmin, validate(surveySchema), surveyController.createSurvey);
router.put('/:id/close', authenticateToken, requireAdmin, surveyController.closeSurvey);
router.get('/admin/stats', authenticateToken, requireAdmin, surveyController.getSurveyStats);

module.exports = router; 