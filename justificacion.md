---
layout: default
title: Justificación tecnológica
nav_order: 3
---

# 🛠️ Justificación tecnológica

En esta sección documentamos las decisiones técnicas tomadas para la construcción de la PWA de Control de Accesos, asegurando que el personal de seguridad cuente con una herramienta rápida, estable y compatible con sus dispositivos de trabajo.

## Lenguajes, Frameworks y Herramientas

La prioridad para el entorno de empleados fue la integración con hardware (cámaras) y la velocidad de respuesta en la validación:

* **React + Vite:** Utilizamos React por su ecosistema maduro basado en componentes (JSX), lo que nos permite reutilizar elementos de la interfaz de manera modular. Optamos por **Vite** debido a su velocidad de compilación ultrarrápida y recarga en caliente (HMR), agilizando drásticamente el ciclo de desarrollo.
* **JavaScript y CSS Modular:** Mantenemos JavaScript puro combinado con CSS tradicional (mediante variables y tokens en `tokens.css` y `control-theme.css`), facilitando la personalización de "marca blanca" requerida por los distintos clubes.
* **Integración de cámara (Escáner QR):** La aplicación web se comunica mediante APIs nativas del navegador para utilizar la cámara del celular o tablet como lector de códigos de barras bidimensionales, evitando la compra de hardware de escaneo dedicado.
* **Progressive Web App (PWA):** La app está configurada para instalarse como PWA (`pwa-192x192.png`, `pwa-512x512.png`), permitiendo a los guardias iniciar el control desde un ícono en su pantalla de inicio como si fuera una aplicación nativa.

## Calidad y Testing

* **Jest:** Nuestro entorno principal de pruebas unitarias (`jest.config.cjs` y archivos `*.test.js`), que asegura la correcta inicialización del lector y las lógicas de validación visual del estado del socio.
* **ESLint:** Configurado (`eslint.config.js`) para mantener un estándar de codificación limpio, previniendo errores de sintaxis a nivel de todo el equipo.

## Integración y Despliegue (CI/CD)

* **Vercel:** La plataforma elegida para el despliegue automático del frontend. Ofrece una CDN global y optimización de caché, asegurando que el personal siempre interactúe con la versión más reciente.
* **GitHub Actions:** Contamos con flujos automatizados (`frontend-tests.yml`) para asegurar que todo el código nuevo apruebe las pruebas establecidas antes de fusionarse a la rama principal.
