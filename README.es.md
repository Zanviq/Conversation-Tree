# 🌳 Conversation-Tree

**Una interfaz de chat en la que cada mensaje puede abrir su propia rama de conversación, mostrada como un mapa en árbol.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) [![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md) | **Español**

[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

---

## 💭 Developer's Note

> *"Una conversación no es un simple registro lineal, sino un árbol de posibilidades que se ramifica infinitamente."*

En nuestra vida diaria, los grandes modelos de lenguaje nos proporcionan una gran cantidad de conocimientos. Como alguien naturalmente curioso, a menudo le hago muchas preguntas a Google AI en lugar de usar simplemente la Búsqueda de Google. Casi todas las plataformas de IA utilizan un formato de *"sala de chat"*. Si bien esto brinda una gran oportunidad para hacerle preguntas profundas a una IA sobre un solo tema, sentí que faltaba algo, y esa pieza faltante se convirtió en un inconveniente.

Específicamente, la IA a menudo intenta proporcionar mucha información a la vez. Por ejemplo, si explica las cosas usando listas numeradas como 1, 2 y 3, podría hacer preguntas de seguimiento sobre el punto 1, pero luego me resultaría difícil volver al punto 2 más tarde.

Anteriormente, para compensar la falta de memoria a largo plazo de la IA, se me ocurrió y construí un "Sistema de Memoria Semántica Jerárquica". Ampliando esa idea, quería crear una interfaz de chat para este proyecto donde **los recuerdos estén separados por pistas, lo que te permite conversar dentro del contexto de memoria específico que desees.**

Así es como planeé este proyecto.
Espero que muchas personas encuentren útil esta función. Ten en cuenta que este proyecto no está alojado como un servicio.

---

## ✨ Features

### 🌳 Conversaciones ramificadas
- Cada mensaje del usuario y cada respuesta de la IA se guardan como nodos con `parentId` / `childrenIds`, así que una conversación es un árbol
- **Focus** mueve la posición actual (head) a una respuesta anterior; el siguiente mensaje abre una rama nueva desde ahí
- **Edit** reemplaza una pregunta y vuelve a generar su respuesta; **Edit & Fork** conserva la original y añade la pregunta editada como rama hermana
- La IA solo recibe los mensajes del camino entre la raíz y el head actual

### 🔗 Memoria conectada
- **Connect Memory** enlaza un nodo de otra rama con la rama actual
- Al enviar, los mensajes de la rama enlazada (desde el ancestro común hacia abajo) se añaden al inicio del prompt como un bloque "Connected Memory"
- Las conexiones se dibujan como líneas discontinuas en el mapa y se eliminan con **Delete Connection**

### 📊 Comparación de líneas temporales
- El botón de comparar activa el modo de selección de pistas; los nodos hoja del mapa se eligen como Track B, C, …
- El texto completo de cada pista seleccionada se añade a la pregunta como contexto
- Las pistas adjuntas aparecen como etiquetas en el mensaje y se abren en una vista de solo lectura

### 🗺️ Mapa de la conversación
- Árbol de D3.js con los pares pregunta/respuesta junto al chat
- Zoom, desplazamiento, arrastre de nodos y recentrado en el nodo actual; las posiciones arrastradas se guardan
- Los nombres de los nodos son resúmenes cortos generados por Gemini (las primeras palabras de la pregunta si no hay clave)

### ⚡ Respuestas de Gemini
- Respuestas en streaming mediante `@google/genai`, llamado directamente desde el navegador
- Gemini 3 Flash / Pro se puede elegir por separado para las respuestas y para las etiquetas
- Las imágenes adjuntas (selector de archivos o pegar) se envían como inline data

### 👤 Cuentas y almacenamiento
- Registro e inicio de sesión con usuario y contraseña (hash bcrypt, JWT en una cookie httpOnly)
- Las conversaciones, la conversación activa y la elección de modelos se guardan por usuario en PostgreSQL
- En lugar de guardar en cada fragmento del streaming, el cliente envía solo las conversaciones modificadas a intervalos

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) con Docker Compose
- (Opcional, para las respuestas de IA) una [clave de API de Google Gemini](https://aistudio.google.com/apikey)

### Ejecutar

```bash
git clone https://github.com/Zanviq/Conversation-Tree.git
cd Conversation-Tree
cp .env.example .env
docker compose up
```

Abre http://localhost:8080 (cambia `WEB_PORT` en `.env` si el puerto está en uso).

En el primer arranque el servidor aplica las migraciones de la base de datos y crea una cuenta de demostración con conversaciones de ejemplo.

### Cuenta de demostración

| Usuario | Contraseña |
|----------|----------|
| `demo` | `demo1234` |

### Clave de API de Gemini
Sin clave puedes iniciar sesión y ver todas las conversaciones, el mapa y las vistas de pistas. Enviar, **Edit** y **Edit & Fork** quedan desactivados hasta que añadas una clave.

1. Haz clic en **Add API key** encima del cuadro de mensaje (o en **Gemini API Key** en la barra lateral)
2. Pega tu clave y haz clic en **Validate & Save**
3. La clave se guarda solo en el localStorage de tu navegador y se envía directamente a Google; nunca se envía al servidor de esta aplicación

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Visualization** | D3.js 7 |
| **Styling** | Tailwind CSS |
| **Markdown** | react-markdown |
| **AI** | Google Gemini API (`@google/genai`, desde el navegador) |
| **Backend** | Node.js 22, Express 5 |
| **Database** | PostgreSQL 16, Drizzle ORM, drizzle-kit |
| **Auth** | bcryptjs, jsonwebtoken (cookie httpOnly) |
| **Infra** | Docker Compose, nginx |
| **Screenshots** | Playwright |

---

## 📁 Project Structure

```
Conversation-Tree/
├── 📂 components/
│   ├── ChatInterface.tsx       # Hilo del chat, acciones de mensajes, entrada y aviso de clave de API
│   ├── UniverseMap.tsx         # Mapa D3 de la conversación (arrastre, zoom, conexiones, pistas)
│   ├── LandingPage.tsx         # Página de inicio con registro / inicio de sesión
│   └── ApiKeyModal.tsx         # Entrada de la clave de Gemini (solo en el navegador)
├── 📂 services/
│   ├── apiClient.ts            # Envoltorio de fetch y llamadas de autenticación
│   ├── apiKeyStore.ts          # Clave de Gemini en localStorage
│   ├── geminiService.ts        # Respuestas en streaming, validación de clave, etiquetas
│   └── storageService.ts       # Sincroniza conversaciones y ajustes con el servidor
├── 📂 utils/
│   └── graphUtils.ts           # Construcción de hilos, memoria conectada, jerarquía del árbol
├── 📂 server/
│   ├── 📂 drizzle/             # Migraciones SQL
│   ├── 📂 src/
│   │   ├── 📂 db/              # Esquema, ejecución de migraciones, seed de demostración
│   │   ├── 📂 routes/          # /api/auth, /api/conversations, /api/settings
│   │   ├── auth.ts             # Hash de contraseñas y cookie de sesión
│   │   └── index.ts            # Entrada de Express (migrar → seed → escuchar)
│   └── Dockerfile
├── 📂 docker/
│   └── nginx.conf              # Sirve la build web y hace proxy de /api
├── 📂 scripts/
│   └── 📂 capture-screenshots/ # Script de Playwright para las capturas del README
├── 📂 image/                   # Capturas de pantalla
├── App.tsx                     # Estado de la app, lógica de ramas, diseño
├── types.ts                    # Tipos Session / Message
├── Dockerfile                  # Imagen web (build de Vite → nginx)
├── docker-compose.yml          # db, server, web
└── .env.example
```

---

## 💡 How to Use

1. **Iniciar sesión**: Usa la cuenta de demostración o crea una en la página de inicio
2. **Empezar un chat**: Haz clic en **New Chat** y envía un mensaje (requiere una clave de API de Gemini)
3. **Ramificar**: Pasa el cursor sobre una respuesta y pulsa **Focus**, o haz clic en un nodo del mapa → **Focus / View**, y envía un mensaje nuevo
4. **Edit & Fork**: Cambia una pregunta anterior y conserva ambas versiones como ramas separadas
5. **Conectar memoria**: Haz clic en un nodo → **Connect Memory** → elige el nodo destino
6. **Comparar líneas temporales**: Pulsa el botón de comparar junto a la entrada, selecciona nodos hoja en el mapa y haz tu pregunta
7. **Organizar el mapa**: Arrastra los nodos; las posiciones se guardan con la conversación

---

## 🎨 Screenshots

<p align="center">
  <img src="image/main-timeline-compare.png" alt="Pantalla principal con comparación de líneas temporales" width="100%">
</p>

<table>
  <tr>
    <td align="center"><img src="image/landing-login.png" alt="Inicio e inicio de sesión"><br><sub>Inicio / Inicio de sesión</sub></td>
    <td align="center"><img src="image/track-view.png" alt="Vista de pista"><br><sub>Vista de pista de solo lectura</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="image/connected-memory.png" alt="Memoria conectada"><br><sub>Memoria conectada</sub></td>
    <td align="center"><img src="image/branching-map.png" alt="Mapa de ramas"><br><sub>Mapa de ramas</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="image/model-select.png" alt="Selección de modelo"><br><sub>Selección de modelo</sub></td>
    <td align="center"><img src="image/api-key-settings.png" alt="Ajustes de clave de API"><br><sub>Ajustes de la clave de Gemini</sub></td>
  </tr>
</table>

---

## 📝 License

MIT License. Consulta [LICENSE](LICENSE) para más detalles.

| 👤 Developer | ✉️ Email |
|:---:|:---:|
| Zanviq | zanviq.dev@gmail.com |
