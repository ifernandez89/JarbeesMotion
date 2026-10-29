# CHANGELOG - JarBees Mobile

## [v2.0.0-motion] - 2026-10-29

### 🖱️ **JarBees Motion — Control Remoto de Windows desde Android**

**Nueva funcionalidad crítica**: Control completo de mouse y teclado de Windows desde dispositivos móviles Android a través de la red local.

#### 🏗️ Arquitectura del Sistema

**PWA (Frontend)**:
- Nueva ruta `/motion` con interfaz táctil de trackpad y teclado virtual
- Cliente WebSocket seguro (WSS) con reconexión automática
- Protocolo de mensajes versionado con validación estricta
- Sistema de emparejamiento con código de 6 dígitos
- Indicadores visuales de estado de conexión y latencia

**Windows Bridge (Aplicación C#/.NET)**:
- Servidor WebSocket seguro (WSS) con certificados autofirmados para red local
- Integración con Win32 API `SendInput` para control de mouse/teclado
- Sistema de autenticación basado en códigos temporales
- Liberación automática de teclas/botones ante desconexión
- Ventana de control con estado visible y botón de emergencia
- Límites de frecuencia y validación de mensajes
- Sesión única: un dispositivo a la vez

#### 🖱️ Control de Mouse

**Trackpad Táctil**:
- Movimiento relativo (como trackpad de laptop)
- Zona de desplazamiento táctil con retroalimentación visual
- Botones independientes para clic izquierdo y derecho
- Scroll vertical y horizontal
- Sensibilidad configurable
- Soporte para gestos de arrastre

**Protocolo de Mensajes**:
```typescript
mouse.move    → Desplazar cursor (deltas relativos)
mouse.button  → Presionar/soltar botón (left/right/middle)
mouse.scroll  → Rueda vertical/horizontal
```

#### ⌨️ Control de Teclado

**Teclado Virtual Básico**:
- Entrada de texto completo (caracteres Unicode)
- Teclas especiales: Enter, Escape, Tab, Backspace, Delete
- Modificadores: Shift, Ctrl, Alt, Win
- Teclas de función: F1-F12
- Flechas de navegación
- Liberación segura de todas las teclas ante desconexión

**Protocolo de Mensajes**:
```typescript
keyboard.text → Escribir texto (Unicode)
keyboard.key  → Presionar/liberar tecla física
```

#### 🔐 Seguridad y Conexión

**Emparejamiento**:
- Código de 6 dígitos generado en Windows Bridge
- Validación de origen (Origin header)
- Token de sesión con caducidad configurable
- Límite de intentos fallidos

**Seguridad Crítica**:
- Liberación inmediata de teclas/botones si se pierde conexión
- Botón de parada de emergencia en Windows (funciona sin conexión)
- Bridge limitado a red local, nunca expuesto a Internet
- Validación estricta de tipos, rangos y frecuencia de mensajes
- Sesión única: segunda conexión rechazada mientras existe sesión activa

**Conectividad**:
- WebSocket seguro (WSS) con certificado autofirmado
- Reconexión automática con backoff exponencial
- Heartbeat (ping/pong) cada 10 segundos
- Medición de latencia en tiempo real
- Indicadores visuales: 🟢 Conectado / 🟡 Conectando / 🔴 Desconectado

#### 📊 Protocolo de Comunicación V1

**Estructura Base**:
```json
{
  "version": "1.0",
  "type": "mouse.move | mouse.button | keyboard.text | keyboard.key | session.* | ping",
  "timestamp": 1730188800000,
  "payload": { /* específico del tipo */ }
}
```

**Validaciones**:
- Versión de protocolo obligatoria
- Timestamps para detección de mensajes obsoletos
- Límites de desplazamiento por mensaje (mouse: ±500px)
- Límites de longitud de texto (keyboard: 1000 caracteres)
- Frecuencia máxima: 60 mensajes/segundo
- Rechazo de mensajes malformados o fuera de secuencia

#### 🎨 Interfaz de Usuario

**Pantalla de Conexión**:
- Input para código de emparejamiento
- Estado del Bridge (disponible/ocupado/offline)
- Instrucciones de configuración
- Botón de ayuda con troubleshooting

**Pantalla de Control**:
- Trackpad táctil de pantalla completa
- Barra inferior con botones de clic izq/der
- Indicador de latencia en tiempo real
- Botón de desconexión
- Acceso rápido al teclado virtual
- Feedback háptico en acciones

**Teclado Virtual**:
- Diseño estándar QWERTY
- Teclas especiales organizadas por función
- Indicadores visuales de teclas presionadas
- Modo compacto y expandido

#### 🔧 Windows Bridge - Características Técnicas

**Tecnología**:
- .NET 8.0 / C# 12
- WebSocketSharp para servidor WSS
- Win32 API (user32.dll) para SendInput
- Certificado autofirmado generado en primera ejecución

**Validaciones de Seguridad**:
- Verificación de proceso en primer plano (no UAC/escritorio seguro)
- Límites de desplazamiento absoluto (dentro de pantalla)
- Lista blanca de teclas permitidas
- Rechazo de combinaciones destructivas
- Log de eventos con rotación

**Configuración**:
- Puerto WSS configurable (default: 8443)
- Timeout de sesión (default: 30 minutos)
- Longitud de código de emparejamiento (default: 6 dígitos)
- Sensibilidad de mouse (multiplicador configurable)

#### 📱 Compatibilidad

**PWA (Móvil)**:
- Android 8.0+ (Chrome, Edge, Firefox)
- iOS 15.4+ (Safari con limitaciones de WSS)
- Cualquier navegador moderno con soporte WebSocket

**Windows Bridge**:
- Windows 10 1809+ (October 2018 Update)
- Windows 11 (todas las versiones)
- .NET 8.0 Runtime requerido
- Permisos de firewall para puerto WSS

#### 🚀 Instalación y Uso

**PWA**:
1. Acceder a GitHub Pages: `https://[usuario].github.io/JarbeesMotion/`
2. Instalar como PWA desde el menú del navegador
3. Abrir `/motion` desde el menú principal

**Windows Bridge**:
1. Descargar ejecutable desde Releases
2. Ejecutar como administrador (primera vez, para certificado)
3. Permitir en Firewall de Windows cuando se solicite
4. Bridge genera código de 6 dígitos en pantalla

**Emparejamiento**:
1. Asegurar que móvil y PC están en la misma red WiFi
2. Iniciar Bridge en Windows
3. Copiar código de 6 dígitos mostrado
4. En PWA, ir a `/motion` e ingresar código
5. ¡Listo! Usar el trackpad para mover el cursor

#### 📈 Mediciones de Rendimiento

**Latencia Objetivo** (a medir en Fase 0):
- Red local WiFi 5GHz: < 50ms (p95)
- Red local WiFi 2.4GHz: < 100ms (p95)
- Medición en tiempo real en PWA

**Frecuencia de Actualización**:
- Mouse: hasta 60 eventos/segundo
- Heartbeat: cada 10 segundos
- Reconexión: backoff exponencial (1s, 2s, 4s, 8s, max 30s)

#### ⚠️ Limitaciones Conocidas

**Windows Bridge**:
- No funciona en pantallas UAC (User Account Control)
- No funciona en escritorio seguro (Ctrl+Alt+Del)
- No funciona en pantalla de inicio de sesión de Windows
- Requiere que una sesión de usuario esté activa
- Una sesión a la vez (no multiusuario)

**Conectividad**:
- Requiere misma red local (no funciona por Internet sin VPN)
- Certificado autofirmado requiere aceptación manual en algunos navegadores
- Redes de invitados con aislamiento de clientes bloquean la conexión
- Firewall de Windows debe permitir el puerto configurado

#### 🛠️ Troubleshooting

**Problemas Comunes**:
1. **"No se puede conectar al Bridge"**
   - Verificar que Bridge está ejecutándose
   - Verificar misma red WiFi
   - Verificar firewall de Windows
   - Probar con IP en lugar de hostname

2. **"Certificado no válido"**
   - Primera conexión requiere aceptación manual del certificado
   - En Chrome Android: "Avanzado" → "Continuar de todos modos"

3. **"Latencia muy alta"**
   - Preferir WiFi 5GHz si está disponible
   - Acercar dispositivo al router
   - Cerrar aplicaciones que consuman red en background

4. **"El cursor no se mueve"**
   - Verificar que no hay ventana UAC activa
   - Verificar que sesión de Windows está desbloqueada
   - Reiniciar Bridge

#### 🔮 Roadmap

**Fase Actual** (v2.0.0):
- ✅ Mouse táctil con trackpad relativo
- ✅ Teclado virtual básico
- ✅ Emparejamiento seguro
- ✅ Liberación segura ante desconexión

**Próximas Fases**:
- 🔲 Control por giroscopio (Fase 4)
- 🔲 Soporte para smartwatch (Fase posterior)
- 🔲 Control de Auren (drone androide) con misma arquitectura
- 🔲 Múltiples sesiones simultáneas
- 🔲 Macros y atajos personalizables

#### 📦 Archivos Nuevos

**PWA (Frontend)**:
- `src/app/motion/page.tsx` - Página principal del controlador
- `src/components/motion/MotionController.tsx` - Componente principal
- `src/components/motion/Trackpad.tsx` - Trackpad táctil
- `src/components/motion/VirtualKeyboard.tsx` - Teclado virtual
- `src/components/motion/ConnectionStatus.tsx` - Indicadores de conexión
- `src/components/motion/PairingScreen.tsx` - Pantalla de emparejamiento
- `src/lib/motion/motionClient.ts` - Cliente WebSocket
- `src/lib/motion/protocol.ts` - Tipos y validaciones de protocolo
- `src/types/motion.ts` - Definiciones TypeScript

**Windows Bridge**:
- `bridge/JarbeesMotionBridge.sln` - Solución Visual Studio
- `bridge/JarbeesMotionBridge/Program.cs` - Punto de entrada
- `bridge/JarbeesMotionBridge/MotionServer.cs` - Servidor WebSocket
- `bridge/JarbeesMotionBridge/InputController.cs` - SendInput wrapper
- `bridge/JarbeesMotionBridge/Protocol.cs` - Tipos de protocolo
- `bridge/JarbeesMotionBridge/SessionManager.cs` - Manejo de sesiones
- `bridge/JarbeesMotionBridge/CertificateManager.cs` - Gestión de certificados

**Documentación**:
- `docs/MOTION_SETUP.md` - Guía de instalación completa
- `docs/MOTION_PROTOCOL.md` - Especificación del protocolo
- `docs/MOTION_SECURITY.md` - Consideraciones de seguridad
- `docs/MOTION_TROUBLESHOOTING.md` - Solución de problemas

#### 🧪 Verification Status

**⚠️ PENDING REAL-WORLD TESTING**

This release represents a complete implementation but has not yet been verified on actual hardware. Required validation:

**Phase 0 - Compilation & Startup:**
- [ ] Bridge compiles without errors on Windows
- [ ] .NET 8.0 runtime compatibility confirmed
- [ ] Certificate generation successful
- [ ] WebSocket server starts on port 8443
- [ ] PWA builds and deploys correctly

**Phase 1 - Network Connectivity:**
- [ ] WSS connection established from Moto G(7) Plus
- [ ] Certificate accepted/trusted on mobile browser
- [ ] Pairing code exchange works
- [ ] Session authentication successful
- [ ] Heartbeat/ping-pong maintains connection

**Phase 2 - Input Control:**
- [ ] Mouse cursor moves from trackpad gestures
- [ ] Left/right click buttons function
- [ ] Scroll (two-finger) works
- [ ] Text input reaches Windows
- [ ] Special keys (Enter, Escape, etc.) work
- [ ] Modifier keys (Shift, Ctrl, Alt) function

**Phase 3 - Safety & Security:**
- [ ] Disconnect releases all pressed keys/buttons
- [ ] WiFi loss triggers automatic cleanup
- [ ] Emergency stop button works locally
- [ ] UAC windows correctly refuse control
- [ ] Second connection rejected during active session
- [ ] Session timeout enforces correctly

**Phase 4 - Performance:**
- [ ] Latency measured (median & p95)
- [ ] No "stuck" inputs after crash/disconnect
- [ ] Reconnection works after temporary failure
- [ ] Sensitivity adjustment effective

**Next Steps:**
1. Compile Bridge on Windows
2. Build and deploy PWA
3. Test on Moto G(7) Plus on same WiFi
4. Document any issues or required adjustments
5. Update this verification checklist

See [docs/implementation_plan.md](docs/implementation_plan.md) for detailed test procedures.

---

## [v1.1.0-experimental] - 2026-08-20

### 🌐 Mobile → Core Protocol (`MobileGateway V1`)
- **Protocolo de Comunicación Mobile <-> Core**:
  - Implementación del servicio `src/lib/jarbees-mobile/services/mobileGateway.api.ts` para enviar intenciones estructuradas al backend NestJS (`POST /api/mobile/v1/command` y `GET /api/mobile/v1/capabilities`).
  - Respeto estricto de las reglas de workspace (`AGENTS.md`): Resolución de base URL mediante `NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"` y política de header `"ngrok-skip-browser-warning": "69420"` solo en URLs que contienen `ngrok`.
  - Conexión directa abierta sin tokens para paridad con el frontend existente.
- **Detección de Estado de la PC en Tiempo Real (`CoreHealthStatus`)**:
  - Health check periódico (cada 20s) y manual hacia `GET /api/mobile/v1/health`.
  - Badge interactivo en la cabecera móvil: `🟢 Core 42ms` / `🔴 Core Offline` con reintento instantáneo.
- **CoreHandoffProvider**:
  - Nuevo proveedor de inferencia que delega comandos al backend Core cuando el usuario lo selecciona o cuando un comando requiere herramientas de la PC (`OPEN_APP`, `CALCULATE`, `GET_SYSTEM_STATUS`).
  - Fallback automático y transparente al motor local si la PC en casa está apagada.
- **Arquitectura de Referencia para NestJS Core**:
  - Módulo completo disponible en `docs/core-mobile-gateway/` (`mobile-gateway.controller.ts`, `mobile-gateway.service.ts`, `mobile-gateway.module.ts`, `README_CORE_SETUP.md`) listo para incorporar al Core de casa al encender la PC.
- **Corrección de GitHub Pages Deploy**:
  - Eliminada inyección de variables sensibles en `deploy.yml` que provocaba falsos positivos en el escáner de seguridad de GitHub.

---

## [v1.0.0-experimental] - 2026-08-20

### 🐝 Naturaleza y Origen del Proyecto
- **Tipo de Proyecto**: **JarBees Mobile** — Asistente inteligente y controlador de dispositivo en el borde (*Edge AI Command Interpreter*), diseñado para ejecutarse localmente en dispositivos móviles (e.g. Android / Moto G5 Plus / APK con `llama.cpp` + GGUF).
- **Origen**: Este proyecto fue separado y derivado del repositorio original (`jarbees front / products crud frd`) para evolucionar como una aplicación móvil experimental independiente centrada en el procesamiento local de lenguaje natural y ejecución determinista de acciones.
- **Preservación de Vistas Legadas**: Todas las vistas y módulos originales de productos y preguntas (`/products`, `/preguntas/new`, `/reader`) se mantienen intactos en la base de código y permanecen accesibles por URL para futuras integraciones más amplias.

---

### 🚀 Nuevas Capacidades Implementadas (V1 de JarBees Mobile)

#### 1. 🧠 Intent & Command Engine (`Qwen2.5-0.5B-Instruct` & Transformers.js WebGPU)
- Integración con el modelo local ultraligero (`zarigata/Qwen2.5-0.5B-Instruct:CRAZYMODE` / GGUF) y `@huggingface/transformers` con `onnx-community/Qwen2.5-0.5B-Instruct` (Q4 ONNX) en el navegador.
- Salida estricta en formato JSON con validación, extracción por Regex y sanitización de dominios (`device`, `audio`, `media`, `context`, `calculator`, `timer`, `connectivity`, `location`, `capabilities`, `jarbees`, `handoff`, `core`).
- Arquitectura desacoplada: El LLM propone la intención estructurada y el `Command Dispatcher` valida y ejecuta de forma determinista y segura en el dispositivo.

#### 2. 🎤 Entrada por Voz (Push-to-Talk y Tap-to-Talk)
- Botón central `[ HABLAR ]` con captura vía Web Speech API / micrófono.
- Detección de actividad de voz (*VAD de silencio ~1.4s*) para procesar automáticamente al terminar de hablar sin necesidad de un segundo toque.

#### 3. ⌨️ Entrada por Texto Directa
- Botón y barra de entrada rápida `[ ESCRIBIR UN COMANDO ]` siempre disponible para pruebas y depuración del intérprete sin depender del micrófono.

#### 4. 📱 Apertura de Aplicaciones
- Ejecución de intenciones de aplicaciones nativas y web:
  - `OPEN_CAMERA`: Abre la cámara del dispositivo con visor interactivo.
  - `OPEN_CALCULATOR`: Inicia la interfaz de calculadora.
  - `OPEN_BROWSER`: Abre el navegador web.
  - `OPEN_SETTINGS`: Abre el panel de ajustes y configuración.

#### 5. 🔊 Control de Audio y Reproducción de Medios
- Acciones de volumen relativas y absolutas: `VOLUME_UP`, `VOLUME_DOWN`, `SET_VOLUME`, `MUTE`, `SILENT`, `VIBRATE`.
- Control de música: `MEDIA_PLAY`, `MEDIA_PAUSE`, `MEDIA_NEXT`, `MEDIA_PREVIOUS`.
- Interpretación contextual: Comandos ambiguos como *"Bajalo un poco"* infieren automáticamente control de volumen musical según el estado activo de reproducción.

#### 6. 🔋 Consultas de Contexto del Teléfono (`DeviceContext`)
- Respuestas precisas a consultas individuales sobre el estado del hardware:
  - *"¿Cuánta batería tengo?"* → Nivel % y estado de carga.
  - *"¿Estoy cargando?"* → Estado de conexión eléctrica.
  - *"¿Tengo auriculares conectados?"* → Detección de salida de audio.
  - *"¿Qué hora es?"* → Hora local del dispositivo.

#### 7. 📊 Resumen Integral de "Estado del Dispositivo"
- Comando *"JarBees, ¿cómo está mi teléfono?"* genera una tarjeta visual estructurada con:
  - 🔋 Batería y estado de carga
  - 🔊 Nivel de volumen
  - 🎧 Conexión de auriculares
  - 🎵 Estado de reproducción musical
  - 📶 Estado de red (WiFi / Móvil / Offline)
  - 📱 Estado de pantalla
  - 🕐 Hora local

#### 8. 🧮 Cálculos Matemáticos Deterministas
- Interpretación de lenguaje natural hacia expresiones matemáticas estructuradas.
- Evaluador seguro determinista para operaciones aritméticas y porcentajes:
  - *"¿Cuánto es 1837 por 47?"* → `1837 * 47 = 86339`
  - *"Calculá cuánto me queda si descuento 21% de 1837"* → `1837 - 21% = 1451.23`
  - *"Si tengo 500 y gasto 137, ¿cuánto me queda?"* → `500 - 137 = 363`

#### 9. ⏱️ Temporizadores en Tiempo Real
- Creación, listado y cancelación de temporizadores:
  - *"Poneme un temporizador de 18 minutos"* → Crea temporizador activo con widget y cuenta regresiva en segundos.
  - *"Cancelá los temporizadores"* → Limpieza de temporizadores activos.

#### 10. 📋 Capability Discovery
- Comando *"¿Qué podés hacer?"* o *"¿Qué puedo hacer sin Internet?"* genera tarjetas interactivas clasificando capacidades locales vs. remotas.

#### 11. 📶 Conectividad y Red
- Consultas sobre estado de WiFi, Bluetooth e Internet.

#### 12. 📍 Ubicación y GPS
- Consulta *"¿Dónde estoy?"* lee coordenadas reales del dispositivo.

#### 13. 📷 Integración con Cámara
- Lanzamiento de visor de cámara con acceso a `getUserMedia`.

#### 14. 🌐 Búsqueda Web Asistida
- *"Buscá perros en Internet"* abre el navegador con la consulta construida.

#### 15. 🔐 Sistema de Confirmaciones y Seguridad
- Diferenciación entre acciones inmediatas seguras y acciones con confirmación requerida.

#### 16. 🛠️ Developer Mode & Live Context Simulator
- Drawer lateral completo con:
  - Selector de motores (`Server`, `WebGPU`, `Core Gateway`, `Rule Fallback`).
  - Telemetría en vivo (latencia en `ms`, confianza del modelo).
  - Simulador de estado de hardware (sliders de batería, volumen, toggles de auriculares y música).
  - Inspector y copiado rápido de JSON estructurado generado por el LLM.
