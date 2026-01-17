const { Op } = require('sequelize');
const db = require('../../database/db');
const FilterService = require('../../services/FilterService');
const { 
  Internacion,
  Paciente,
  Medico,
  Administrativo,
  Cama,
  Habitacion,
  Sector,
  TipoInternacion,
  EvaluacionMedica,
  ListaEspera,
  Usuario,
  ObraSocial,
  TipoTurno,
  Admision,
  AltaMedica,
  TipoDeServicio,
  Especialidad
} = require('../../models');

// ============================================================================
// BUSCAR PACIENTE POR DNI PARA INTERNACIÓN
// ============================================================================
const buscarPacienteParaInternacion = async (req, res) => {
  try {
    const { dni } = req.query;
    
    if (!dni) {
      return res.status(400).json({ 
        success: false,
        message: 'DNI es requerido' 
      });
    }

    // Usaremos FilterService 
    const resultado = await FilterService.buscarPacientePorDNI(dni);

    if (!resultado.existe) {
      return res.status(404).json(resultado);
    }

    if (resultado.internado) {
      return res.status(400).json(resultado);
    }

    const paciente = resultado.paciente;

    // Buscar si está en lista de espera
    const listaEspera = await ListaEspera.findOne({
      where: {
        paciente_id: paciente.id,
        estado: ['PENDIENTE', 'ASIGNADO']
      },
      include: [
        { model: TipoTurno, as: 'tipo_turno' },
        { model: Habitacion, as: 'habitacion' }
      ],
      order: [['fecha_registro', 'ASC']]
    });

    // Buscar última evaluación médica
    const evaluacionMedica = await EvaluacionMedica.findOne({
      where: { paciente_id: paciente.id },
      include: [
        { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario' }] }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json({
      success: true,
      existe: true,
      internado: false,
      paciente,
      lista_espera: listaEspera,
      evaluacion_medica: evaluacionMedica
    });

  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar paciente', 
      error: error.message 
    });
  }
};

// ============================================================================
// OBTENER DISPONIBILIDAD DE HABITACIONES POR SECTOR
// ============================================================================
const getDisponibilidadHabitaciones = async (req, res) => {
  try {
    const { sector_id, sexo_paciente } = req.query;

    if (!sector_id) {
      return res.status(400).json({ message: 'sector_id es requerido' });
    }

    const habitaciones = await Habitacion.findAll({
      where: { sector_id },
      include: [
        {
          model: Cama,
          as: 'camas',
          attributes: ['id', 'numero', 'estado', 'sexo_ocupante', 'fecha_fin_limpieza']
        },
        {
          model: TipoDeServicio,
          as: 'tipoServicio',
          attributes: ['id', 'nombre']
        }
      ]
    });

    const disponibilidad = habitaciones.map(hab => {
      const camasLibres = hab.camas.filter(c => c.estado === 'Libre').length;
      const camasOcupadas = hab.camas.filter(c => c.estado === 'Ocupada').length;
      const camasLimpieza = hab.camas.filter(c => c.estado === 'EnLimpieza').length;
      const totalCamas = hab.camas.length;
      
      // Determinar compatibilidad con sexo del paciente
      let compatible = true;
      let razonIncompatibilidad = null;

      if (sexo_paciente) {
        // ✅ CORRECCIÓN: Lógica especial para sexo "Otro"
        if (sexo_paciente === 'Otro') {
          // Pacientes "Otro" solo pueden ir a habitaciones Mixtas o Individuales vacías
          if (hab.sexo_permitido !== 'Mixto' && hab.tipo !== 'Individual') {
            compatible = false;
            razonIncompatibilidad = `Paciente con sexo "Otro" solo puede asignarse a habitaciones Mixtas o Individuales`;
          }
          // Verificar si hay ocupantes en habitaciones dobles
          if (compatible && hab.tipo === 'Doble') {
            const camaOcupada = hab.camas.find(c => c.estado === 'Ocupada');
            if (camaOcupada) {
              compatible = false;
              razonIncompatibilidad = `Habitación doble ya tiene ocupante. Paciente "Otro" requiere habitación vacía o individual`;
            }
          }
        } else {
          // Paciente Masculino o Femenino - lógica original
          // Verificar restricción de habitación
          if (hab.sexo_permitido !== 'Mixto' && hab.sexo_permitido !== sexo_paciente) {
            compatible = false;
            razonIncompatibilidad = `Solo admite pacientes de sexo ${hab.sexo_permitido}`;
          }
          
          // Verificar en habitaciones dobles si ya hay ocupante de otro sexo
          if (compatible && hab.tipo === 'Doble') {
            const camaOcupada = hab.camas.find(c => c.estado === 'Ocupada');
            if (camaOcupada && camaOcupada.sexo_ocupante && camaOcupada.sexo_ocupante !== sexo_paciente) {
              compatible = false;
              razonIncompatibilidad = `Ya hay un paciente de sexo ${camaOcupada.sexo_ocupante}`;
            }
          }
        }
      }

      return {
        id: hab.id,
        numero: hab.numero,
        tipo: hab.tipo,
        sexo_permitido: hab.sexo_permitido,
        tipo_servicio: hab.tipoServicio?.nombre,
        total_camas: totalCamas,
        camas_libres: camasLibres,
        camas_ocupadas: camasOcupadas,
        camas_limpieza: camasLimpieza,
        porcentaje_ocupacion: totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0,
        compatible,
        razon_incompatibilidad: razonIncompatibilidad,
        camas: hab.camas
      };
    });

    // Ordenar por disponibilidad
    disponibilidad.sort((a, b) => b.camas_libres - a.camas_libres);

    res.json({ disponibilidad });

  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({ 
      message: 'Error al obtener disponibilidad', 
      error: error.message 
    });
  }
};

