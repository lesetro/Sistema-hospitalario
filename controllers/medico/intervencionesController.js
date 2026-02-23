const { 
  IntervencionQuirurgica,
  Paciente,
  Usuario,
  Medico,
  Habitacion,
  Sector,
  EvaluacionMedica,
  EvaluacionEnfermeria,
  ListaEspera,
  Internacion,
  TipoTurno,
  Especialidad,
  Cama,
  Enfermero,
  TipoInternacion,
  Notificacion,
  HistorialMedico,
  ControlEnfermeria,
  TipoDeServicio,
  EstudioSolicitado
} = require('../../models');
const { Op } = require('sequelize');
const db = require('../../database/db');

// ========================================
// RENDERIZAR VISTA PRINCIPAL
// ========================================
exports.renderCirugias = async (req, res, next) => {
  try {
    const medicoId = req.user.medico_id;
    
    res.render('dashboard/medico/cirugias', {
      title: 'Mis Cirugías',
      user: req.user
    });
  } catch (error) {
    console.error('❌ Error al renderizar cirugías:', error);
    next(error);
  }
};

// ========================================
// OBTENER PACIENTES PARA CIRUGÍA
// (Unifica turnos programados + urgencias)
// ========================================
exports.obtenerPacientesCirugia = async (req, res, next) => {
  try {
    const medicoId = req.user.medico_id;
    const { estado, origen, prioridad } = req.query;
    
    console.log(' Obteniendo pacientes para cirugía - Médico:', medicoId);
    
    // ========== 1. PACIENTES EN LISTA DE ESPERA TIPO CIRUGIA ==========
    const whereListaEspera = {
      estado: { [Op.in]: ['PENDIENTE', 'ASIGNADO'] }
    };
    
    // Si hay médico asignado, filtrar por él. Si no, mostrar todos los sin asignar del sector
    const medico = await Medico.findByPk(medicoId, {
      include: [{ model: Sector, as: 'sector' }]
    });
    
    whereListaEspera[Op.or] = [
      { medico_id: medicoId },  // Asignados a mí
      { medico_id: null }        // Sin asignar (los puede tomar)
    ];
    
    if (prioridad && prioridad !== 'TODOS') {
      whereListaEspera.prioridad = prioridad;
    }
    
    const listasEspera = await ListaEspera.findAll({
      where: whereListaEspera,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'apellido', 'dni', 'fecha_nacimiento', 'sexo']
          }]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno',  
          where: { nombre: 'CIRUGIA' }, 
          attributes: ['id', 'nombre']
        },
        {
          model: Medico,
          as: 'medico_asignado',  
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }
      ],
      order: [
        ['prioridad', 'DESC'],
        ['fecha_registro', 'ASC']
      ]
    });
    
    console.log(` Listas de espera encontradas: ${listasEspera.length}`);
    
    // ========== 2. INTERVENCIONES EN CURSO ==========
    const whereIntervenciones = {
      medico_id: medicoId,
      estado_cirugia: { [Op.in]: ['PROGRAMADA', 'PRE_OPERATORIO', 'EN_CIRUGIA', 'POST_OPERATORIO'] }
    };
    
    if (estado && estado !== 'TODOS') {
      whereIntervenciones.estado_cirugia = estado;
    }
    
    const intervenciones = await IntervencionQuirurgica.findAll({
      where: whereIntervenciones,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'apellido', 'dni']
          }]
        },
        {
          model: Habitacion,
          as: 'habitacion',
          attributes: ['id', 'numero']
        },
        {
          model: EvaluacionMedica,
          as: 'evaluacion_medica',
          required: false
        }
      ],
      order: [
        ['estado_cirugia', 'ASC'],
        ['fecha_inicio', 'ASC']
      ]
    });
    
    console.log(` Intervenciones en curso: ${intervenciones.length}`);
    
    // ========== 3. COMBINAR Y FORMATEAR RESPUESTA ==========
    const pacientesFormateados = [];
    
    // Agregar de lista de espera (pendientes de operar)
    for (const lista of listasEspera) {
      // Verificar si ya tiene intervención creada
      const tieneIntervencion = intervenciones.some(i => i.paciente_id === lista.paciente_id);
      if (tieneIntervencion) continue;  // Ya está en intervenciones
      
      // Verificar si tiene evaluación médica
      const evaluacion = await EvaluacionMedica.findOne({
        where: { paciente_id: lista.paciente_id },
        order: [['fecha', 'DESC']]
      });
      
      // Verificar triage
      const evaluacionEnfermeria = await EvaluacionEnfermeria.findOne({
        where: { paciente_id: lista.paciente_id },
        order: [['fecha', 'DESC']]
      });
      
      // Determinar si es urgencia por la prioridad (ya que tipo_turno siempre es CIRUGIA)
      const esUrgencia = lista.prioridad === 'ALTA';
      
      pacientesFormateados.push({
        id: lista.id,
        tipo: 'LISTA_ESPERA',
        paciente: {
          id: lista.paciente?.id,
          nombre: `${lista.paciente?.usuario?.nombre} ${lista.paciente?.usuario?.apellido}`,
          dni: lista.paciente?.usuario?.dni,
          edad: calcularEdad(lista.paciente?.usuario?.fecha_nacimiento),
          sexo: lista.paciente?.usuario?.sexo
        },
        origen: esUrgencia ? 'URGENCIA' : 'PROGRAMADA',
        prioridad: lista.prioridad,
        estado: 'PENDIENTE',
        triage: evaluacionEnfermeria?.nivel_triaje || null,
        tiene_evaluacion_medica: !!evaluacion,
        evaluacion_medica_id: evaluacion?.id || null,
        asignado_a_mi: lista.medico_id === medicoId,
        fecha_registro: lista.fecha_registro,
        observaciones: lista.observaciones
      });
    }
    
    // Agregar intervenciones en curso
    for (const intervencion of intervenciones) {
      pacientesFormateados.push({
        id: intervencion.id,
        tipo: 'INTERVENCION',
        paciente: {
          id: intervencion.paciente?.id,
          nombre: `${intervencion.paciente?.usuario?.nombre} ${intervencion.paciente?.usuario?.apellido}`,
          dni: intervencion.paciente?.usuario?.dni
        },
        origen: intervencion.es_urgencia ? 'URGENCIA' : 'PROGRAMADA',
        prioridad: intervencion.es_urgencia ? 'ALTA' : 'NORMAL',
        estado: intervencion.estado_cirugia,
        tipo_procedimiento: intervencion.tipo_procedimiento,
        quirofano: intervencion.habitacion?.numero,
        tiene_evaluacion_medica: !!intervencion.evaluacion_medica_id,
        fecha_inicio: intervencion.fecha_inicio,
        observaciones: intervencion.observaciones
      });
    }
    
    // Filtrar por origen si se especificó
    let resultado = pacientesFormateados;
    if (origen && origen !== 'TODOS') {
      resultado = pacientesFormateados.filter(p => p.origen === origen);
    }
    
    // Ordenar: urgencias primero, luego por prioridad
    resultado.sort((a, b) => {
      if (a.origen === 'URGENCIA' && b.origen !== 'URGENCIA') return -1;
      if (a.origen !== 'URGENCIA' && b.origen === 'URGENCIA') return 1;
      return 0;
    });
    
    res.json({
      success: true,
      data: resultado,
      estadisticas: {
        total: resultado.length,
        urgencias: resultado.filter(p => p.origen === 'URGENCIA').length,
        programadas: resultado.filter(p => p.origen === 'PROGRAMADA').length,
        en_cirugia: resultado.filter(p => p.estado === 'EN_CIRUGIA').length,
        pendientes: resultado.filter(p => p.estado === 'PENDIENTE').length
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pacientes para cirugía',
      error: error.message
    });
  }
};

