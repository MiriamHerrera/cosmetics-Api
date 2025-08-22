const express = require('express');
const router = express.Router();
const enhancedSurveyController = require('../controllers/enhancedSurveyController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// Rutas públicas (sin autenticación)
router.get('/active', enhancedSurveyController.getActiveSurveys);
router.get('/active/:id', enhancedSurveyController.getSurveyById);

// Rutas que requieren autenticación
router.post('/options', authenticateToken, enhancedSurveyController.addSurveyOption);
router.post('/vote', authenticateToken, enhancedSurveyController.voteInSurvey);
router.put('/change-vote', authenticateToken, enhancedSurveyController.changeVote);

// Rutas solo para administradores
router.post('/', authenticateToken, requireAdmin, enhancedSurveyController.createSurvey);
router.get('/', authenticateToken, requireAdmin, enhancedSurveyController.getAllSurveys);
router.get('/pending-options', authenticateToken, requireAdmin, enhancedSurveyController.getPendingOptions);
router.put('/options/:option_id/approve', authenticateToken, requireAdmin, enhancedSurveyController.approveSurveyOption);
router.put('/:id/close', authenticateToken, requireAdmin, enhancedSurveyController.closeSurvey);
router.get('/stats', authenticateToken, requireAdmin, enhancedSurveyController.getSurveyStats);

module.exports = router; 