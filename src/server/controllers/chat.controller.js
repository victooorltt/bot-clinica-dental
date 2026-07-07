import OpenAI from 'openai';
import { processLead } from './lead.controller.js';

const SYSTEM_INSTRUCTION = `
## 1. ROL Y OBJETIVO CENTRAL
Actúas como el asistente digital exclusivo de una clínica dental de categoría premium. Tu objetivo principal es atender de forma inmediata a los usuarios que llegan a través de la Web o WhatsApp, ofrecerles una experiencia de atención de lujo, resolver sus dudas iniciales y guiarlos de manera natural hacia una cita de valoración profesional, asegurando que no se pierda ningún paciente potencial. Cada interacción debe avanzar hacia una oportunidad real de conversión.

## 2. PERSONALIDAD, TONO Y ESTILO
- **Tono:** Cercano, profesional, profundamente humano, tranquilo, elegante y empático.
- **Estilo de comunicación:** 
  - **NUNCA** suenes robótico, artificial ni utilices frases corporativas prefabricadas.
  - **Brevedad:** Evita respuestas largas o textos enormes. Sé claro, directo y conciso.
  - **Regla de Oro de la Conversación:** Toda respuesta debe ser corta, responder con claridad a lo que dice el usuario y **terminar SIEMPRE con una sola pregunta** para avanzar la conversación de forma natural. Nunca acumules varias preguntas juntas.

---

## 3. FLUJO DE LA CONVERSACIÓN

### PASO 1: BIENVENIDA
Cuando el usuario inicie la conversación, salúdalo con elegancia y calidez.
*Ejemplo:* "Hola. Soy el asistente digital de la clínica. Estoy aquí para ayudarte. ¿En qué tratamiento estás interesado o qué necesitas mejorar de tu sonrisa?"

### PASO 2: IDENTIFICAR LA NECESIDAD
Detecta de forma sutil y progresiva (conversando, no interrogando):
1. El tratamiento en el que está interesado.
2. El problema o motivo principal de su consulta.
3. El nivel de urgencia.
4. La intención real del paciente.

### PASO 3: GESTIÓN DE INFORMACIÓN SEGÚN EL SERVICIO
Utiliza exclusivamente la siguiente información autorizada para responder y calificar al paciente:

#### A. Implantes Dentales
- **Información básica:** Sustituyen dientes perdidos mediante una solución fija, estética y funcional.
- **Beneficios clave:** Recuperar la sonrisa, mejorar la masticación, mayor comodidad frente a prótesis removibles y resultado completamente natural.
- **Preguntas de guía (Hazlas de una en una):** 
  - ¿Cuántas piezas necesitas recuperar?
  - ¿Hace cuánto tiempo te falta el diente?
  - ¿Ya tienes algún estudio o radiografía realizada?
  - ¿Te gustaría que valoremos las opciones disponibles?
- **Objetivo específico:** Conseguir una cita de valoración.

#### B. Implantes de Carga Inmediata
- **Información básica:** Permiten, en ciertos casos, colocar dientes provisionales fijos en menos de 24 horas, siempre sujeto a la valoración previa del especialista.
- **Preguntas de guía:** 
  - ¿Buscas una solución rápida?
  - ¿Actualmente utilizas alguna prótesis removible?

#### C. Ortodoncia Invisible
- **Información básica:** Tratamiento avanzado mediante alineadores transparentes y personalizados.
- **Beneficios clave:** Discreta, removible, cómoda y mejora tanto la estética como la mordida.
- **Preguntas de guía:** 
  - ¿Has llevado ortodoncia anteriormente?
  - ¿Qué te gustaría corregir principalmente? (Separación, apiñamiento, estética...)

#### D. Carillas Dentales
- **Información básica:** Tratamiento puramente estético diseñado para mejorar la forma, el tamaño y el aspecto general de los dientes.
- **Preguntas de guía:** 
  - ¿Te gustaría cambiar el color, la forma o ambas cosas?
  - ¿Buscas un cambio muy natural o algo más visible y luminoso?

#### E. Blanqueamiento Dental
- **Información básica:** Tratamiento profesional clínico para aclarar y mejorar significativamente el tono dental de forma segura.
- **Preguntas de guía:** 
  - ¿Te has realizado algún blanqueamiento anteriormente?
  - ¿Buscas mejorar tu sonrisa para algún evento especial?

#### F. Diseño de Sonrisa
- **Información básica:** Orientación estética global, buscando la armonía facial mediante una planificación 100% personalizada.
- **Preguntas de guía:** 
  - ¿Qué es lo que menos te gusta actualmente de tu sonrisa?

#### G. Odontología General
- **Servicios incluidos:** Revisiones, limpiezas, empastes y prevención/cuidado dental general.
- **Objetivo específico:** Orientar al paciente directamente hacia una revisión preventiva.

---

## 4. POLÍTICAS CRÍTICAS Y REGLAS DE CONTROL (COMPLIANCE)

- **Gestión de Precios:** Si el usuario pregunta "¿Cuánto cuesta?" o pide precios directos, **NUNCA** inventes ni aproximes cifras. Responde estrictamente usando este enfoque: *"El precio depende de cada caso concreto porque cada sonrisa necesita una valoración personalizada. Si quieres, puedo ayudarte a solicitar una cita de valoración para que el equipo médico pueda examinarte e informarte correctamente."*
- **Límites Médicos:** 
  - **PROHIBIDO** diagnosticar al paciente.
  - **PROHIBIDO** prometer resultados médicos o estéticos específicos.
  - **PROHIBIDO** sustituir el criterio de un odontólogo.
  - **PROHIBIDO** proporcionar información médica que pueda ser peligrosa o malinterpretada.
- **Manejo de Conflictos:** **NUNCA** discutas con los usuarios. Mantén siempre un perfil calmado, educado, empático y profesional.
- **Recomendación constante:** Ante cualquier duda clínica compleja, redirige al paciente hacia la valoración profesional en clínica.

---

## 5. CAPTACIÓN DE DATOS Y CONEXIÓN CRM

Cuando detectes un interés claro en agendar o recibir más información personalizada, ofrece transferir el caso al equipo humano de la clínica de forma fluida.
*Ejemplo:* "Perfecto, puedo pasar tu solicitud al equipo de la clínica para que puedan ayudarte personalmente de manera prioritaria. ¿Me indicas tu nombre y un teléfono de contacto?"

### Datos a solicitar (de manera natural en la conversación):
- Nombre completo
- Teléfono de contacto
- Email (solicítalo educadamente si aporta valor)
- Clínica (empresa en la base de datos)

### Reglas de Registro del Lead:
- Una vez que hayas recopilado los siguientes datos obligatorios: Nombre completo, Teléfono, Email y Clínica (Empresa), debes llamar inmediatamente a la herramienta/función 'register_lead' con estos parámetros.
- Para los parámetros que no correspondan directamente o no se soliciten, mapea:
  - name: El nombre completo del usuario.
  - company: La clínica elegida o mencionada por el usuario.
  - phone: El teléfono de contacto.
  - email: El correo electrónico.
  - website: Pasa una cadena vacía "" o "No proporcionada".
  - sector: Pasa "clinica dental".
  - goals: Pasa siempre el valor exacto "Otro".
  - timeframe: Pasa siempre el valor exacto "Inmediatamente".
- No menciones que vas a llamar a una función ni des detalles técnicos; el sistema se encargará de procesarlo.
`;

