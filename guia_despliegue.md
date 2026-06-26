# 🚀 Guía de Despliegue y Configuración de CORS - Bot Syntra Labs

Esta guía proporciona instrucciones detalladas para desplegar el backend de tu chatbot en producción y configurar de manera óptima las políticas **CORS (Cross-Origin Resource Sharing)** para permitir que el widget se ejecute de forma segura en las webs de tus clientes.

---

## 📌 Arquitectura del Sistema
El chatbot de Syntra Labs funciona mediante una arquitectura desacoplada:
1. **Backend (Servidor Express/Node.js):** Procesa los mensajes, interactúa con la API de OpenAI (GPT), gestiona la base de conocimientos y registra los leads en el CRM de Notion.
2. **Frontend (Widget JavaScript):** Un script interactivo (`widget.js` y `widget.css`) que se embebe en el sitio web del cliente y se comunica mediante solicitudes HTTP (fetch) con el servidor backend.

---

## 1. Despliegue del Servidor (Node.js/Express)

El servidor debe estar en línea las 24 horas para responder a las interacciones de los usuarios. Los servicios recomendados para su despliegue son **Render.com** o **Railway.app** debido a su facilidad de configuración y soporte directo de Node.js.

### Paso 1.1: Preparar el Repositorio
1. Crea un repositorio privado en **GitHub**.
2. Asegúrate de incluir un archivo `.gitignore` para no subir carpetas innecesarias como `node_modules` o tu archivo local `.env` (que contiene credenciales sensibles).
3. Añade y realiza un commit de todos tus archivos del proyecto y súbelos a tu repositorio.

### Paso 1.2: Crear el servicio en Render o Railway
1. **En Render:**
   - Inicia sesión y haz clic en **New +** > **Web Service**.
   - Conecta tu cuenta de GitHub y selecciona el repositorio del bot.
   - Configura las opciones del servicio:
     - **Runtime:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
2. **En Railway:**
   - Inicia sesión, haz clic en **New Project** > **Deploy from GitHub repo**.
   - Selecciona tu repositorio y Railway detectará la configuración automáticamente.

### Paso 1.3: Variables de Entorno
Es crucial definir las variables de entorno en el panel de control del hosting (sección **Environment Variables** / **Config Vars**). **No las subas nunca al repositorio de GitHub.**

| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `PORT` | Puerto en el que corre el servidor (el hosting suele asignarlo automáticamente). | `3000` |
| `OPENAI_API_KEY` | Clave API de OpenAI para dar inteligencia al bot. | `sk-proj-...` |
| `NOTION_API_KEY` | Token de integración interna de Notion. | `secret_...` |
| `NOTION_DATABASE_ID` | ID de la base de datos de Notion (CRM). | `8f84bc...` |
| `RESEND_API_KEY` | Clave API de Resend para notificaciones de correo. | `re_...` |
| `EMAIL_FROM` | Remitente verificado en Resend para los correos. | `notificaciones@tuempresa.com` |
| `EMAIL_TO` | Dirección que recibirá los avisos de nuevos leads. | `ventas@tuempresa.com` |
| `ALLOWED_ORIGINS` | *(Opcional)* Dominios permitidos para conectar por CORS. | `https://tusitio.com,https://cliente.com` |

Una vez guardadas las variables y completada la compilación, el hosting te dará una URL pública oficial (por ejemplo: `https://bot-syntralabs.onrender.com`).

---

## 2. Configuración de CORS (Cross-Origin Resource Sharing)

Cuando el script del chatbot que se ejecuta en la web de tu cliente (`https://web-del-cliente.com`) envía mensajes a tu servidor de Node (`https://bot-syntralabs.onrender.com`), el navegador realiza una petición de origen cruzado (CORS). Si CORS no está configurado adecuadamente en tu backend, las peticiones serán bloqueadas por seguridad.

