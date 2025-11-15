# 💬 Prueba Técnica – Chat en Tiempo Real (Next.js + Supabase)

Este proyecto es una aplicación de chat en tiempo real desarrollada como parte de una **prueba técnica Full Stack**.  
La aplicación permite:

- Autenticación de usuarios (registro + login)
- Chats directos entre dos usuarios
- Chats grupales
- Actualización de nombre del grupo
- Lista de conversaciones ordenada por últimos mensajes
- Notificaciones en tiempo real
- Vista responsiva (web + mobile)
- Manejo de mensajes leídos
- Eliminacion de chats
---

## 🚀 Tecnologías utilizadas

### **Frontend**
- Next.js - (App Router)
- React.js
- TailwindCSS
- Supabase JS Client
- Lucide Icons

### **Backend (como servicio)**
- Supabase:
  - Authentication
  - Realtime (Postgres Changes)
  - Database (PostgreSQL)
  - Row Level Security

---

## 🏗️ Arquitectura del sistema

La app está construida con una arquitectura **clean y modular**, conectando el frontend con Supabase mediante:

- **Contexto global**: manejo de usuario autenticado
- **Componentes desacoplados** (`Sidebar`, `ChatWindow`, `MessageBubble`)
- **Suscripciones en tiempo real** por conversación
- **Estructura de tablas pensada para escalabilidad**:
  - `profiles`
  - `conversations`
  - `conversation_members`
  - `messages`

---

## ✨ Funcionalidades principales

### 🔐 **Autenticación**
- Registro con email + password
- Login
- Creación automática de perfil (tabla *profiles*)

### 💬 **Chats**
- Chat directo 1 a 1
- Chats grupales
- Edición del nombre del grupo
- Eliminacion de chat
- Reaparición automática cuando llega un nuevo mensaje

### ⚡ **Mensajes**
- Envío en tiempo real usando **Supabase Realtime**
- Auto-scroll al último mensaje
- Marca como leído al abrir conversación
- Filtro inteligente por `last_cleared_at` para limpiar historial

### 📱 **Responsividad**
- Sidebar fijo en desktop
- Sidebar tipo *slide-over* en mobile con botón "Menú"
- Diseño inspirado en WhatsApp Web

---

## 📦 Instalación y ejecución en local

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/Martinbordon36/prueba-tecnica-supabase-chat.git
cd prueba-tecnica-supabase-chat
npm install 

## Crear un archivo .env.local con las siguentes credenciales - el valor de las variables se enviara por email .

- NEXT_PUBLIC_SUPABASE_URL=
- NEXT_PUBLIC_SUPABASE_ANON_KEY=

#Luego ejecutamos la app

npm run dev

#la app corre en el puerto: 3000 

➡️ http://localhost:3000

# Para visualizarla del celular ingresamos en la ip de nuestra compu (ipconfig - ifconfig , buscamos la ip correspondiente y le agregamos el puerto :3000)

#URL FUNCIONANDO

https://prueba-tecnica-supabase-chat.vercel.app/login