// ============================================================================
// OBTENER CAMAS DISPONIBLES DE UNA HABITACIÓN
// ============================================================================
const getCamasDisponibles = async (req, res) => {
  try {
    const { habitacion_id, sexo_paciente } = req.query;

    if (!habitacion_id) {
      return res.status(400).json({ message: 'habitacion_id es requerido' });
    }

    const habitacion = await Habitacion.findByPk(habitacion_id, {
      include: [
        {
          model: Cama,
          as: 'camas'
        }
      ]
    });

    if (!habitacion) {
      return res.status(404).json({ message: 'Habitación no encontrada' });
    }

    // Filtrar solo camas libres
    let camasLibres = habitacion.camas.filter(c => c.estado === 'Libre');
    let compatible = true;
    let razonIncompatibilidad = null;

    // Verificar compatibilidad de sexo
    if (sexo_paciente) {
      // Verificar restricción de habitación
      if (habitacion.sexo_permitido !== 'Mixto' && habitacion.sexo_permitido !== sexo_paciente) {
        compatible = false;
        razonIncompatibilidad = `La habitación ${habitacion.numero} solo admite pacientes de sexo ${habitacion.sexo_permitido}`;
        camasLibres = [];
      }

      // Verificar en habitaciones dobles
      if (compatible && habitacion.tipo === 'Doble') {
        const camaOcupada = habitacion.camas.find(c => c.estado === 'Ocupada');
        if (camaOcupada && camaOcupada.sexo_ocupante && camaOcupada.sexo_ocupante !== sexo_paciente) {
          compatible = false;
          razonIncompatibilidad = `La habitación ya tiene un paciente de sexo ${camaOcupada.sexo_ocupante}`;
          camasLibres = [];
        }
      }
    }

    res.json({ 
      camas: camasLibres,
      habitacion: {
        id: habitacion.id,
        numero: habitacion.numero,
        tipo: habitacion.tipo,
        sexo_permitido: habitacion.sexo_permitido
      },
      compatible,
      razon_incompatibilidad: razonIncompatibilidad
    });

  } catch (error) {
    console.error('Error al obtener camas:', error);
    res.status(500).json({ 
      message: 'Error al obtener camas', 
      error: error.message 
    });
  }
};

