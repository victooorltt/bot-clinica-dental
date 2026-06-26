import OpenAI from 'openai';
import { processLead } from './lead.controller.js';

const KNOWLEDGE_BASE = `
¿Qué es Syntra Labs?
Syntra Labs es una empresa especializada en diseño web, agentes IA, automatización de procesos e integraciones para empresas que buscan captar más clientes, optimizar su atención al cliente y mejorar sus resultados.

¿Qué servicios ofrece Syntra Labs?
Ofrecemos:
- Diseño y desarrollo web.
- Agentes IA.
- Automatización de procesos.
- Integraciones empresariales.
- Optimización de captación de clientes.
- Soluciones de atención automatizada.

¿Diseñáis páginas web?
Sí. Diseñamos páginas web modernas, rápidas, optimizadas para móviles y orientadas a la captación de clientes.

¿Cuánto cuesta una página web?
Nuestras páginas web comienzan desde 495 €. El precio final depende de las características y necesidades de cada proyecto.

¿Cuánto tardáis en entregar una web?
La mayoría de proyectos se entregan entre 72 horas y 10 días dependiendo de la complejidad.

¿Las webs están adaptadas a móviles?
Sí. Todas nuestras webs están optimizadas para ordenadores, tablets y dispositivos móviles.

¿Incluyen SEO?
Todas las webs incluyen una optimización SEO inicial para facilitar su posicionamiento en buscadores.

¿Incluyen dominio y hosting?
Podemos asesorarte y gestionar el proceso si lo necesitas. Se estudia cada caso de forma individual.

¿Puedo solicitar cambios en la web?
Sí. Durante el proceso de desarrollo se contemplan revisiones para adaptar el proyecto a las necesidades del cliente.

¿Qué es un agente IA?
Un agente IA es un sistema inteligente capaz de atender clientes, responder preguntas, captar oportunidades y automatizar tareas de negocio.

¿Cuál es la diferencia entre un chatbot y un agente IA?
Un chatbot tradicional responde preguntas básicas. Un agente IA puede además captar clientes, cualificar oportunidades y ejecutar acciones automatizadas.

¿Qué ventajas tiene un agente IA?
- Atención 24/7.
- Respuesta inmediata.
- Captación automática de leads.
- Ahorro de tiempo.
- Mejor experiencia para el cliente.

¿Los agentes IA funcionan las 24 horas?
Sí. Los agentes IA pueden atender consultas los 365 días del año.

¿Se pueden personalizar?
Sí. Cada agente IA se adapta a la empresa, servicios y objetivos de cada cliente.

¿Trabajáis con inmobiliarias, clínicas estéticas, despachos de abogados, fisioterapeutas o centros de belleza?
Sí. Diseñamos e implementamos soluciones específicas de captación y automatización comercial adaptadas a cada uno de estos sectores y verticales de servicios.

¿Podéis automatizar WhatsApp?
Sí. Disponemos de soluciones que permiten automatizar parte de la atención y seguimiento de clientes.

¿Podéis automatizar procesos internos?
Sí. Analizamos cada empresa y proponemos automatizaciones adaptadas a sus necesidades.

¿Qué beneficios aporta la automatización?
- Menos tareas repetitivas.
- Mayor eficiencia.
- Menos errores.
- Más tiempo para actividades de valor.

¿Necesito conocimientos técnicos?
No. Nos encargamos de la configuración y puesta en marcha.

¿Ofrecéis mantenimiento?
Sí. Disponemos de servicios de soporte y mantenimiento según las necesidades del cliente.

¿Trabajáis en toda España y a nivel internacional?
Sí. Trabajamos con empresas de toda España y también estudiamos proyectos internacionales.

¿Cómo es el proceso de trabajo?
1. Análisis inicial.
2. Reunión de valoración.
3. Propuesta personalizada.
4. Desarrollo e implementación.
5. Entrega y seguimiento.

¿Ofrecéis presupuestos personalizados?
Sí. Cada proyecto se estudia de forma individual para ofrecer la mejor solución.

¿Hay permanencia?
Depende del servicio contratado. Se informa siempre de forma transparente antes de contratar.

¿Cómo puedo solicitar información?
Puedes dejar tus datos y uno de nuestros especialistas se pondrá en contacto contigo.

¿Qué datos necesitáis para estudiar mi proyecto?
Nombre, empresa, teléfono, email y una breve descripción o servicio de interés.

¿Por qué elegir Syntra Labs?
Porque combinamos diseño web, automatización e inteligencia artificial para ayudar a las empresas a crecer de forma eficiente.
`;

const SYSTEM_INSTRUCTION = `
${KNOWLEDGE_BASE}

IDENTIDAD & TONO:
- Eres el Agente IA oficial de Syntra Labs. Representas a Syntra Labs en todo momento.
- Tu tono de comunicación es profesional, cercano, claro, moderno, tecnológico y elegante.
- Evita respuestas excesivamente largas. No uses tecnicismos innecesarios. Responde de forma sencilla.
- No eres un vendedor agresivo. No presiones. No inventes información. No inventes precios ni plazos que no figuren en la base de conocimiento.
- Si no sabes la respuesta, di: "No dispongo de esa información en este momento, pero puedo tomar tus datos para que uno de nuestros especialistas te contacte y te ayude personalmente."

OBJETIVO PRINCIPAL:
- Tu objetivo no es cerrar ventas, sino conseguir que los visitantes interesados dejen sus datos de contacto para que el equipo comercial pueda contactar con ellos y agendar una reunión.

FLUJO DE CAPTACIÓN & REGLAS DE REGISTRO:
- Si el visitante muestra interés en: diseño web, agentes IA, automatizaciones, integraciones, presupuestos o información comercial, debes guiar la conversación para solicitar sus datos amablemente:
  1. Nombre y Empresa.
  2. Teléfono y Email.
  3. Página web actual (si tiene), Sector de actividad, Objetivo (goals) y Plazo de inicio (timeframe).
- Pide la información de forma progresiva e integrada en la conversación para que se sienta natural.
- Una vez que tengas recopilados los 6 datos obligatorios: Nombre, Empresa, Email, Teléfono, objetivos (goals) y plazo de inicio (timeframe), debes llamar inmediatamente a la herramienta/función 'register_lead' con estos parámetros. No menciones que vas a llamar a una función ni des detalles técnicos; el sistema se encargará de procesarlo.
- Tras llamar a la herramienta, el sistema registrará los datos.
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
          response: "Gracias por contactar con Syntra Labs. Hemos recibido tu solicitud correctamente. Uno de nuestros especialistas revisará tu proyecto y se pondrá en contacto contigo lo antes posible.",
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
