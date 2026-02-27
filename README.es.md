<div align="center">

# 🌳 Conversation-Tree

**Explora las conversaciones como un árbol**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[English](./README.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [中文](./README.zh.md) | **Español**

<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Powered by Gemini"/>

</div>

---

## 💭 Nota del Desarrollador

> *"Una conversación no es un simple registro lineal, sino un árbol de posibilidades que se ramifica infinitamente."*

En nuestra vida diaria, los grandes modelos de lenguaje nos proporcionan una gran cantidad de conocimientos. Como alguien naturalmente curioso, a menudo le hago muchas preguntas a Google AI en lugar de usar simplemente la Búsqueda de Google. Casi todas las plataformas de IA utilizan un formato de *"sala de chat"*. Si bien esto brinda una gran oportunidad para hacerle preguntas profundas a una IA sobre un solo tema, sentí que faltaba algo, y esa pieza faltante se convirtió en un inconveniente.

Específicamente, la IA a menudo intenta proporcionar mucha información a la vez. Por ejemplo, si explica las cosas usando listas numeradas como 1, 2 y 3, podría hacer preguntas de seguimiento sobre el punto 1, pero luego me resultaría difícil volver al punto 2 más tarde.

Anteriormente, para compensar la falta de memoria a largo plazo de la IA, se me ocurrió y construí un "Sistema de Memoria Semántica Jerárquica". Ampliando esa idea, quería crear una interfaz de chat para este proyecto donde **los recuerdos estén separados por pistas, lo que te permite conversar dentro del contexto de memoria específico que desees.**

Así es como planeé este proyecto.
Espero que muchas personas encuentren útil esta función. Ten en cuenta que este proyecto no está alojado como un servicio.

---

## ✨ Características

### 🌳 Ramificación Multiverso (Multiverse Branching)
- Crea nuevas ramas de conversación a partir de cualquier mensaje
- Todas las ramas mantienen un contexto independiente
- Función "Edit & Fork" para modificar preguntas pasadas y explorar nuevos caminos

### 🔗 Conexión de Memoria (Context Injection)
- Comparte memoria entre diferentes rutas de conversación
- Inyecta el contexto de la Pista A en la Pista B
- Referencia cruzada de ideas complejas

### 🗺️ Mapa del Universo Interactivo
- Visualización de conversaciones en tiempo real impulsada por D3.js
- Ajusta libremente las posiciones de los nodos arrastrándolos
- Explora toda la estructura de la conversación con zoom/panorámica
- Centrado automático en la posición actual

### ⚡ Integración con Gemini 3
- Soporte para los modelos Google Gemini 3 Flash/Pro
- Respuestas en streaming en tiempo real
- Archivos adjuntos de imágenes y conversaciones multimodales

### 📊 Modo de Comparación de Pistas
- Selecciona múltiples rutas de conversación simultáneamente
- La IA analiza y compara las pistas seleccionadas
- Explora líneas de tiempo paralelas

---

## 🚀 Empezando

### Requisitos previos
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/your-username/Conversation-Tree.git
cd Conversation-Tree

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Construcción

```bash
# Construcción para producción
npm run build

# Vista previa
npm run preview
```

### Configuración de la Clave API

1. Ingresa tu clave API de Gemini en la página de inicio (Landing Page) al iniciar la aplicación
2. La clave se almacena de forma segura en el almacenamiento local del navegador
3. Se carga automáticamente en visitas posteriores

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | React 19, TypeScript |
| **Visualización** | D3.js 7 |
| **Estilos** | Tailwind CSS |
| **IA** | Google Gemini API |
| **Construcción** | Vite |
| **Markdown** | react-markdown |

---

## 📁 Estructura del Proyecto

```
conversation-tree/
├── 📂 components/
│   ├── ChatInterface.tsx    # Interfaz de chat y renderizado de mensajes
│   ├── UniverseMap.tsx      # Visualización de conversaciones basada en D3.js
│   └── LandingPage.tsx      # Entrada de clave API e inicio
├── 📂 services/
│   ├── geminiService.ts     # Integración con la API de Gemini
│   └── storageService.ts    # Gestión de almacenamiento local/navegador
├── 📂 utils/
│   └── graphUtils.ts        # Recorrido de grafos y construcción de árboles
├── 📂 conversation-tree-data/     # Datos de sesión (generados automáticamente)
├── App.tsx                  # Componente principal de la aplicación
├── types.ts                 # Definiciones de tipos de TypeScript
└── vite.config.ts           # Configuración de Vite y plugin de API
```

---

## 💡 Cómo usar

1. **Iniciar Nuevo Chat**: Haz clic en "New Chat" en la barra lateral izquierda
2. **Crear Rama**: Haz clic en un nodo en el mapa del universo → Selecciona "Focus / View" → Escribe un nuevo mensaje
3. **Conectar Memoria**: Haz clic en el nodo → "Connect Memory" → Selecciona el nodo de destino
4. **Comparar Pistas**: Haz clic en el icono de GitMerge en la parte inferior → Selecciona los nodos hoja a comparar → Ingresa la pregunta
5. **Ajustar Diseño**: Arrastra los nodos a las posiciones deseadas (guardado automático)

---

## 🎨 Capturas de pantalla

<div align="center">
<i>Aquí hay algunas capturas de pantalla de ejemplo simples.</i>

![Screenshot](image/LandingPage.png)

<table>
  <tr>
    <td><img src="image/Chat_1.png" width="400"/></td>
    <td><img src="image/Chat_2.png" width="400"/></td>
  </tr>
  <tr>
    <td><img src="image/Chat_3.png" width="400"/></td>
    <td><img src="image/Chat_4.png" width="400"/></td>
  </tr>
</table>
</div>

---

## 🤝 Contribuyendo

¡Las contribuciones siempre son bienvenidas! Se agradecen los informes de errores, sugerencias de funciones y PRs.

1. Haz un Fork de este repositorio
2. Crea una rama de características (`git checkout -b feature/amazing-feature`)
3. Confirma tus cambios (`git commit -m 'Add amazing feature'`)
4. Empuja a la rama (`git push origin feature/amazing-feature`)
5. Crea un Pull Request

---

## 📝 Licencia

Este proyecto se distribuye bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**⭐ ¡Si este proyecto te ayudó, por favor dale una Estrella! ⭐**

</div>

> Creo que sería increíblemente útil si los desarrolladores de startups de IA como Google, OpenAI, Claude, XAI, Grok y otros agregaran esta función.

<div align="center">

| 👤 **Desarrollador** | ✉️ **Correo electrónico** |
|:---:|:---:|
| Zanviq | Zanviq.dev@gmail.com |

</div>