// ============================================================================
// CREAR INTERNACIÓN
// ============================================================================
const crearInternacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      paciente_id,
      medico_id,
      sector_id,
      habitacion_id,
      cama_id,
      tipo_internacion_id,
      evaluacion_medica_id,
      prioridad,
      fecha_cirugia,
      es_prequirurgica,
      estado_operacion,
      observaciones
    } = req.body;

    const administrativoId = req.user?.id;
    const usuarioLogueadoId = req.user?.usuario_id;

    if (!administrativoId) {
      throw new Error('No se pudo obtener el administrativo del JWT');
    }

    // Validar campos obligatorios
    if (!paciente_id || !medico_id || !tipo_internacion_id) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Campos obligatorios: paciente_id, medico_id, tipo_internacion_id' 
      });
    }

    // Obtener paciente con usuario para el sexo
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'sexo'] },
        { model: ObraSocial, as: 'obraSocial' }
      ],
      transaction
    });

    if (!paciente) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Paciente no encontrado' 
      });
    }

    const sexoPaciente = paciente.usuario?.sexo;
    if (!sexoPaciente) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'El paciente no tiene sexo definido en su perfil' 
      });
    }

    // Verificar si hay cama asignada
    if (cama_id && habitacion_id) {
      // ========== ASIGNACIÓN DIRECTA ==========
      
      // Validar cama
      const cama = await Cama.findByPk(cama_id, { transaction });
      if (!cama) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Cama no encontrada' 
        });
      }

      if (cama.estado !== 'Libre') {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: `La cama ${cama.numero} no está disponible. Estado actual: ${cama.estado}` 
        });
      }

      // Validar habitación
      const habitacion = await Habitacion.findByPk(habitacion_id, { transaction });
      if (!habitacion) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Habitación no encontrada' 
        });
      }

      // Validar que la cama pertenece a la habitación
      if (cama.habitacion_id !== parseInt(habitacion_id)) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'La cama no pertenece a la habitación seleccionada' 
        });
      }

      // Validar compatibilidad de sexo
      if (habitacion.sexo_permitido !== 'Mixto' && habitacion.sexo_permitido !== sexoPaciente) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: `No se puede asignar: La habitación ${habitacion.numero} solo admite pacientes de sexo ${habitacion.sexo_permitido}. El paciente es de sexo ${sexoPaciente}.` 
        });
      }

      // Validar en habitaciones dobles
      if (habitacion.tipo === 'Doble') {
        const camaOcupada = await Cama.findOne({
          where: {
            habitacion_id,
            estado: 'Ocupada',
            id: { [Op.ne]: cama_id }
          },
          transaction
        });

        if (camaOcupada && camaOcupada.sexo_ocupante && camaOcupada.sexo_ocupante !== sexoPaciente) {
          await transaction.rollback();
          return res.status(400).json({ 
            success: false,
            message: `Incompatibilidad de sexo: La habitación ${habitacion.numero} ya tiene un paciente de sexo ${camaOcupada.sexo_ocupante}. No se puede asignar un paciente de sexo ${sexoPaciente}.` 
          });
        }
      }

      // Crear lista de espera (necesaria para la internación)
      const listaEspera = await ListaEspera.create({
        paciente_id,
        tipo_turno_id: 1, // Asumiendo tipo turno por defecto para internación
        prioridad: prioridad || 'MEDIA',
        estado: 'PENDIENTE',
        habitacion_id,
        creador_tipo: 'ADMINISTRATIVO',
        creador_id: usuarioLogueadoId,
        fecha_registro: new Date()
      }, { transaction });

      // Crear internación (los hooks del modelo actualizarán cama y lista)
      const internacion = await Internacion.create({
        paciente_id,
        medico_id,
        cama_id,
        habitacion_id,
        tipo_internacion_id,
        administrativo_id: administrativoId,
        evaluacion_medica_id: evaluacion_medica_id || null,
        es_prequirurgica: es_prequirurgica || false,
        estado_operacion: estado_operacion || 'No aplica',
        estado_estudios: 'Pendientes',
        estado_paciente: 'Sin_Evaluar',
        fecha_inicio: new Date(),
        fecha_cirugia: fecha_cirugia || null,
        obra_social_id: paciente.obra_social_id,
        lista_espera_id: listaEspera.id
      }, { transaction });

      await transaction.commit();

      return res.status(201).json({
        success: true,
        asignacion_inmediata: true,
        message: `Internación creada exitosamente. Cama ${cama.numero} asignada a ${paciente.usuario.nombre} ${paciente.usuario.apellido}.`,
        internacion_id: internacion.id,
        habitacion: habitacion.numero,
        cama: cama.numero
      });

    } else {
      // ========== AGREGAR A LISTA DE ESPERA ==========

      // Validar sector
      if (!sector_id) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'Debe seleccionar un sector para agregar a lista de espera' 
        });
      }

      // Verificar si ya está en lista de espera
      const listaExistente = await ListaEspera.findOne({
        where: {
          paciente_id,
          estado: 'PENDIENTE'
        },
        transaction
      });

      if (listaExistente) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'El paciente ya está en lista de espera' 
        });
      }

      // Obtener una habitación del sector para referencia
      const habitacionReferencia = await Habitacion.findOne({
        where: { sector_id },
        transaction
      });

      // Crear lista de espera
      const listaEspera = await ListaEspera.create({
        paciente_id,
        tipo_turno_id: 1, // Asumiendo tipo turno por defecto
        prioridad: prioridad || 'MEDIA',
        estado: 'PENDIENTE',
        habitacion_id: habitacionReferencia?.id || null,
        creador_tipo: 'ADMINISTRATIVO',
        creador_id: usuarioLogueadoId,
        fecha_registro: new Date()
      }, { transaction });

      await transaction.commit();

      // Contar posición en lista
      const posicionEnLista = await ListaEspera.count({
        where: {
          estado: 'PENDIENTE',
          prioridad: prioridad || 'MEDIA',
          fecha_registro: { [Op.lte]: listaEspera.fecha_registro }
        }
      });

      return res.status(201).json({
        success: true,
        asignacion_inmediata: false,
        message: `No hay camas disponibles. ${paciente.usuario.nombre} ${paciente.usuario.apellido} fue agregado/a a lista de espera.`,
        lista_espera_id: listaEspera.id,
        prioridad: prioridad || 'MEDIA',
        posicion: posicionEnLista
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear internación:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al crear internación'
    });
  }
};

