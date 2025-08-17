const { query, getConnection } = require('../config/database');

// Crear nueva encuesta (admin)
const createSurvey = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { question, options } = req.body;

    // Validar que se proporcionen opciones
    if (!options || options.length < 2 || options.length > 10) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'La encuesta debe tener entre 2 y 10 opciones'
      });
    }

    // Crear encuesta
    const surveyResult = await connection.execute(`
      INSERT INTO surveys (question, status) VALUES (?, 'open')
    `, [question]);

    const surveyId = surveyResult[0].insertId;

    // Crear opciones de la encuesta
    for (const optionText of options) {
      await connection.execute(`
        INSERT INTO survey_options (survey_id, option_text) VALUES (?, ?)
      `, [surveyId, optionText]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Encuesta creada exitosamente',
      data: {
        survey_id: surveyId,
        question,
        options_count: options.length,
        status: 'open'
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

// Obtener todas las encuestas activas
const getActiveSurveys = async (req, res) => {
  try {
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.status,
        s.created_at,
        COUNT(so.id) as options_count,
        COUNT(sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.status = 'open'
      GROUP BY s.id, s.question, s.status, s.created_at
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

// Obtener encuesta específica con opciones
const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    // Obtener encuesta
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.status,
        s.created_at,
        COUNT(sv.id) as total_votes
      FROM surveys s
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      WHERE s.id = ?
      GROUP BY s.id, s.question, s.status, s.created_at
    `, [id]);

    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada'
      });
    }

    const survey = surveys[0];

    // Obtener opciones con conteo de votos
    const options = await query(`
      SELECT 
        so.id,
        so.option_text,
        so.product_id,
        COUNT(sv.id) as vote_count,
        CASE WHEN sv2.id IS NOT NULL THEN true ELSE false END as user_voted
      FROM survey_options so
      LEFT JOIN survey_votes sv ON so.id = sv.option_id
      LEFT JOIN survey_votes sv2 ON so.id = sv2.option_id AND sv2.user_id = ?
      WHERE so.survey_id = ?
      GROUP BY so.id, so.option_text, so.product_id
      ORDER BY so.id
    `, [userId, id]);

    // Calcular porcentajes
    const totalVotes = survey.total_votes || 0;
    const optionsWithPercentages = options.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? ((option.vote_count / totalVotes) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        ...survey,
        options: optionsWithPercentages
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

// Votar en una encuesta
const voteInSurvey = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { survey_id, option_id } = req.body;

    // Verificar que la encuesta existe y está activa
    const surveys = await connection.execute(`
      SELECT id, status FROM surveys WHERE id = ?
    `, [survey_id]);

    if (surveys[0].length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada'
      });
    }

    if (surveys[0][0].status !== 'open') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'La encuesta no está activa'
      });
    }

    // Verificar que la opción existe y pertenece a la encuesta
    const options = await connection.execute(`
      SELECT id FROM survey_options WHERE id = ? AND survey_id = ?
    `, [option_id, survey_id]);

    if (options[0].length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Opción de encuesta no válida'
      });
    }

    // Verificar que el usuario no haya votado antes en esta encuesta
    const existingVotes = await connection.execute(`
      SELECT id FROM survey_votes WHERE survey_id = ? AND user_id = ?
    `, [survey_id, userId]);

    if (existingVotes[0].length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ya has votado en esta encuesta'
      });
    }

    // Registrar el voto
    await connection.execute(`
      INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES (?, ?, ?)
    `, [survey_id, option_id, userId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Voto registrado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error registrando voto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Cambiar voto en una encuesta
const changeVote = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { survey_id, new_option_id } = req.body;

    // Verificar que la encuesta existe y está activa
    const surveys = await connection.execute(`
      SELECT id, status FROM surveys WHERE id = ?
    `, [survey_id]);

    if (surveys[0].length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada'
      });
    }

    if (surveys[0][0].status !== 'open') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'La encuesta no está activa'
      });
    }

    // Verificar que la nueva opción existe
    const options = await connection.execute(`
      SELECT id FROM survey_options WHERE id = ? AND survey_id = ?
    `, [new_option_id, survey_id]);

    if (options[0].length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Opción de encuesta no válida'
      });
    }

    // Obtener voto actual del usuario
    const currentVotes = await connection.execute(`
      SELECT id, option_id FROM survey_votes WHERE survey_id = ? AND user_id = ?
    `, [survey_id, userId]);

    if (currentVotes[0].length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No has votado en esta encuesta'
      });
    }

    // Actualizar el voto
    await connection.execute(`
      UPDATE survey_votes 
      SET option_id = ? 
      WHERE survey_id = ? AND user_id = ?
    `, [new_option_id, survey_id, userId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Voto actualizado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando voto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
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
      UPDATE surveys SET status = 'closed' WHERE id = ?
    `, [id]);

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
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_surveys,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_surveys
      FROM surveys
    `);

    // Encuestas más populares
    const popularSurveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.status,
        s.created_at,
        COUNT(sv.id) as total_votes
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
      GROUP BY so.id, so.option_text, s.question
      ORDER BY vote_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        general_stats: generalStats[0],
        popular_surveys: popularSurveys,
        top_options: topOptions
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

// Obtener encuestas del usuario
const getUserSurveys = async (req, res) => {
  try {
    const userId = req.user.id;

    // Encuestas en las que el usuario ha votado
    const votedSurveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.status,
        s.created_at,
        so.option_text as user_vote,
        sv.created_at as voted_at
      FROM surveys s
      INNER JOIN survey_votes sv ON s.id = sv.survey_id
      INNER JOIN survey_options so ON sv.option_id = so.id
      WHERE sv.user_id = ?
      ORDER BY sv.created_at DESC
    `, [userId]);

    // Encuestas activas en las que no ha votado
    const availableSurveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.created_at,
        COUNT(so.id) as options_count
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id
      WHERE s.status = 'open' 
        AND s.id NOT IN (
          SELECT DISTINCT survey_id 
          FROM survey_votes 
          WHERE user_id = ?
        )
      GROUP BY s.id, s.question, s.created_at
      ORDER BY s.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: {
        voted_surveys: votedSurveys,
        available_surveys: availableSurveys
      }
    });

  } catch (error) {
    console.error('Error obteniendo encuestas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createSurvey,
  getActiveSurveys,
  getSurveyById,
  voteInSurvey,
  changeVote,
  closeSurvey,
  getSurveyStats,
  getUserSurveys
}; 