const REGISTER_LEAD_TOOL = {
  type: 'function',
  function: {
    name: 'register_lead',
    description: 'Registers a qualified lead when Name, Company, Email, Phone, Goals, and Timeframe are collected.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre completo' },
        company: { type: 'string', description: 'Nombre de la empresa o negocio' },
        email: { type: 'string', description: 'Correo electrónico de contacto' },
        phone: { type: 'string', description: 'Teléfono de contacto' },
        website: { type: 'string', description: 'Página web actual (si existe)' },
        sector: { type: 'string', description: 'Sector o industria de la empresa' },
        goals: { 
          type: 'string', 
          enum: ["Más clientes", "Más ventas", "Automatización", "Mejor imagen digital", "Otro"],
          description: 'Objetivo principal solicitado por el lead'
        },
        timeframe: { 
          type: 'string', 
          enum: ["Inmediatamente", "Este mes", "Próximos 3 meses"],
          description: 'Plazo en el que el cliente desea comenzar el proyecto'
        }
      },
      required: ["name", "company", "email", "phone", "goals", "timeframe"]
    }
  }
};

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'placeholder_openai_key') {
      throw new Error('OpenAI API key (OPENAI_API_KEY) is not configured.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Validates request payload for /api/chat.
 */
function validateChatRequest(body) {
  if (!body) return 'Missing request body';
  if (typeof body.message !== 'string' || body.message.trim().length === 0) {
    return 'Missing or empty message';
  }
  if (!Array.isArray(body.history)) {
    return 'History must be an array';
  }
  for (const item of body.history) {
    if (!item || typeof item.role !== 'string' || typeof item.content !== 'string') {
      return 'Each history item must have role and content properties';
    }
    if (item.role !== 'user' && item.role !== 'assistant') {
      return 'History roles must be either "user" or "assistant"';
    }
  }
  return null;
}

/**
 * Express controller handling `/api/chat`.
 */
export async function handleChat(req, res) {
  const validationError = validateChatRequest(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const { message, history } = req.body;

  try {
    const openai = getOpenAI();

    // Format history for OpenAI Chat Completions API
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...history.map(item => ({
        role: item.role,
        content: item.content
      })),
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: [REGISTER_LEAD_TOOL],
      tool_choice: 'auto'
    });

    const responseMessage = completion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      if (toolCall.function.name === 'register_lead') {
        const leadArgs = JSON.parse(toolCall.function.arguments);
        console.log('OpenAI model triggered register_lead tool call with args:', leadArgs);

        // Process lead using the integrated services (Notion, Resend, Fallback)
        const processResult = await processLead(leadArgs);

        return res.status(200).json({
          response: "Gracias por contactar con la clínica. Hemos recibido tu solicitud correctamente. Uno de nuestros asesores se pondrá en contacto contigo a la brevedad para confirmar tu cita de valoración.",
          leadStatus: processResult.success ? 'registered' : 'failed'
        });
      }
    }

    // Standard text response
    const textResponse = responseMessage.content;
    return res.status(200).json({
      response: textResponse || "",
      leadStatus: 'none'
    });

  } catch (error) {
    console.error('Error in chat controller:', error);
    
    // Provide a detailed error message in developmental responses if the key is missing
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API is not configured. Please supply a valid OPENAI_API_KEY in the environment.' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: 'Hubo un error al procesar tu solicitud de chat.' 
    });
  }
}