// ============================================================================
// ASIGNAR CAMA A PACIENTE EN LISTA DE ESPERA
// ============================================================================
const asignarCamaListaEspera = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const lista_espera_id = id;
    
    const { 
      cama_id, 
      habitacion_id, 
      medico_id,
      tipo_internacion_id,
      evaluacion_medica_id 
    } = req.body;

    const administrativoId = req.user?.id;

    // Validación de campos
    if (!cama_id || !habitacion_id || !medico_id || !tipo_internacion_id) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Campos obligatorios: cama_id, habitacion_id, medico_id, tipo_internacion_id' 
      });
    }

    if (!lista_espera_id) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'ID de lista de espera no proporcionado' 
      });
    }

    console.log(` Buscando lista de espera con ID: ${lista_espera_id}`);

    // ✅ CORRECCIÓN: Buscar lista de espera con Paciente y Usuario para obtener el sexo
    const listaEspera = await ListaEspera.findByPk(lista_espera_id, {
      include: [
        { 
          model: Paciente, 
          as: 'paciente',
          include: [
            { 
              model: Usuario, 
              as: 'usuario',
              attributes: ['id', 'nombre', 'apellido', 'dni', 'sexo']
            },
            {
              model: ObraSocial,
              as: 'obraSocial'
            }
          ]
        }
      ],
      transaction
    });

    if (!listaEspera) {
      await transaction.rollback();
      console.error(`❌ Lista de espera con ID ${lista_espera_id} no encontrada`);
      return res.status(404).json({
        success: false,
        message: `Lista de espera con ID ${lista_espera_id} no encontrada`
      });
    }

    console.log(` Lista de espera encontrada: ${listaEspera.id}`);

    if (listaEspera.estado !== 'PENDIENTE') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La lista de espera está en estado ${listaEspera.estado}, no puede ser asignada`
      });
    }

    const paciente = listaEspera.paciente;
    
    // ✅ CORRECCIÓN: Validar que tenemos el sexo del paciente
    if (!paciente.usuario) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pudo obtener la información del usuario del paciente'
      });
    }

    const sexoPaciente = paciente.usuario.sexo;
    if (!sexoPaciente) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El paciente no tiene sexo definido en su perfil'
      });
    }

    // Validar cama y habitación
    const [cama, habitacion] = await Promise.all([
      Cama.findByPk(cama_id, { transaction }),
      Habitacion.findByPk(habitacion_id, { transaction })
    ]);

    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cama no encontrada'
      });
    }

    if (cama.estado !== 'Libre') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La cama ${cama.numero} no está disponible (Estado: ${cama.estado})`
      });
    }

    if (!habitacion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Habitación no encontrada'
      });
    }

    if (cama.habitacion_id !== parseInt(habitacion_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La cama no pertenece a la habitación seleccionada'
      });
    }

    console.log(' Validaciones de cama y habitación pasadas');

    // ✅ CORRECCIÓN: Validar compatibilidad de sexo incluyendo "Otro"
    if (sexoPaciente === 'Otro') {
      // Pacientes "Otro" solo pueden ir a Mixtas o Individuales vacías
      if (habitacion.sexo_permitido !== 'Mixto' && habitacion.tipo !== 'Individual') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Paciente con sexo "Otro" solo puede asignarse a habitaciones Mixtas o Individuales. La habitación ${habitacion.numero} no es compatible.`
        });
      }
      // Verificar que habitaciones dobles estén vacías
      if (habitacion.tipo === 'Doble') {
        const camaOcupada = await Cama.findOne({
          where: { habitacion_id, estado: 'Ocupada' },
          transaction
        });
        if (camaOcupada) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Habitación doble ya tiene ocupante. Paciente "Otro" requiere habitación vacía o individual.`
          });
        }
      }
    } else {
      // Paciente Masculino o Femenino - lógica original
      if (habitacion.sexo_permitido !== 'Mixto' && habitacion.sexo_permitido !== sexoPaciente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `No se puede asignar: La habitación ${habitacion.numero} solo admite pacientes de sexo ${habitacion.sexo_permitido}. El paciente ${paciente.usuario.nombre} ${paciente.usuario.apellido} es de sexo ${sexoPaciente}.`
        });
      }
    }

    // Validar compatibilidad en habitaciones dobles
    if (habitacion.tipo === 'Doble') {
      const camaOcupada = await Cama.findOne({
        where: {
          habitacion_id,
          estado: 'Ocupada',
          id: { [Op.ne]: cama_id }
        },
        transaction
      });

      if (camaOcupada && camaOcupada.sexo_ocupante && camaOcupada.sexo_ocupante !== sexoPaciente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Incompatibilidad de sexo: La habitación ${habitacion.numero} ya tiene un paciente de sexo ${camaOcupada.sexo_ocupante}. No se puede asignar un paciente de sexo ${sexoPaciente}.`
        });
      }
    }

    console.log(' Validaciones de sexo pasadas');

    // Crear internación (los hooks del modelo actualizarán cama y lista automáticamente)
    const internacion = await Internacion.create({
      paciente_id: paciente.id,
      medico_id,
      cama_id,
      habitacion_id,
      tipo_internacion_id,
      administrativo_id: administrativoId,
      evaluacion_medica_id: evaluacion_medica_id || null,
      es_prequirurgica: false,
      estado_operacion: 'No aplica',
      estado_estudios: 'Pendientes',
      estado_paciente: 'Sin_Evaluar',
      fecha_inicio: new Date(),
      obra_social_id: paciente.obra_social_id,
      lista_espera_id: listaEspera.id
    }, { transaction });

    console.log(` Internación creada con ID: ${internacion.id}`);

    // Actualizar lista de espera (por si el hook no lo hizo)
    await listaEspera.update({
      estado: 'ASIGNADO',
      habitacion_id
    }, { transaction });

    console.log(` Lista de espera marcada como ASIGNADO`);

    await transaction.commit();
    console.log(' Transacción completada exitosamente');

    res.json({
      success: true,
      message: `Cama ${cama.numero} asignada exitosamente a ${paciente.usuario.nombre} ${paciente.usuario.apellido}`,
      internacion_id: internacion.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al asignar cama:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al asignar cama'
    });
  }
};

// ============================================================================
// OBTENER LISTA DE ESPERA POR SECTOR
// ============================================================================
const getListaEsperaPorSector = async (req, res) => {
  try {
    const { sector_id, prioridad } = req.query;

    const whereClause = {
      estado: 'PENDIENTE'
    };

    if (prioridad) {
      whereClause.prioridad = prioridad;
    }

    const listaEspera = await ListaEspera.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni', 'sexo'] }
          ]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno'
        },
        {
          model: Habitacion,
          as: 'habitacion',
          where: sector_id ? { sector_id } : undefined,
          required: false,
          include: [
            { model: Sector, as: 'sector' }
          ]
        }
      ],
      order: [
        ['prioridad', 'DESC'],
        ['fecha_registro', 'ASC']
      ]
    });

    // Calcular días de espera
    const listaConDias = listaEspera.map(item => {
      const diasEspera = Math.floor(
        (new Date() - new Date(item.fecha_registro)) / (1000 * 60 * 60 * 24)
      );

      return {
        ...item.toJSON(),
        dias_espera: diasEspera
      };
    });

    res.json({ lista_espera: listaConDias });

  } catch (error) {
    console.error('Error al obtener lista de espera:', error);
    res.status(500).json({ 
      message: 'Error al obtener lista de espera', 
      error: error.message 
    });
  }
};

// ============================================================================
// OBTENER INTERNACIONES (API)
// ============================================================================
const getInternaciones = async (req, res) => {
  try {
    const { page = 1, limit = 10, sector_id, tiene_alta, estado_paciente } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (tiene_alta === 'true') {
      whereClause.fecha_alta = { [Op.ne]: null };
    } else if (tiene_alta === 'false') {
      whereClause.fecha_alta = null;
    }

    if (estado_paciente) {
      whereClause.estado_paciente = estado_paciente;
    }

    const includeClause = [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni', 'sexo'] },
          { model: ObraSocial, as: 'obraSocial' }
        ]
      },
      {
        model: Medico,
        as: 'medico',
        include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
      },
      { model: Cama, as: 'cama' },
      { 
        model: Habitacion, 
        as: 'habitacion',
        where: sector_id ? { sector_id } : undefined,
        include: [{ model: Sector, as: 'sector' }]
      },
      { model: TipoInternacion, as: 'tipoInternacion' }
    ];

    const { count, rows: internaciones } = await Internacion.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['fecha_inicio', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      internaciones,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener internaciones:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener internaciones', 
      error: error.message 
    });
  }
};

// ============================================================================
// OBTENER INTERNACIÓN POR ID
// ============================================================================
const getInternacionById = async (req, res) => {
  try {
    const { id } = req.params;

    const internacion = await Internacion.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            { model: Usuario, as: 'usuario' },
            { model: ObraSocial, as: 'obraSocial' }
          ]
        },
        {
          model: Medico,
          as: 'medico',
          include: [
            { model: Usuario, as: 'usuario' },
            { model: Especialidad, as: 'especialidad' }
          ]
        },
        { model: Cama, as: 'cama' },
        { 
          model: Habitacion, 
          as: 'habitacion',
          include: [
            { model: Sector, as: 'sector' },
            { model: TipoDeServicio, as: 'tipoServicio' }
          ]
        },
        { model: TipoInternacion, as: 'tipoInternacion' },
        { model: Administrativo, as: 'administrativo' },
        { model: EvaluacionMedica, as: 'evaluacionMedica' },
        { 
          model: AltaMedica, 
          as: 'altasMedicas',
          include: [
            { model: Medico, as: 'medico', include: [{ model: Usuario, as: 'usuario' }] }
          ]
        }
      ]
    });

    if (!internacion) {
      return res.status(404).json({ 
        success: false,
        message: 'Internación no encontrada' 
      });
    }

    // Calcular días internado
    const diasInternado = Math.floor(
      (new Date() - new Date(internacion.fecha_inicio)) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      internacion: {
        ...internacion.toJSON(),
        dias_internado: diasInternado
      }
    });

  } catch (error) {
    console.error('Error al obtener internación:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener internación', 
      error: error.message 
    });
  }
};

// ============================================================================
// ACTUALIZAR ESTADO DE INTERNACIÓN
// ============================================================================
const updateEstadoInternacion = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estado_paciente, estado_operacion, estado_estudios } = req.body;

    const internacion = await Internacion.findByPk(id, { transaction });

    if (!internacion) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Internación no encontrada' 
      });
    }

    const updateData = {};
    if (estado_paciente) updateData.estado_paciente = estado_paciente;
    if (estado_operacion) updateData.estado_operacion = estado_operacion;
    if (estado_estudios) updateData.estado_estudios = estado_estudios;

    await internacion.update(updateData, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Estado de internación actualizado',
      internacion
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar estado', 
      error: error.message 
    });
  }
};

// ============================================================================
// CANCELAR LISTA DE ESPERA
// ============================================================================
const cancelarListaEspera = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const listaEspera = await ListaEspera.findByPk(id, { transaction });

    if (!listaEspera) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Lista de espera no encontrada' 
      });
    }

    if (listaEspera.estado !== 'PENDIENTE') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Solo se pueden cancelar listas en estado PENDIENTE' 
      });
    }

    await listaEspera.update({
      estado: 'CANCELADO'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Lista de espera cancelada correctamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar lista de espera:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al cancelar lista de espera', 
      error: error.message 
    });
  }
};

// ============================================================================
// LIBERAR CAMA (poner en limpieza)
// ============================================================================
const liberarCama = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { cama_id } = req.params;

    const cama = await Cama.findByPk(cama_id, { transaction });

    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Cama no encontrada' 
      });
    }

    // Poner en limpieza
    await cama.update({
      estado: 'EnLimpieza',
      fecha_fin_limpieza: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 horas estimadas
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Cama ${cama.numero} puesta en limpieza`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al liberar cama:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al liberar cama', 
      error: error.message 
    });
  }
};