// ========================================
// ACEPTAR PACIENTE DE URGENCIA
// ========================================
exports.aceptarPaciente = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { lista_espera_id } = req.params;
    const medicoId = req.user.medico_id;
    
    console.log(` Aceptando paciente - Lista: ${lista_espera_id}, Médico: ${medicoId}`);
    
    const listaEspera = await ListaEspera.findByPk(lista_espera_id, {
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{ model: Usuario, as: 'usuario' }]
      }],
      transaction
    });
    
    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado en lista de espera'
      });
    }
    
    if (listaEspera.medico_id && listaEspera.medico_id !== medicoId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este paciente ya fue asignado a otro cirujano'
      });
    }
    
    // Asignar al cirujano
    await listaEspera.update({
      medico_id: medicoId,
      estado: 'ASIGNADO'
    }, { transaction });
    
    await transaction.commit();
    
    console.log(` Paciente ${listaEspera.paciente?.usuario?.nombre} asignado al cirujano`);
    
    res.json({
      success: true,
      message: `Paciente ${listaEspera.paciente?.usuario?.nombre} ${listaEspera.paciente?.usuario?.apellido} asignado correctamente`,
      data: {
        lista_espera_id: listaEspera.id,
        paciente_id: listaEspera.paciente_id
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al aceptar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar paciente',
      error: error.message
    });
  }
};