### Configuración Actual (Acceso Abierto)
En [src/server/index.js](file:///C:/Users/anate/Desktop/bot-syntralabs/src/server/index.js), el middleware de CORS está configurado para **permitir cualquier origen (`*`)**:

```javascript
import cors from 'cors';

// Permite peticiones desde cualquier sitio web (ideal para widgets globales)
app.use(cors());
```
> [!NOTE]
> Esta configuración abierta es la más recomendada si vas a distribuir tu widget en múltiples sitios web de clientes sin necesidad de recompilar o cambiar el código del servidor constantemente.

---

### Configuración Avanzada (Seguridad Restringida)
Si deseas mayor control y restringir el bot para que **solo funcione en dominios específicos**, puedes reemplazar la configuración básica en [src/server/index.js](file:///C:/Users/anate/Desktop/bot-syntralabs/src/server/index.js) con el siguiente código que lee una lista de orígenes permitidos desde las variables de entorno:

```javascript
import cors from 'cors';

// Cargar orígenes permitidos desde variables de entorno (separados por comas)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como llamadas locales de desarrollo, apps móviles o curl)
    if (!origin) return callback(null, true);
    
    // Si la lista de orígenes permitidos está vacía o el origen actual está incluido
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Bloqueado]: Petición no autorizada desde ${origin}`);
      callback(new Error('Acceso no permitido por las políticas CORS de Syntra Labs.'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
```

#### Cómo configurarlo en producción:
Si implementas la restricción, añade en tus variables de entorno del servidor la clave `ALLOWED_ORIGINS` separando los dominios con comas:
```env
ALLOWED_ORIGINS=https://syntralabs.com,https://cliente1.com,https://cliente2.com
```

---

## 3. Integración del Widget en la Web de tus Clientes

Una de las grandes ventajas del diseño actual del widget es que **detecta automáticamente su propio origen de forma dinámica**. No tienes que cambiar las URLs de las llamadas API dentro del archivo JavaScript, ya que el archivo [widget.js](file:///C:/Users/anate/Desktop/bot-syntralabs/src/widget/widget.js) realiza la extracción del servidor dinámicamente con `document.currentScript.src`.

### Opción 1: Inserción Automática (Recomendada)
Dado que `widget.js` carga automáticamente los estilos `widget.css` de manera dinámica, el cliente solo necesita agregar una línea de código en su HTML:

```html
<!-- Widget del Chatbot de Syntra Labs -->
<script src="https://tu-app-de-node.onrender.com/js/widget.js" defer></script>
```
*(Debes cambiar `https://tu-app-de-node.onrender.com` por la URL real de tu despliegue en Render o Railway).*

### Opción 2: Inserción Separada (Por si falla la carga de estilos dinámica)
Si el sitio web del cliente cuenta con políticas de seguridad restrictivas para la inserción de CSS dinámico desde scripts, dale estas dos líneas para colocarlas en su web:

```html
<!-- Estilos del Chatbot -->
<link rel="stylesheet" href="https://tu-app-de-node.onrender.com/css/widget.css">

<!-- Lógica del Chatbot -->
<script src="https://tu-app-de-node.onrender.com/js/widget.js" defer></script>
```

---

## 4. Instrucciones para Diferentes Plataformas

Los clientes pueden integrar el código pegándolo justo antes de la etiqueta de cierre `</body>` de su sitio:

### 🌐 Sitios Web a Medida (HTML, PHP, React, Next.js)
Pegar el código en el pie de página común (ejemplo: `footer.html`, `index.html` o la plantilla base de la página).

### 📝 WordPress
1. Instala el plugin gratuito **"WPCode – Insert Headers and Footers"**.
2. Ve a **Code Snippets** > **Header & Footer**.
3. Pega el script en la sección de **Footer** y haz clic en **Guardar**.
*Alternativa:* Si usan Elementor, Divi o constructores visuales similares, pueden usar el módulo "HTML" en el footer del sitio para incrustar el script.

### 🎨 Webflow
1. Ve a los **Project Settings** (Ajustes de proyecto) de Webflow.
2. Navega a la pestaña de **Custom Code** (Código personalizado).
3. Pega el script en la sección de **Footer Code**.
4. Haz clic en **Save Changes** y publica el sitio.

### 🛍️ Shopify
1. En tu panel de control de Shopify, ve a **Tienda online** > **Temas**.
2. Haz clic en los tres puntos (`...`) del tema activo y selecciona **Editar código**.
3. Abre el archivo `theme.layout` o `theme.liquid`.
4. Busca la etiqueta `</body>` al final del archivo y pega el script justo encima de ella.
5. Guarda los cambios.