// ============================================================================
// MARCAR CAMA COMO LIBRE
// ============================================================================
const marcarCamaLibre = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { cama_id } = req.params;

    const cama = await Cama.findByPk(cama_id, { transaction });

    if (!cama) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Cama no encontrada' 
      });
    }

    await cama.update({
      estado: 'Libre',
      sexo_ocupante: null,
      fecha_fin_limpieza: null
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: `Cama ${cama.numero} marcada como libre`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al marcar cama como libre:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al marcar cama como libre', 
      error: error.message 
    });
  }
};

// ============================================================================
// RENDERIZAR VISTA PRINCIPAL DE INTERNACIONES
// ============================================================================
const renderInternaciones = async (req, res) => {
  try {
    const [sectores, medicos, tiposInternacion] = await Promise.all([
      Sector.findAll(),
      Medico.findAll({
        include: [
          { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
          { model: Especialidad, as: 'especialidad' }
        ]
      }),
      TipoInternacion.findAll()
    ]);

    res.render('dashboard/admin/internacion/internaciones', {
      title: 'Gestión de Internaciones',
      user: req.user,
      sectores,
      medicos,
      tiposInternacion
    });

  } catch (error) {
    console.error('Error al renderizar internaciones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la página de internaciones',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

// ============================================================================
// RENDERIZAR LISTA DE INTERNACIONES
// ============================================================================
const renderListaInternaciones = async (req, res) => {
  try {
    const { page = 1, limit = 10, sector_id, tiene_alta, estado_paciente } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (tiene_alta === 'true') {
      whereClause.fecha_alta = { [Op.ne]: null };
    } else if (tiene_alta === 'false') {
      whereClause.fecha_alta = null;
    }

    if (estado_paciente) {
      whereClause.estado_paciente = estado_paciente;
    }

    const includeClause = [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni', 'sexo'] },
          { model: ObraSocial, as: 'obraSocial' }
        ]
      },
      {
        model: Medico,
        as: 'medico',
        include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] }]
      },
      { model: Cama, as: 'cama' },
      { 
        model: Habitacion, 
        as: 'habitacion',
        where: sector_id ? { sector_id } : undefined,
        include: [{ model: Sector, as: 'sector' }]
      },
      { model: TipoInternacion, as: 'tipoInternacion' },
      { model: AltaMedica, as: 'altasMedicas' }
    ];

    const { count, rows: internaciones } = await Internacion.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['fecha_inicio', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    // Obtener sectores para filtro
    const sectores = await Sector.findAll();

    // Calcular días internado para cada registro
    const internacionesConDias = internaciones.map(i => ({
      ...i.toJSON(),
      dias_internado: Math.floor(
        (new Date() - new Date(i.fecha_inicio)) / (1000 * 60 * 60 * 24)
      )
    }));

    res.render('dashboard/admin/internacion/lista-internaciones', {
      title: 'Lista de Internaciones',
      user: req.user,
      internaciones: internacionesConDias,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      filtros: req.query,
      sectores
    });

  } catch (error) {
    console.error('Error al renderizar lista de internaciones:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la lista de internaciones',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

// ============================================================================
// RENDERIZAR LISTA DE ESPERA
// ============================================================================
const renderListaEspera = async (req, res) => {
  try {
    const { sector_id, prioridad } = req.query;

    const whereClause = {
      estado: 'PENDIENTE'
    };

    if (prioridad) {
      whereClause.prioridad = prioridad;
    }

    const listaEspera = await ListaEspera.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'dni', 'sexo'] },
            { model: ObraSocial, as: 'obraSocial' }
          ]
        },
        {
          model: TipoTurno,
          as: 'tipo_turno'
        },
        {
          model: Habitacion,
          as: 'habitacion',
          where: sector_id ? { sector_id } : undefined,
          required: false,
          include: [
            { model: Sector, as: 'sector' }
          ]
        }
      ],
      order: [
        [db.sequelize.literal("CASE WHEN prioridad = 'ALTA' THEN 1 WHEN prioridad = 'MEDIA' THEN 2 ELSE 3 END"), 'ASC'],
        ['fecha_registro', 'ASC']
      ]
    });

    // Calcular días de espera
    const listaConDias = listaEspera.map(item => {
      const diasEspera = Math.floor(
        (new Date() - new Date(item.fecha_registro)) / (1000 * 60 * 60 * 24)
      );

      return {
        ...item.toJSON(),
        dias_espera: diasEspera
      };
    });

    // Obtener datos para formularios
    const [sectores, medicos, tiposInternacion] = await Promise.all([
      Sector.findAll(),
      Medico.findAll({
        include: [
          { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
          { model: Especialidad, as: 'especialidad' }
        ]
      }),
      TipoInternacion.findAll()
    ]);

    res.render('dashboard/admin/internacion/lista-espera', {
      title: 'Lista de Espera',
      user: req.user,
      lista_espera: listaConDias,
      sectores,
      medicos,
      tiposInternacion,
      filtros: req.query
    });

  } catch (error) {
    console.error('Error al renderizar lista de espera:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la lista de espera',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

// ============================================================================
// API - RESUMEN DE DISPONIBILIDAD
// ============================================================================
const getResumenDisponibilidad = async (req, res) => {
  try {
    const sectores = await Sector.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas'
        }]
      }]
    });

    const sectoresConEstadisticas = sectores.map(sector => {
      const habitaciones = sector.habitaciones || [];
      const todasLasCamas = habitaciones.flatMap(h => h.camas || []);
      
      const libres = todasLasCamas.filter(c => c.estado === 'Libre').length;
      const ocupadas = todasLasCamas.filter(c => c.estado === 'Ocupada').length;
      const enLimpieza = todasLasCamas.filter(c => c.estado === 'EnLimpieza').length;
      const total = todasLasCamas.length;
      const porcentajeOcupacion = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

      return {
        id: sector.id,
        nombre: sector.nombre,
        estadisticas: {
          total,
          libres,
          ocupadas,
          enLimpieza,
          porcentajeOcupacion
        }
      };
    });

    res.json({
      success: true,
      sectores: sectoresConEstadisticas
    });

  } catch (error) {
    console.error('Error al obtener resumen de disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de disponibilidad'
    });
  }
};

