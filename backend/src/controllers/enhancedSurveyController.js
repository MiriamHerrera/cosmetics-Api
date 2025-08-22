const { query, getConnection } = require('../config/database');

// Crear nueva encuesta (admin)
const createSurvey = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { question, description, status = 'draft' } = req.body;

    // Validar que se proporcione la pregunta
    if (!question || question.trim().length < 10) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'La pregunta debe tener al menos 10 caracteres'
      });
    }

    // Crear encuesta
    const surveyResult = await connection.execute(`
      INSERT INTO surveys (question, description, status, created_by) VALUES (?, ?, ?, ?)
    `, [question, description || '', status, req.user.id]);

    const surveyId = surveyResult[0].insertId;

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Encuesta creada exitosamente',
      data: {
        survey_id: surveyId,
        question,
        description,
        status,
        created_by: req.user.id
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creando encuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Obtener todas las encuestas (admin)
const getAllSurveys = async (req, res) => {
  try {
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.description,
        s.status,
        s.created_at,
        s.updated_at,
        u.username as created_by,
        COUNT(DISTINCT so.id) as options_count,
        COUNT(DISTINCT sv.id) as total_votes
      FROM surveys s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN survey_options so ON s.id = so.survey_id
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      GROUP BY s.id, s.question, s.description, s.status, s.created_at, s.updated_at, u.username
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      data: surveys
    });

  } catch (error) {
    console.error('Error obteniendo encuestas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener encuestas activas (públicas) - SIN user_votes
const getActiveSurveysPublic = async (req, res) => {
  try {
    console.log('🔍 getActiveSurveysPublic - Usuario NO logueado');
    
    // Primero obtener las encuestas activas
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.description,
        s.created_at,
        COUNT(DISTINCT so.id) as options_count,
        COUNT(DISTINCT sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.status = 'active'
      GROUP BY s.id, s.question, s.description, s.created_at
      ORDER BY s.created_at DESC
    `);

    console.log('📊 Encuestas activas encontradas (públicas):', surveys.length);

    // Para cada encuesta, obtener sus opciones (solo aprobadas)
    const surveysWithOptions = await Promise.all(
      surveys.map(async (survey) => {
        console.log(`🔄 Procesando encuesta ID: ${survey.id} (pública)`);
        
        // Solo opciones aprobadas para usuarios no logueados
        const approvedOptions = await query(`
          SELECT 
            so.id,
            so.option_text,
            so.description,
            so.created_by,
            so.created_at,
            'approved' as status,
            COUNT(sv.id) as votes
          FROM survey_options so
          LEFT JOIN survey_votes sv ON so.id = sv.option_id
          WHERE so.survey_id = ? AND so.is_approved = 1
          GROUP BY so.id, so.option_text, so.description, so.created_by, so.created_at
          ORDER BY votes DESC, so.created_at ASC
        `, [survey.id]);

        console.log(`✅ Opciones aprobadas para encuesta ${survey.id}:`, approvedOptions.length);

        return {
          ...survey,
          options: approvedOptions,
          user_votes: [] // Usuarios no logueados no tienen votos
        };
      })
    );

    console.log('🎯 Total de encuestas procesadas (públicas):', surveysWithOptions.length);

    res.json({
      success: true,
      data: surveysWithOptions
    });

  } catch (error) {
    console.error('❌ Error obteniendo encuestas activas públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener encuestas activas (con user_votes) - PARA usuarios logueados
const getActiveSurveys = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    console.log('🔍 getActiveSurveys - Usuario ID:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    // Primero obtener las encuestas activas
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.description,
        s.created_at,
        COUNT(DISTINCT so.id) as options_count,
        COUNT(DISTINCT sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.status = 'active'
      GROUP BY s.id, s.question, s.description, s.created_at
      ORDER BY s.created_at DESC
    `);

    console.log('📊 Encuestas activas encontradas:', surveys.length);

    // Para cada encuesta, obtener sus opciones (aprobadas y pendientes)
    const surveysWithOptions = await Promise.all(
      surveys.map(async (survey) => {
        console.log(`🔄 Procesando encuesta ID: ${survey.id}`);
        
        // Opciones aprobadas
        const approvedOptions = await query(`
          SELECT 
            so.id,
            so.option_text,
            so.description,
            so.created_by,
            so.created_at,
            'approved' as status,
            COUNT(sv.id) as votes
          FROM survey_options so
          LEFT JOIN survey_votes sv ON so.id = sv.option_id
          WHERE so.survey_id = ? AND so.is_approved = 1
          GROUP BY so.id, so.option_text, so.description, so.created_by, so.created_at
          ORDER BY votes DESC, so.created_at ASC
        `, [survey.id]);

        console.log(`✅ Opciones aprobadas para encuesta ${survey.id}:`, approvedOptions.length);

        // Opciones pendientes (solo las del usuario actual)
        let pendingOptions = [];
        pendingOptions = await query(`
          SELECT 
            so.id,
            so.option_text,
            so.description,
            so.created_by,
            so.created_at,
            'pending' as status,
            0 as votes
          FROM survey_options so
          WHERE so.survey_id = ? AND so.is_approved = 0 AND so.created_by = ?
          ORDER BY so.created_at ASC
        `, [survey.id, userId]);
        
        console.log(`⏳ Opciones pendientes para encuesta ${survey.id}:`, pendingOptions.length);

        // Obtener votos del usuario actual para esta encuesta
        console.log(`🗳️ Buscando votos del usuario ${userId} para encuesta ${survey.id}`);
        
        const userVotesResult = await query(`
          SELECT sv.option_id
          FROM survey_votes sv
          WHERE sv.survey_id = ? AND sv.user_id = ?
        `, [survey.id, userId]);
        
        const userVotes = userVotesResult.map(vote => vote.option_id);
        console.log(`✅ Votos del usuario ${userId} para encuesta ${survey.id}:`, userVotes);

        // Combinar opciones aprobadas y pendientes
        const allOptions = [...approvedOptions, ...pendingOptions];

        const surveyWithData = {
          ...survey,
          options: allOptions,
          user_votes: userVotes
        };

        console.log(`📋 Encuesta ${survey.id} procesada:`, {
          options_count: allOptions.length,
          user_votes_count: userVotes.length,
          user_votes: userVotes
        });

        return surveyWithData;
      })
    );

    console.log('🎯 Total de encuestas procesadas:', surveysWithOptions.length);
    console.log('📊 Resumen de user_votes por encuesta:');
    surveysWithOptions.forEach(survey => {
      console.log(`  - Encuesta ${survey.id}: ${survey.user_votes?.length || 0} votos del usuario`);
    });

    res.json({
      success: true,
      data: surveysWithOptions
    });

  } catch (error) {
    console.error('❌ Error obteniendo encuestas activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener encuesta específica con opciones aprobadas
const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    // Obtener encuesta
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.description,
        s.status,
        s.created_at,
        COUNT(DISTINCT sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.id = ? AND s.status = 'active'
      GROUP BY s.id, s.question, s.description, s.status, s.created_at
    `, [id]);

    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada o no está activa'
      });
    }

    const survey = surveys[0];

    // Obtener opciones aprobadas
    const options = await query(`
      SELECT 
        so.id,
        so.option_text,
        so.description,
        so.created_by,
        so.is_approved,
        so.created_at,
        COUNT(sv.id) as votes,
        u.username as suggested_by
      FROM survey_options so
      LEFT JOIN survey_votes sv ON so.id = sv.option_id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.survey_id = ? AND so.is_approved = 1
      GROUP BY so.id, so.option_text, so.description, so.created_by, so.is_approved, so.created_at, u.username
      ORDER BY votes DESC, so.created_at ASC
    `, [id]);

    // Verificar si el usuario ya votó
    let userVote = null;
    if (userId) {
      const userVotes = await query(`
        SELECT option_id FROM survey_votes 
        WHERE survey_id = ? AND user_id = ?
      `, [id, userId]);
      
      if (userVotes.length > 0) {
        userVote = userVotes[0].option_id;
      }
    }

    res.json({
      success: true,
      data: {
        ...survey,
        options,
        user_vote: userVote
      }
    });

  } catch (error) {
    console.error('Error obteniendo encuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Agregar opción a encuesta (usuarios)
const addSurveyOption = async (req, res) => {
  try {
    const { survey_id, option_text, description } = req.body;
    const userId = req.user.id;

    // Verificar que la encuesta esté activa
    const surveys = await query(`
      SELECT id, status FROM surveys WHERE id = ?
    `, [survey_id]);

    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada'
      });
    }

    if (surveys[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'La encuesta no está activa'
      });
    }

    // Verificar que el usuario no haya sugerido esta opción antes
    const existingOptions = await query(`
      SELECT id FROM survey_options 
      WHERE survey_id = ? AND created_by = ? AND option_text = ?
    `, [survey_id, userId, option_text]);

    if (existingOptions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya has sugerido esta opción'
      });
    }

    // Agregar opción (pendiente de aprobación)
    const result = await query(`
      INSERT INTO survey_options (survey_id, option_text, description, created_by, is_approved) 
      VALUES (?, ?, ?, ?, 0)
    `, [survey_id, option_text, description || '', userId]);

    res.status(201).json({
      success: true,
      message: 'Opción agregada y pendiente de aprobación',
      data: {
        option_id: result.insertId,
        option_text,
        description,
        is_approved: 0
      }
    });

  } catch (error) {
    console.error('Error agregando opción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Aprobar/rechazar opción de encuesta (admin)
const approveSurveyOption = async (req, res) => {
  try {
    const { option_id } = req.params;
    const { is_approved, admin_notes } = req.body;

    // Verificar que la opción existe
    const options = await query(`
      SELECT id, option_text, survey_id FROM survey_options WHERE id = ?
    `, [option_id]);

    if (options.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opción no encontrada'
      });
    }

    // Actualizar estado de aprobación
    await query(`
      UPDATE survey_options 
      SET is_approved = ?, admin_notes = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [is_approved ? 1 : 0, admin_notes || '', req.user.id, option_id]);

    res.json({
      success: true,
      message: `Opción ${is_approved ? 'aprobada' : 'rechazada'} exitosamente`,
      data: {
        option_id,
        is_approved: is_approved ? 1 : 0,
        admin_notes
      }
    });

  } catch (error) {
    console.error('Error aprobando opción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Aprobar encuesta (cambiar de draft a active)
const approveSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    // Verificar que la encuesta existe y está en estado draft
    const surveys = await query(`
      SELECT id, question, status FROM surveys WHERE id = ?
    `, [id]);

    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada'
      });
    }

    if (surveys[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden aprobar encuestas en estado borrador'
      });
    }

    // Cambiar estado a active
    await query(`
      UPDATE surveys 
      SET status = 'active', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Encuesta aprobada y activada exitosamente',
      data: {
        survey_id: id,
        status: 'active',
        admin_notes
      }
    });

  } catch (error) {
    console.error('Error aprobando encuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener opciones pendientes de aprobación (admin)
const getPendingOptions = async (req, res) => {
  try {
    const options = await query(`
      SELECT 
        so.id,
        so.option_text,
        so.description,
        so.created_at,
        so.admin_notes,
        s.question as survey_question,
        s.id as survey_id,
        u.username as suggested_by
      FROM survey_options so
      INNER JOIN surveys s ON so.survey_id = s.id
      INNER JOIN users u ON so.created_by = u.id
      WHERE so.is_approved = 0
      ORDER BY so.created_at ASC
    `);

    res.json({
      success: true,
      data: options
    });

  } catch (error) {
    console.error('Error obteniendo opciones pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Votar en encuesta
const voteInSurvey = async (req, res) => {
  try {
    const { survey_id, option_id } = req.body;
    const userId = req.user.id;

    // Verificar que la encuesta esté activa
    const surveys = await query(`
      SELECT id, status FROM surveys WHERE id = ?
    `, [survey_id]);

    if (surveys.length === 0 || surveys[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'La encuesta no está activa'
      });
    }

    // Verificar que la opción esté aprobada
    const options = await query(`
      SELECT id, is_approved FROM survey_options WHERE id = ? AND survey_id = ?
    `, [option_id, survey_id]);

    if (options.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Opción no encontrada'
      });
    }

    if (options[0].is_approved !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede votar por opciones aprobadas'
      });
    }

    // Verificar si el usuario ya votó por esta opción
    const existingVote = await query(`
      SELECT id FROM survey_votes WHERE user_id = ? AND option_id = ?
    `, [userId, option_id]);

    if (existingVote.length > 0) {
      // Si ya votó, eliminar el voto (desvotar)
      await query(`
        DELETE FROM survey_votes WHERE user_id = ? AND option_id = ?
      `, [userId, option_id]);

      res.json({
        success: true,
        message: 'Voto eliminado exitosamente',
        data: {
          action: 'unvoted',
          option_id,
          survey_id
        }
      });
    } else {
      // Si no ha votado, agregar el voto
      await query(`
        INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES (?, ?, ?)
      `, [survey_id, option_id, userId]);

      res.json({
        success: true,
        message: 'Voto registrado exitosamente',
        data: {
          action: 'voted',
          option_id,
          survey_id
        }
      });
    }

  } catch (error) {
    console.error('Error registrando voto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar voto
const changeVote = async (req, res) => {
  try {
    const { survey_id, new_option_id } = req.body;
    const userId = req.user.id;

    // Verificar que la nueva opción esté aprobada
    const options = await query(`
      SELECT id, is_approved FROM survey_options WHERE id = ? AND survey_id = ?
    `, [new_option_id, survey_id]);

    if (options.length === 0 || options[0].is_approved !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Opción no válida'
      });
    }

    // Actualizar voto
    await query(`
      UPDATE survey_votes 
      SET option_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE survey_id = ? AND user_id = ?
    `, [new_option_id, survey_id, userId]);

    res.json({
      success: true,
      message: 'Voto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando voto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cerrar encuesta (admin)
const closeSurvey = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la encuesta existe
    const surveys = await query(`
      SELECT id, status FROM surveys WHERE id = ?
    `, [id]);

    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada'
      });
    }

    if (surveys[0].status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'La encuesta ya está cerrada'
      });
    }

    // Cerrar encuesta
    await query(`
      UPDATE surveys SET status = 'closed', closed_by = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [req.user.id, id]);

    res.json({
      success: true,
      message: 'Encuesta cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error cerrando encuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de encuestas (admin)
const getSurveyStats = async (req, res) => {
  try {
    // Estadísticas generales
    const generalStats = await query(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_surveys,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_surveys,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_surveys
      FROM surveys
    `);

    // Encuestas más populares
    const popularSurveys = await query(`
      SELECT 
        s.question,
        s.status,
        COUNT(sv.id) as total_votes,
        s.created_at
      FROM surveys s
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      GROUP BY s.id, s.question, s.status, s.created_at
      ORDER BY total_votes DESC
      LIMIT 5
    `);

    // Opciones más votadas
    const topOptions = await query(`
      SELECT 
        so.option_text,
        COUNT(sv.id) as vote_count,
        s.question as survey_question
      FROM survey_options so
      INNER JOIN surveys s ON so.survey_id = s.id
      LEFT JOIN survey_votes sv ON so.id = sv.option_id
      WHERE so.is_approved = 1
      GROUP BY so.id, so.option_text, s.question
      ORDER BY vote_count DESC
      LIMIT 10
    `);

    // Opciones pendientes de aprobación
    const pendingOptions = await query(`
      SELECT COUNT(*) as count FROM survey_options WHERE is_approved = 0
    `);

    res.json({
      success: true,
      data: {
        general_stats: generalStats[0],
        popular_surveys: popularSurveys,
        top_options: topOptions,
        pending_options: pendingOptions[0].count
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener encuesta específica (pública) - SIN user_votes
const getSurveyByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 getSurveyByIdPublic - Encuesta ID:', id, '- Usuario NO logueado');
    
    // Obtener la encuesta
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.description,
        s.created_at,
        COUNT(DISTINCT so.id) as options_count,
        COUNT(DISTINCT sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.id = ? AND s.status = 'active'
      GROUP BY s.id, s.question, s.description, s.created_at
    `, [id]);

    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada o no está activa'
      });
    }

    const survey = surveys[0];
    console.log(`📊 Encuesta encontrada (pública):`, survey.id);

    // Obtener opciones aprobadas
    const approvedOptions = await query(`
      SELECT 
        so.id,
        so.option_text,
        so.description,
        so.created_by,
        so.created_at,
        'approved' as status,
        COUNT(sv.id) as votes
      FROM survey_options so
      LEFT JOIN survey_votes sv ON so.id = sv.option_id
      WHERE so.survey_id = ? AND so.is_approved = 1
      GROUP BY so.id, so.option_text, so.description, so.created_by, so.created_at
      ORDER BY votes DESC, so.created_at ASC
    `, [id]);

    console.log(`✅ Opciones aprobadas para encuesta ${id}:`, approvedOptions.length);

    const surveyWithOptions = {
      ...survey,
      options: approvedOptions,
      user_votes: [] // Usuarios no logueados no tienen votos
    };

    res.json({
      success: true,
      data: surveyWithOptions
    });

  } catch (error) {
    console.error('❌ Error obteniendo encuesta pública:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createSurvey,
  getAllSurveys,
  getActiveSurveysPublic,
  getSurveyByIdPublic,
  getActiveSurveys,
  getSurveyById,
  addSurveyOption,
  approveSurveyOption,
  approveSurvey,
  getPendingOptions,
  voteInSurvey,
  changeVote,
  closeSurvey,
  getSurveyStats
}; 