// ========================================
// VER DETALLE DEL PACIENTE
// ========================================
exports.verDetallePaciente = async (req, res, next) => {
  try {
    const { paciente_id } = req.params;
    
    console.log(` Obteniendo detalle del paciente: ${paciente_id}`);
    
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: { exclude: ['password'] }
      }]
    });
    
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    // Obtener evaluaciones médicas
    const evaluacionesMedicas = await EvaluacionMedica.findAll({
      where: { paciente_id },
      include: [{
        model: Medico,
        as: 'medico',
        include: [{ model: Usuario, as: 'usuario' }]
      }],
      order: [['fecha', 'DESC']],
      limit: 5
    });
    
    // Obtener evaluaciones de enfermería (incluye triage)
    const evaluacionesEnfermeria = await EvaluacionEnfermeria.findAll({
      where: { paciente_id },
      order: [['fecha', 'DESC']],
      limit: 5
    });
    
    // Obtener estudios solicitados
    const estudios = await EstudioSolicitado.findAll({
      where: { paciente_id },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    // Obtener controles de enfermería
    const controles = await ControlEnfermeria.findAll({
      include: [{
        model: EvaluacionEnfermeria,
        as: 'evaluacion',
        where: { paciente_id }
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    // Obtener internación activa si existe
    const internacion = await Internacion.findOne({
      where: { 
        paciente_id,
        fecha_alta: null
      },
      include: [
        { model: Cama, as: 'cama' },
        { model: Habitacion, as: 'habitacion' }
      ]
    });
    
    // Obtener intervenciones previas
    const intervencionesAnteriores = await IntervencionQuirurgica.findAll({
      where: { 
        paciente_id,
        estado_cirugia: 'FINALIZADA'
      },
      order: [['fecha_fin', 'DESC']],
      limit: 5
    });
    
    res.json({
      success: true,
      data: {
        paciente: {
          id: paciente.id,
          nombre: `${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
          dni: paciente.usuario.dni,
          fecha_nacimiento: paciente.usuario.fecha_nacimiento,
          edad: calcularEdad(paciente.usuario.fecha_nacimiento),
          sexo: paciente.usuario.sexo,
          telefono: paciente.usuario.telefono,
          direccion: paciente.usuario.direccion
        },
        evaluaciones_medicas: evaluacionesMedicas,
        evaluaciones_enfermeria: evaluacionesEnfermeria,
        estudios: estudios,
        controles: controles,
        internacion: internacion,
        intervenciones_anteriores: intervencionesAnteriores,
        tiene_evaluacion_medica: evaluacionesMedicas.length > 0,
        ultimo_triage: evaluacionesEnfermeria[0]?.nivel_triaje || null
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener detalle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del paciente',
      error: error.message
    });
  }
};

// ========================================
// CREAR INTERVENCIÓN QUIRÚRGICA
// ========================================
exports.crearIntervencion = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const medicoId = req.user.medico_id;
    const {
      paciente_id,
      tipo_procedimiento,
      habitacion_id,
      fecha_inicio,
      evaluacion_medica_id,
      lista_espera_id,
      es_urgencia,
      observaciones,
      iniciar_inmediatamente
    } = req.body;
    
    console.log('🔪 Creando intervención quirúrgica:', { paciente_id, tipo_procedimiento, habitacion_id });
    
    // Validaciones
    if (!paciente_id || !tipo_procedimiento || !habitacion_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: paciente, tipo de procedimiento y quirófano'
      });
    }
    
    // Verificar que el paciente existe
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['sexo']
      }],
      transaction
    });
    
    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    // ========================================
    // ✅ LIBERAR CAMA DE EMERGENCIAS (si tiene)
    // ========================================
    let camaEmergenciasLiberada = null;
    
    // Buscar internación activa en emergencias
    const internacionActiva = await Internacion.findOne({
      where: {
        paciente_id: paciente_id,
        fecha_alta: null
      },
      include: [
        { 
          model: Cama, 
          as: 'cama',
          include: [{
            model: Habitacion,
            as: 'habitacion',
            include: [{ model: Sector, as: 'sector' }]
          }]
        }
      ],
      transaction
    });
    
    if (internacionActiva?.cama) {
      camaEmergenciasLiberada = internacionActiva.cama;
      
      // Liberar la cama
      await camaEmergenciasLiberada.update({
        estado: 'EnLimpieza',
        sexo_ocupante: null
      }, { transaction });
      
      console.log(`🧹 Cama ${camaEmergenciasLiberada.numero} de emergencias liberada para limpieza`);
    } else {
      // Buscar en ListaEspera si tiene habitación asignada
      const listaConCama = await ListaEspera.findOne({
        where: {
          paciente_id: paciente_id,
          estado: 'ASIGNADO',
          habitacion_id: { [Op.ne]: null }
        },
        transaction
      });
      
      if (listaConCama?.habitacion_id) {
        const camaOcupada = await Cama.findOne({
          where: {
            habitacion_id: listaConCama.habitacion_id,
            estado: 'Ocupada'
          },
          transaction
        });
        
        if (camaOcupada) {
          camaEmergenciasLiberada = camaOcupada;
          
          await camaOcupada.update({
            estado: 'EnLimpieza',
            sexo_ocupante: null
          }, { transaction });
          
          console.log(`🧹 Cama ${camaOcupada.numero} liberada para limpieza`);
        }
      }
    }
    
    // ========================================
    // Verificar quirófano disponible
    // ========================================
    const habitacion = await Habitacion.findByPk(habitacion_id, { transaction });
    if (!habitacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Quirófano no encontrado'
      });
    }
    
    // Buscar una cama libre en el quirófano
    const camaLibre = await Cama.findOne({
      where: {
        habitacion_id: habitacion_id,
        estado: 'Libre'
      },
      transaction
    });
    
    if (!camaLibre) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No hay camas disponibles en el quirófano seleccionado'
      });
    }
    
    console.log(`🛏️ Cama encontrada en quirófano: ${camaLibre.numero} (ID: ${camaLibre.id})`);
    
    // Asignar la cama al paciente
    await camaLibre.update({
      estado: 'Ocupada',
      sexo_ocupante: paciente.usuario?.sexo || null
    }, { transaction });
    
    console.log(`✅ Cama ${camaLibre.numero} asignada al paciente en quirófano`);
    
    // Determinar estado inicial
    let estadoInicial = 'PROGRAMADA';
    if (iniciar_inmediatamente) {
      estadoInicial = es_urgencia ? 'EN_CIRUGIA' : 'PRE_OPERATORIO';
    }
    
    // Crear intervención
    const datosIntervencion = {
      paciente_id,
      medico_id: medicoId,
      habitacion_id,
      tipo_procedimiento,
      fecha_inicio: fecha_inicio || new Date(),
      evaluacion_medica_id: evaluacion_medica_id || null,
      lista_espera_id: lista_espera_id || null,
      estado_cirugia: estadoInicial,
      es_urgencia: es_urgencia || false,
      observaciones
    };
    
    // Si el modelo tiene cama_id, agregarlo
    if (IntervencionQuirurgica.rawAttributes.cama_id) {
      datosIntervencion.cama_id = camaLibre.id;
    }
    
    const intervencion = await IntervencionQuirurgica.create(datosIntervencion, { transaction });
    
    // Actualizar lista de espera si existe
    if (lista_espera_id) {
      await ListaEspera.update({
        estado: 'EN_PROCESO'
      }, {
        where: { id: lista_espera_id },
        transaction
      });
    }
    
    await transaction.commit();
    
    console.log(`✅ Intervención creada: ID ${intervencion.id}, Cama quirófano: ${camaLibre.numero}`);
    
    res.json({
      success: true,
      message: `Intervención quirúrgica creada correctamente${camaEmergenciasLiberada ? `. Cama ${camaEmergenciasLiberada.numero} de emergencias en limpieza.` : ''}`,
      data: {
        id: intervencion.id,
        estado: intervencion.estado_cirugia,
        cama_quirofano: camaLibre.numero,
        cama_emergencias_liberada: camaEmergenciasLiberada?.numero || null
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al crear intervención:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear intervención',
      error: error.message
    });
  }
};
// ========================================
// ACTUALIZAR ESTADO DE CIRUGÍA
// ========================================
exports.actualizarEstado = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estado_cirugia, notas } = req.body;
    const medicoId = req.user.medico_id;
    
    console.log(` Actualizando estado cirugía ${id} a ${estado_cirugia}`);
    
    const intervencion = await IntervencionQuirurgica.findOne({
      where: { id, medico_id: medicoId },
      transaction
    });
    
    if (!intervencion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Intervención no encontrada'
      });
    }
    
    // Validar transición de estado
    const transicionesValidas = {
      'PROGRAMADA': ['PRE_OPERATORIO', 'CANCELADA'],
      'PRE_OPERATORIO': ['EN_CIRUGIA', 'CANCELADA'],
      'EN_CIRUGIA': ['POST_OPERATORIO', 'FINALIZADA'],
      'POST_OPERATORIO': ['FINALIZADA']
    };
    
    if (!transicionesValidas[intervencion.estado_cirugia]?.includes(estado_cirugia)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede pasar de ${intervencion.estado_cirugia} a ${estado_cirugia}`
      });
    }
    
    // Actualizar según el estado
    const updateData = { estado_cirugia };
    
    if (estado_cirugia === 'PRE_OPERATORIO' && notas) {
      updateData.notas_preoperatorio = notas;
    }
    
    if (estado_cirugia === 'EN_CIRUGIA') {
      updateData.fecha_inicio = new Date();
    }
    
    if (estado_cirugia === 'POST_OPERATORIO' && notas) {
      updateData.notas_postoperatorio = notas;
    }
    
    await intervencion.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `Estado actualizado a ${estado_cirugia}`,
      data: { estado: estado_cirugia }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// ========================================
// FINALIZAR CIRUGÍA
// ========================================
exports.finalizarCirugia = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { resultado_cirugia, notas_postoperatorio, observaciones } = req.body;
    const medicoId = req.user.medico_id;
    
    console.log(`🏁 Finalizando cirugía ${id} - Resultado: ${resultado_cirugia}`);
    
    const intervencion = await IntervencionQuirurgica.findOne({
      where: { id, medico_id: medicoId },
      include: [{
        model: Paciente,
        as: 'paciente',
        include: [{ model: Usuario, as: 'usuario' }]
      }],
      transaction
    });
    
    if (!intervencion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Intervención no encontrada'
      });
    }
    
    if (!resultado_cirugia) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el resultado de la cirugía'
      });
    }
    
    // Actualizar intervención
    await intervencion.update({
      estado_cirugia: 'FINALIZADA',
      resultado_cirugia,
      fecha_fin: new Date(),
      notas_postoperatorio: notas_postoperatorio || intervencion.notas_postoperatorio,
      observaciones: observaciones || intervencion.observaciones
    }, { transaction });
    
    // ========================================
    // DETERMINAR DESTINO DEL PACIENTE
    // ========================================
    const requiereInternacion = resultado_cirugia === 'REQUIERE_INTERNACION';
    const requiereUCI = resultado_cirugia === 'REQUIERE_UCI';
    
    let internacionCreada = null;
    let camaAsignada = null;
    let sectorDestino = null;
    
    // ========================================
    // LIBERAR CAMA DEL QUIRÓFANO
    // ========================================
    const camaQuirofano = await Cama.findOne({
      where: {
        habitacion_id: intervencion.habitacion_id,
        estado: 'Ocupada'
      },
      transaction
    });
    
    if (camaQuirofano) {
      await camaQuirofano.update({
        estado: 'EnLimpieza',
        sexo_ocupante: null
      }, { transaction });
      console.log(`🧹 Cama quirófano ${camaQuirofano.numero} liberada para limpieza`);
    }
    
    // ========================================
    // SI REQUIERE INTERNACIÓN O UCI
    // ========================================
    if (requiereInternacion || requiereUCI) {
      console.log(`🏥 Paciente requiere ${requiereUCI ? 'UCI' : 'Internación'}`);
      
      // Buscar el sector destino
      const nombreSectorDestino = requiereUCI ? 'UTI' : 'Internación';
      sectorDestino = await Sector.findOne({
        where: {
          nombre: { [Op.like]: `%${nombreSectorDestino}%` }
        },
        transaction
      });
      
      if (!sectorDestino) {
        sectorDestino = await Sector.findOne({
          where: {
            nombre: { [Op.or]: [
              { [Op.like]: '%Internación%' },
              { [Op.like]: '%Internacion%' },
              { [Op.like]: '%UTI%' }
            ]}
          },
          transaction
        });
      }
      
      if (sectorDestino) {
        // Buscar cama libre en el sector destino
        camaAsignada = await Cama.findOne({
          where: { estado: 'Libre' },
          include: [{
            model: Habitacion,
            as: 'habitacion',
            where: { sector_id: sectorDestino.id }
          }],
          transaction
        });
        
        if (camaAsignada) {
          const sexoPaciente = intervencion.paciente?.usuario?.sexo || null;
          
          // ========================================
          // BUSCAR DATOS REQUERIDOS
          // ========================================
          let tipoInternacion = await TipoInternacion.findOne({
            where: {
              nombre: { [Op.like]: requiereUCI ? '%Intensiv%' : '%General%' }
            },
            transaction
          });
          
          if (!tipoInternacion) {
            tipoInternacion = await TipoInternacion.findOne({ transaction });
          }
          
          let medicoDestino = await Medico.findOne({
            where: { sector_id: sectorDestino.id },
            transaction
          });
          
          const medicoAsignadoId = medicoDestino?.id || medicoId;
          
          let tipoTurnoInternacion = await TipoTurno.findOne({
            where: {
              nombre: { [Op.or]: [
                { [Op.like]: '%Internación%' },
                { [Op.like]: '%Internacion%' },
                { [Op.like]: '%Programado%' }
              ]}
            },
            transaction
          });
          
          if (!tipoTurnoInternacion) {
            tipoTurnoInternacion = await TipoTurno.findOne({ transaction });
          }
          
          // ========================================
// CREAR LISTA DE ESPERA
// ========================================
const listaEsperaInternacion = await ListaEspera.create({
  paciente_id: intervencion.paciente_id,
  tipo_turno_id: tipoTurnoInternacion.id,
  medico_id: medicoAsignadoId,
  habitacion_id: camaAsignada.habitacion_id,
  prioridad: requiereUCI ? 'ALTA' : 'MEDIA',
  estado: 'ASIGNADO',  // ✅ CAMBIAR de 'COMPLETADO' a 'ASIGNADO'
  creador_tipo: 'MEDICO',
  creador_id: req.user.usuario_id,
  fecha_registro: new Date()
}, { transaction });

console.log(`📋 Lista de espera creada: ID ${listaEsperaInternacion.id}`);

// ========================================
// CREAR INTERNACIÓN
// ========================================
internacionCreada = await Internacion.create({
  paciente_id: intervencion.paciente_id,
  medico_id: medicoAsignadoId,
  cama_id: camaAsignada.id,
  habitacion_id: camaAsignada.habitacion_id,
  tipo_internacion_id: tipoInternacion.id,
  lista_espera_id: listaEsperaInternacion.id,
  fecha_inicio: new Date(),
  motivo: `Post-operatorio: ${intervencion.tipo_procedimiento}`,
  estado_paciente: 'Estable',
  observaciones: `Derivado desde cirugía. Resultado: ${resultado_cirugia}. ${notas_postoperatorio || ''}`
}, { transaction });

console.log(`✅ Internación creada: ID ${internacionCreada.id}`);

// ========================================
//  AHORA SÍ: MARCAR LISTA COMO COMPLETADA
// ========================================
await listaEsperaInternacion.update({
  estado: 'COMPLETADO'
}, { transaction });

// ========================================
// OCUPAR LA CAMA
// ========================================
await camaAsignada.update({
  estado: 'Ocupada',
  sexo_ocupante: sexoPaciente
}, { transaction });

console.log(` Cama ${camaAsignada.numero} asignada al paciente`);
          
          // ========================================
          // NOTIFICAR AL SECTOR DESTINO
          // ========================================
          const medicosDestino = await Medico.findAll({
            where: { sector_id: sectorDestino.id },
            transaction
          });
          
          const enfermerosDestino = await Enfermero.findAll({
            where: { sector_id: sectorDestino.id },
            transaction
          });
          
          const nombrePaciente = `${intervencion.paciente?.usuario?.nombre} ${intervencion.paciente?.usuario?.apellido}`;
          const mensajeNotificacion = `🏥 Nuevo paciente post-operatorio: ${nombrePaciente}. Cirugía: ${intervencion.tipo_procedimiento}. Cama asignada: ${camaAsignada.numero}`;
          
          const notificaciones = [];
          
          for (const medico of medicosDestino) {
            notificaciones.push({
              usuario_id: medico.usuario_id,
              remitente_id: req.user.usuario_id,
              mensaje: mensajeNotificacion,
              leida: false,
              eliminado: false,
              created_at: new Date(),
              updated_at: new Date()
            });
          }
          
          for (const enfermero of enfermerosDestino) {
            notificaciones.push({
              usuario_id: enfermero.usuario_id,
              remitente_id: req.user.usuario_id,
              mensaje: mensajeNotificacion,
              leida: false,
              eliminado: false,
              created_at: new Date(),
              updated_at: new Date()
            });
          }
          
          if (notificaciones.length > 0) {
            await Notificacion.bulkCreate(notificaciones, { transaction });
            console.log(`📨 ${notificaciones.length} notificaciones enviadas al sector ${sectorDestino.nombre}`);
          }
          
        } else {
          console.log(`⚠️ No hay camas disponibles en ${sectorDestino.nombre}`);
          
          // Notificar a administrativos
          const administrativos = await Usuario.findAll({
            where: { rol: 'ADMINISTRATIVO' },
            transaction
          });
          
          const nombrePaciente = `${intervencion.paciente?.usuario?.nombre} ${intervencion.paciente?.usuario?.apellido}`;
          
          for (const admin of administrativos) {
            await Notificacion.create({
              usuario_id: admin.id,
              remitente_id: req.user.usuario_id,
              mensaje: `⚠️ URGENTE: ${nombrePaciente} requiere ${requiereUCI ? 'UCI' : 'internación'} pero no hay camas disponibles. Cirugía: ${intervencion.tipo_procedimiento}`,
              leida: false,
              eliminado: false
            }, { transaction });
          }
        }
      } else {
        console.log('⚠️ No se encontró sector de internación');
      }
    }
    
    // ========================================
    // ACTUALIZAR LISTA DE ESPERA ORIGINAL
    // ========================================
    if (intervencion.lista_espera_id) {
      await ListaEspera.update({
        estado: 'COMPLETADO'
      }, {
        where: { id: intervencion.lista_espera_id },
        transaction
      });
    }
    
    // ========================================
    // CREAR REGISTRO EN HISTORIAL MÉDICO
    // ========================================
    let descripcionHistorial = `Cirugía: ${intervencion.tipo_procedimiento}. Resultado: ${resultado_cirugia}`;
    if (internacionCreada) {
      descripcionHistorial += `. Derivado a ${sectorDestino?.nombre || 'Internación'}, Cama: ${camaAsignada?.numero}`;
    }
    
    await HistorialMedico.create({
      paciente_id: intervencion.paciente_id,
      descripcion: descripcionHistorial,
      tipo_evento: 'Cirugia',
      fecha: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    console.log(`✅ Cirugía finalizada correctamente`);
    
    res.json({
      success: true,
      message: 'Cirugía finalizada correctamente',
      data: {
        resultado: resultado_cirugia,
        requiere_internacion: requiereInternacion || requiereUCI,
        internacion: internacionCreada ? {
          id: internacionCreada.id,
          sector: sectorDestino?.nombre,
          cama: camaAsignada?.numero,
          habitacion: camaAsignada?.habitacion?.numero
        } : null,
        sin_cama_disponible: (requiereInternacion || requiereUCI) && !camaAsignada
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al finalizar cirugía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al finalizar cirugía',
      error: error.message
    });
  }
};
// ========================================
// OBTENER QUIRÓFANOS DISPONIBLES
// ========================================
exports.obtenerQuirofanos = async (req, res, next) => {
  try {
    console.log(' Buscando quirófanos...');
    
    // Buscar habitaciones donde el tipo de servicio sea de cirugía
    const habitaciones = await Habitacion.findAll({
      include: [
        {
          model: Sector,
          as: 'sector'
        },
        {
          model: TipoDeServicio,
          as: 'tipoServicio',
          where: {
            nombre: { [Op.like]: '%Cirug%' }  // Cirugía de Urgencia y Cirugía Programada
          }
        },
        {
          model: Cama,
          as: 'camas',
          required: false
        }
      ],
      order: [['numero', 'ASC']]
    });

    console.log(` Quirófanos encontrados: ${habitaciones.length}`);

    // Verificar cuáles están ocupados
    const quirofanosConEstado = await Promise.all(habitaciones.map(async (hab) => {
      const enUso = await IntervencionQuirurgica.findOne({
        where: {
          habitacion_id: hab.id,
          estado_cirugia: { [Op.in]: ['EN_CIRUGIA', 'PRE_OPERATORIO'] }
        },
        include: [{
          model: Paciente,
          as: 'paciente',
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['nombre', 'apellido']
          }]
        }]
      });

      const camasLibres = hab.camas?.filter(c => c.estado === 'Libre').length || 0;
      const camasTotal = hab.camas?.length || 0;

      return {
        id: hab.id,
        numero: hab.numero,
        tipo: hab.tipo,
        sector: hab.sector?.nombre,
        tipo_servicio: hab.tipoServicio?.nombre,
        es_urgencia: hab.tipoServicio?.nombre?.includes('Urgencia'),
        disponible: !enUso,
        camas_libres: camasLibres,
        camas_total: camasTotal,
        en_uso_por: enUso ? {
          paciente: `${enUso.paciente?.usuario?.nombre} ${enUso.paciente?.usuario?.apellido}`,
          estado: enUso.estado_cirugia,
          procedimiento: enUso.tipo_procedimiento
        } : null
      };
    }));

    console.log(' Quirófanos:', quirofanosConEstado);

    res.json({
      success: true,
      data: quirofanosConEstado,
      total: quirofanosConEstado.length,
      disponibles: quirofanosConEstado.filter(q => q.disponible).length
    });

  } catch (error) {
    console.error('❌ Error al obtener quirófanos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener quirófanos',
      error: error.message
    });
  }
};
// ========================================
// VERIFICAR CIRUGÍAS PENDIENTES (para notificaciones)
// ========================================
exports.verificarPendientes = async (req, res, next) => {
  try {
    const medicoId = req.user.medico_id;
    
    // Buscar sector del médico
    const medico = await Medico.findByPk(medicoId, {
      include: [{ model: Sector, as: 'sector' }]
    });
    
    // Contar cirugías sin asignar
    const count = await ListaEspera.count({
      where: {
        estado: 'PENDIENTE',
        medico_id: null
      },
      include: [{
        model: TipoTurno,
        as: 'tipo_turno',
        where: { nombre: 'CIRUGIA' }
      }]
    });
    
    res.json({
      success: true,
      hay_pendientes: count > 0,
      count: count
    });
    
  } catch (error) {
    console.error('❌ Error al verificar pendientes:', error);
    res.json({
      success: false,
      hay_pendientes: false,
      count: 0
    });
  }
};

