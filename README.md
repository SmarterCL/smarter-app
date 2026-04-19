<div align="center">
<img width="1200" height="475" alt="SmarterOS Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# SmarterOS 🌿
### Gestión de Impacto Ambiental & Recompensas Inteligentes
</div>

---

**SmarterOS** es una plataforma móvil diseñada para incentivar hábitos sostenibles. Los usuarios pueden escanear productos reciclables, ganar "Ecocupones" y canjearlos por productos orgánicos en una tienda integrada, todo mientras visualizan su impacto real en el planeta.

View your app in AI Studio: [https://ai.studio/apps/319923cc-5a93-4b00-a256-0a803655f550](https://ai.studio/apps/319923cc-5a93-4b00-a256-0a803655f550)

## ✨ Características Principales

- 📊 **Panel de Impacto**: Visualización en tiempo real del CO2 ahorrado y progreso semanal mediante gráficas dinámicas.
- 🛒 **Eco-Canasta**: Tienda de productos orgánicos y locales con sistema de carrito y checkout seguro.
- 🔍 **Escáner de Ecocupones**: Integración de cámara para validación de beneficios ambientales (Simulado).
- 🔐 **Autenticación Real**: Login seguro con Google mediante **Supabase Auth**.
- 📱 **Nativo Android**: Distribuido como App Nativa vía **Capacitor**.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Estilos**: Tailwind CSS 4.0
- **Backend**: Supabase (Auth, Database)
- **Mobile**: Capacitor (Android)

## 🚀 Guía de Inicio Rápido

1. **Instalar dependencias**: `npm install`
2. **Configurar variables**: Crea un archivo `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. **Correr localmente**: `npm run dev`

## 📱 Mobile (Android)

Para generar la APK y ejecutar en un dispositivo real:

1. `npm run build`
2. `npx cap sync android`
3. `export JAVA_HOME=/Users/mac/Library/Java/JavaVirtualMachines/jbr-21.0.10/Contents/Home`
4. `./android/gradlew -p android assembleDebug`

## 🔐 OAuth Redirect URLs

Añade estas URLs a tu configuración de Supabase:
- `https://ais-dev-bcynpn3jo6lbjvlmoyzaqs-592502038801.us-east1.run.app`
- `https://localhost`

---
<div align="center">
Desarrollado con ❤️ para un futuro más verde.
</div>