// ============================================================================
// RENDERIZAR VISTA DE DISPONIBILIDAD DETALLADA
// ============================================================================
const renderDisponibilidadDetallada = async (req, res) => {
  try {
    const { sector_id, habitacion_id } = req.query;
    
    // Obtener todos los sectores con estadísticas
    const sectores = await Sector.findAll({
      include: [{
        model: Habitacion,
        as: 'habitaciones',
        include: [{
          model: Cama,
          as: 'camas'
        }]
      }]
    });

    // Calcular estadísticas por sector
    const sectoresConEstadisticas = sectores.map(sector => {
      const habitaciones = sector.habitaciones || [];
      const todasLasCamas = habitaciones.flatMap(h => h.camas || []);
      
      const libres = todasLasCamas.filter(c => c.estado === 'Libre').length;
      const ocupadas = todasLasCamas.filter(c => c.estado === 'Ocupada').length;
      const enLimpieza = todasLasCamas.filter(c => c.estado === 'EnLimpieza').length;
      const total = todasLasCamas.length;
      const porcentajeOcupacion = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

      return {
        ...sector.toJSON(),
        estadisticas: {
          total,
          libres,
          ocupadas,
          enLimpieza,
          porcentajeOcupacion
        }
      };
    });

    let habitacionesDetalle = null;
    let camasDetalle = null;
    let sectorSeleccionado = null;
    let habitacionSeleccionada = null;

    // Si hay sector seleccionado, cargar habitaciones
    if (sector_id) {
      sectorSeleccionado = await Sector.findByPk(sector_id);
      
      habitacionesDetalle = await Habitacion.findAll({
        where: { sector_id },
        include: [
          {
            model: Cama,
            as: 'camas',
            include: [{
              model: Internacion,
              as: 'internaciones',
              where: { fecha_alta: null },
              required: false,
              include: [
                {
                  model: Paciente,
                  as: 'paciente',
                  include: [{ model: Usuario, as: 'usuario' }]
                },
                {
                  model: Medico,
                  as: 'medico',
                  include: [{ model: Usuario, as: 'usuario' }]
                }
              ]
            }]
          },
          { model: TipoDeServicio, as: 'tipoServicio' }
        ],
        order: [['numero', 'ASC']]
      });

      // Calcular estadísticas por habitación
      habitacionesDetalle = habitacionesDetalle.map(hab => {
        const camas = hab.camas || [];
        const libres = camas.filter(c => c.estado === 'Libre').length;
        const ocupadas = camas.filter(c => c.estado === 'Ocupada').length;
        const enLimpieza = camas.filter(c => c.estado === 'EnLimpieza').length;
        const total = camas.length;

        return {
          ...hab.toJSON(),
          estadisticas: {
            total,
            libres,
            ocupadas,
            enLimpieza,
            porcentajeOcupacion: total > 0 ? Math.round((ocupadas / total) * 100) : 0
          }
        };
      });
    }

    // Si hay habitación seleccionada, cargar detalles de camas
    if (habitacion_id) {
      habitacionSeleccionada = await Habitacion.findByPk(habitacion_id, {
        include: [
          { model: Sector, as: 'sector' },
          { model: TipoDeServicio, as: 'tipoServicio' }
        ]
      });

      camasDetalle = await Cama.findAll({
        where: { habitacion_id },
        include: [{
          model: Internacion,
          as: 'internaciones',
          where: { fecha_alta: null },
          required: false,
          include: [
            {
              model: Paciente,
              as: 'paciente',
              include: [
                { model: Usuario, as: 'usuario' },
                { model: ObraSocial, as: 'obraSocial' }
              ]
            },
            {
              model: Medico,
              as: 'medico',
              include: [{ model: Usuario, as: 'usuario' }]
            },
            { model: TipoInternacion, as: 'tipoInternacion' }
          ]
        }],
        order: [['numero', 'ASC']]
      });

      // Para cada cama, obtener el último paciente (incluso si ya se fue)
      for (let cama of camasDetalle) {
        if (cama.estado !== 'Libre' && cama.internaciones.length === 0) {
          const ultimaInternacion = await Internacion.findOne({
            where: { 
              cama_id: cama.id,
              fecha_alta: { [Op.ne]: null }
            },
            include: [
              {
                model: Paciente,
                as: 'paciente',
                include: [{ model: Usuario, as: 'usuario' }]
              },
              {
                model: AltaMedica,
                as: 'altasMedicas',
                order: [['fecha_alta', 'DESC']],
                limit: 1
              }
            ],
            order: [['fecha_alta', 'DESC']]
          });

          cama.ultimaInternacion = ultimaInternacion;
        }
      }
    }

    res.render('dashboard/admin/internacion/disponibilidad-detallada', {
      title: 'Disponibilidad de Camas',
      user: req.user,
      sectores: sectoresConEstadisticas,
      habitaciones: habitacionesDetalle,
      camas: camasDetalle,
      sectorSeleccionado,
      habitacionSeleccionada,
      filtros: req.query
    });

  } catch (error) {
    console.error('Error al renderizar disponibilidad:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar la disponibilidad de camas',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.user
    });
  }
};

module.exports = {
  buscarPacienteParaInternacion,
  getDisponibilidadHabitaciones,
  getCamasDisponibles,
  crearInternacion,
  asignarCamaListaEspera,
  getListaEsperaPorSector,
  getInternaciones,
  getInternacionById,
  updateEstadoInternacion,
  cancelarListaEspera,
  liberarCama,
  marcarCamaLibre,
  renderInternaciones,
  renderListaInternaciones,
  renderListaEspera,
  getResumenDisponibilidad,
  renderDisponibilidadDetallada
};