// ========================================
// ESTADÍSTICAS
// ========================================
exports.obtenerEstadisticas = async (req, res, next) => {
  try {
    const medicoId = req.user.medico_id;
    
    const [programadas, enCurso, finalizadasHoy, finalizadasMes] = await Promise.all([
      IntervencionQuirurgica.count({
        where: { medico_id: medicoId, estado_cirugia: 'PROGRAMADA' }
      }),
      IntervencionQuirurgica.count({
        where: { 
          medico_id: medicoId, 
          estado_cirugia: { [Op.in]: ['PRE_OPERATORIO', 'EN_CIRUGIA', 'POST_OPERATORIO'] }
        }
      }),
      IntervencionQuirurgica.count({
        where: {
          medico_id: medicoId,
          estado_cirugia: 'FINALIZADA',
          fecha_fin: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      IntervencionQuirurgica.count({
        where: {
          medico_id: medicoId,
          estado_cirugia: 'FINALIZADA',
          fecha_fin: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      })
    ]);
    
    // Pendientes de aceptar (cirugías)
    const pendientesUrgencia = await ListaEspera.count({
      where: {
        estado: 'PENDIENTE',
        medico_id: null
      },
      include: [{
        model: TipoTurno,
        as: 'tipo_turno',
        where: { nombre: 'CIRUGIA' }
      }]
    });
    
    res.json({
      success: true,
      data: {
        programadas,
        en_curso: enCurso,
        finalizadas_hoy: finalizadasHoy,
        finalizadas_mes: finalizadasMes,
        pendientes_urgencia: pendientesUrgencia
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ========================================
// FUNCIÓN AUXILIAR
// ========================================
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

module.exports = exports;