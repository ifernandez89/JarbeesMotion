# JarBees Motion — plan del Windows Motion Bridge

## Resumen ejecutivo

**Estado:** base parcial; el plan está listo para convertirse en una
especificación de implementación, siempre que la Fase 0 confirme primero la
conectividad segura real.

**Tres incorporaciones prioritarias:**
1. **Contrato de protocolo versionado** con tipos de mensajes y límites
   explícitos.
2. **Parada segura garantizada**, incluida la liberación de teclas y botones
   ante desconexiones.
3. **Pruebas de latencia y usabilidad**, antes de ampliar el alcance a sensores
   y Auren.

**Decisión técnica:** mantener C#/.NET como candidato principal para el Bridge
distribuible, con una prueba mínima de SendInput antes de comprometerse
definitivamente con esa elección.

**No empezar todavía con:** smartwatch ni manipulación 3D avanzada. Primero
conseguir que el Moto mueva el cursor de Windows de forma fiable; ese logro ya
sería una primera herramienta útil de JarBees y una base técnica reutilizable
para lo que viene después.

## Evaluación de preparación

**Conclusión: base parcial; aún no estamos listos para controlar Windows.**
Hay una PWA y una interfaz móvil que se pueden reutilizar, pero el camino de
entrada completo —gestos, protocolo, emparejamiento, receptor Windows e
inyección de entrada— todavía no existe.

| Área | Estado observado | Consecuencia |
|---|---|---|
| PWA y UI móvil | Implementadas para el asistente JarBees Mobile | Reutilizar la base, pero diseñar una interfaz de trackpad específica |
| Movimiento y clics | No se encontró una interfaz de mouse | Hay que crearla |
| Teclado remoto | No se encontró un teclado que controle Windows | Hay que crear el cliente y definir el protocolo |
| Transporte | El Core usa HTTP; no se encontró WebSocket | Crear un canal independiente PWA–Bridge |
| Receptor Windows | No existe en este repositorio | Crear y distribuir una aplicación separada para Windows |
| Entrada de Windows | No hay integración con `SendInput` ni equivalente | Implementarla detrás de una capa controlada del Bridge |
| Emparejamiento y autorización | No existe para el control de PC | Requisito previo a exponer el Bridge en la LAN |
| Sensores/Auren | Hay contexto móvil simulado y capacidades de navegador; no hay control por orientación conectado al PC | Dejarlo para una fase posterior |
| Publicación PWA | Next.js hace exportación estática; había rutas de otra app y un `basePath` distinto al repositorio | Corregir rutas y validar el deploy antes del enlace con el Bridge |

El gateway HTTP que aparece en `src/lib/jarbees-mobile/services/` conecta el
asistente con JarBees Core; **no** es un receptor de mouse/teclado ni debe
reutilizarse como uno.

## Arquitectura objetivo

```text
Moto G(7) Plus — PWA JarBees Motion
  Trackpad / teclado / estado de conexión
  Emparejamiento y control explícito de sesión
               │
               │ WSS, protocolo versionado y autenticado
               ▼
Windows — JarBees Motion Bridge (proceso independiente)
  Validación de mensajes y límites
  Capa de entrada Windows
  Estado visible, desconexión y parada inmediata
```

La PWA sigue siendo estática. El Bridge debe ejecutarse en la PC y aceptar
conexiones únicamente cuando el usuario lo inicia y autoriza. Mismo Wi-Fi no
garantiza conectividad: el firewall, redes de invitados y el aislamiento de
clientes pueden bloquear tráfico entre dispositivos.

## Decisión técnica recomendada

Mantener Next.js/React en la PWA. Para el Bridge, hacer primero una prueba
pequeña de `SendInput` y WebSocket en Windows antes de fijar la tecnología:

- **C#/.NET es la opción recomendada para el primer Bridge distribuible**:
  Windows ofrece `SendInput` mediante Win32 y C# puede llamarlo con P/Invoke,
  sin desarrollar un driver ni mantener un ejecutable C++.
- **Node.js sigue siendo viable** para el servidor WebSocket, pero Node por sí
  solo no incluye una API para inyectar eventos de Windows. Se necesitaría una
  dependencia nativa compatible, un helper separado o una integración nativa;
  esa dependencia debe probarse y empaquetarse antes de elegir Node para el
  Bridge.

No ejecutar comandos de shell arbitrarios recibidos desde la PWA. El Bridge
debe aceptar exclusivamente acciones explícitas y validadas. No usar Ngrok ni
exponer el Bridge a Internet para este flujo local.

## Riesgos y requisitos previos

### 1. HTTPS/WSS — Resolver antes de construir la UI

**Este es el punto crítico del proyecto.** La PWA publicada en GitHub Pages se
ejecuta bajo HTTPS. El Bridge estará en tu PC y tendrá que ofrecer un canal de
comunicación seguro que el navegador de Android acepte.

**No asumir que:**
- Un certificado autofirmado va a funcionar sin intervención manual.
- Usar la IP local resuelve automáticamente el problema de contenido mixto.
- Todos los navegadores permiten el mismo acceso a la red local.

**Matriz de pruebas obligatoria en Fase 0:**
- PWA publicada en GitHub Pages → Bridge en Windows.
- Moto G(7) Plus → conexión por la IP local de la PC.
- Certificado, autenticación y permisos de red local.
- Rechazo claro si el navegador bloquea la conexión.

**Criterio de salida:** conexión autenticada y bidireccional comprobada desde el
teléfono real, no solo desde localhost o desde las herramientas de desarrollo.

**Si WSS local resulta demasiado engorroso,** evaluar alternativas antes de
invertir tiempo en la interfaz: un pequeño cliente Android nativo o una
aplicación local que sirva también la interfaz desde el propio equipo. No
cambiar de solución sin medir primero la viabilidad.

### 2. Red local y conectividad real

Probar permisos de acceso a dispositivos de la red local, firewall de Windows,
redes de invitados, aislamiento de clientes y cambios de IP. Informar al
usuario si no hay conectividad. Mismo Wi-Fi no garantiza conectividad.

### 3. Autorización y emparejamiento

Mostrar un código de emparejamiento de corta duración, limitar intentos y
exigir aprobación local en Windows. Validar `Origin`, autenticar la sesión y no
incluir secretos en URL, logs o repositorio.

### 4. Control seguro — Contrato de protocolo explícito

Definir qué mensajes puede enviar la PWA y cuáles acepta Windows **antes** de
implementar el Bridge. Esto evita que el proyecto termine dependiendo de
formatos improvisados.

**Estructura de mensaje:**
- Incluir versión del protocolo en todos los mensajes.
- Validaciones estrictas de tipo, rango y frecuencia.
- Separar eventos de estado de eventos de movimiento.

**Tipos de mensaje (referencia conceptual):**

| Mensaje | Función | Validación |
|---------|---------|------------|
| `mouse.move` | Desplazar cursor | Límites de desplazamiento por mensaje |
| `mouse.button` | Presionar o soltar un botón | Botones permitidos y estado coherente |
| `mouse.scroll` | Desplazamiento de rueda | Límites de intensidad |
| `keyboard.text` | Escribir texto | Longitud máxima y caracteres válidos |
| `keyboard.key` | Presionar o liberar una tecla | Lista permitida y liberación segura |
| `session.stop` | Finalizar control | Detener entradas inmediatamente |
| `ping` / `pong` | Comprobar conexión | Tiempo máximo sin respuesta |

**Reglas de protocolo:**
- Los movimientos pueden agruparse o descartarse si llegan demasiado rápido.
- Las pulsaciones y liberaciones de teclas **no deben perderse silenciosamente**.
- Mensajes fuera de orden, malformados o excesivamente frecuentes deben
  rechazarse.

### 5. Seguridad frente a entradas atascadas — Condición central

**Si se pierde la conexión, se liberan todas las teclas y botones que el Bridge
haya presionado.**

Requisitos obligatorios:
- Si vence la sesión, se detiene la inyección de entradas.
- Una segunda conexión no puede tomar el control mientras existe otra sesión
  autorizada.
- El botón de parada debe actuar localmente en Windows, aunque el teléfono haya
  perdido conexión.
- El Bridge debe rechazar mensajes fuera de orden, malformados o excesivamente
  frecuentes.

**Para el primer prototipo:** limitar la sesión a un único teléfono emparejado
y un único cliente controlador. No necesitamos multiusuario todavía.

### 6. Consentimiento y control

Mostrar en Windows cuándo hay una sesión activa y ofrecer una desconexión
inmediata. No iniciar automáticamente el Bridge con Windows en el primer
prototipo.

### 7. Límites de Windows

`SendInput` no evita UAC ni controla de forma fiable escritorios seguros o
pantallas de inicio de sesión; documentar esos límites.

## Plan por fases

### Fase 0 — Viabilidad técnica (HTTPS/WSS + SendInput)

**Objetivo:** confirmar que la arquitectura propuesta es técnicamente viable
antes de construir cualquier interfaz.

**Tareas obligatorias:**

1. **Prueba mínima de `SendInput`** en Windows:
   - C#/.NET con P/Invoke a Win32.
   - Comparar con alternativa de Node.js (requiere dependencia nativa).
   - Elegir runtime del Bridge basándose en compatibilidad y distribución.

2. **Prueba de conectividad HTTPS/WSS real:**
   - PWA publicada en GitHub Pages (HTTPS).
   - Bridge WSS en Windows (IP local de la PC).
   - Moto G(7) Plus conectado por Wi-Fi.
   - Certificado que el navegador acepte (autofirmado + instalación manual, o
     mDNS + `.local`, o certificado válido).

3. **Definir contrato de protocolo:**
   - Versión de protocolo.
   - Tipos de mensaje con validaciones explícitas (ver sección Riesgos #4).
   - Límites de frecuencia, tamaño y secuencia.
   - Emparejamiento, caducidad de sesión y desconexión.
   - Liberación segura de teclas/botones.

**Criterio de salida:**
- Conexión autenticada y bidireccional comprobada desde el teléfono real (no
  desde localhost ni dev tools).
- Decisión documentada sobre runtime y estrategia TLS/WSS.
- Contrato de protocolo escrito y validado conceptualmente.

**Si el navegador no puede establecer el canal seguro local:** resolver ese
bloqueo antes de avanzar con UI. Considerar alternativas (app Android nativa,
servidor local que también sirva la interfaz).

### Fase 0.5 — Usabilidad y rendimiento del mouse básico

**Objetivo:** medir el rendimiento real antes de incorporar sensores avanzados.

**Decisiones de diseño del trackpad:**
- ¿Movimiento relativo (trackpad) o absoluto (lápiz)?
  - **Recomendado:** trackpad relativo, el dedo no necesita recorrer toda la
    pantalla para desplazar el cursor de extremo a extremo.
- ¿Qué ocurre si levantás el dedo y volvés a apoyarlo?
- ¿Cómo se diferencia un toque de un arrastre?
- ¿Se puede mantener presionado el botón mientras se arrastra?
- ¿Hay zona muerta o aceleración configurable?

**La PWA debe enviar deltas de movimiento; el Bridge los traduce a
desplazamientos de Windows.**

**Pruebas de rendimiento obligatorias:**

1. **Latencia de extremo a extremo:**
   - Medir el tiempo entre una acción en el teléfono y la ejecución del evento
     en Windows.
   - Registrar mediana y percentil 95, no solamente el mejor resultado.

2. **Estabilidad durante el uso:**
   - Mantener el mouse en funcionamiento durante varios minutos.
   - Comprobar pérdidas de conexión, movimientos erráticos y bloqueos de la UI.

3. **Recuperación de conexión:**
   - Desactivar y reactivar el Wi-Fi.
   - Cerrar la PWA y reiniciar el Bridge.
   - La recuperación debe ser clara y exigir una nueva autorización cuando
     corresponda.

**No fijar todavía un umbral de latencia como requisito definitivo:** primero
medir el comportamiento real de tu red y del Moto G(7) Plus. Después
establecer objetivos razonables.

**Criterio de salida:** mouse táctil usable para tareas reales durante sesiones
de varios minutos, con latencia medida y documentada.

### Fase 1 — Implementación del mouse táctil

**Tareas:**
- Añadir una pantalla de control móvil separada del asistente actual.
- Traducir desplazamientos relativos del dedo en deltas de cursor; incluir
  clic izquierdo/derecho, estado de conexión, emparejamiento y desconexión.
- Crear el Bridge mínimo para recibir, validar y ejecutar movimientos y clics.
- Mantener el Bridge limitado a localhost/LAN y al usuario que lo inició.

**Aceptación:** con PWA y Bridge emparejados, mover y hacer clic en Windows de
forma repetible; una conexión rechazada, perdida o no autenticada no genera
acciones; se puede detener el control inmediatamente desde ambos dispositivos.

### Fase 2 — Teclado

**Tareas:**
- Añadir entrada de texto y teclas especiales necesarias.
- Empezar por: texto, Enter, Escape, Tab, flechas y modificadores.
- Después agregar combinaciones avanzadas.
- Definir reglas para teclas mantenidas, repetición, foco y liberación segura
  ante pérdida de conexión.
- No incluir combinaciones destructivas o envío de comandos arbitrarios.

**Importante:** distinguir el envío de caracteres del envío de teclas físicas,
porque no se comportan igual con todos los idiomas y distribuciones de teclado.

**Aceptación:** texto y teclas permitidas llegan al equipo correcto, con
confirmación visible de conexión y liberación segura tras desconexión.

### Fase 3 — Empaquetado y endurecimiento

- Crear instalador/ejecutable de Windows firmado cuando sea posible, con
  instrucciones de firewall y desinstalación.
- Añadir pruebas de protocolo, autenticación, validación de rangos, límites de
  frecuencia y desconexión.
- Revisar certificados, logs, almacenamiento/rotación de credenciales y
  compatibilidad de versiones.

**Aceptación:** una persona puede instalar, emparejar, usar y desinstalar el
Bridge sin configuraciones manuales peligrosas ni exposición a Internet.

### Fase 4 — Orientación y Auren

- Añadir modo giroscopio como opción, con calibración, sensibilidad,
  recentrado y pausado.
- Evaluar la reutilización del transporte y permisos para orientar/mover a
  Auren; no bloquear el mouse básico en esa integración.

### Fase posterior — Smartwatch

Evaluar hardware, permisos y transporte tras validar el control por sensores en
el teléfono. No forma parte del primer prototipo.

## Consideración arquitectónica: separar transporte de controlador

**Este refinamiento aporta el mayor valor a futuro.**

En lugar de desarrollar un sistema exclusivo para el mouse y otro distinto para
Auren, considerar tres capas:

```text
┌─────────────────────────────────────┐
│   Fuentes de entrada                │
│   Touch · Giroscopio · Smartwatch   │
│   · Futuros sensores                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Motion Input API                  │
│   Movimiento relativo · Orientación │
│   · Botones · Acciones              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Adaptadores de destino            │
│   Mouse Windows · Teclado           │
│   · Abeja 3D · Auren Flight         │
│   Controller                        │
└─────────────────────────────────────┘
```

**Beneficio:** cuando incorpores el reloj, no tendrás que rehacer el Bridge ni
el sistema de movimiento. Y cuando quieras controlar a Auren, podrás reutilizar
la orientación, la calibración y la conexión, pero con un adaptador diferente
para su física de vuelo.

**No implementar esta separación inmediatamente:** primero validar el mouse
básico. Pero tener presente este diseño al estructurar el código del Bridge y
de la PWA.

## Limpieza y límites de alcance

En esta actualización se reorientan los README y el plan, se corrigen las rutas
PWA que apuntaban a otro repositorio y se eliminan documentos obsoletos,
archivos de plantilla y un backup confirmado como no referenciado. Se conservan por ahora el
asistente, el Core gateway, las rutas de productos/lector/chat y la lógica
compartida: son código funcional, y algunos componentes podrían servir para
Auren. Antes de retirar esas áreas hace falta confirmar que dejan de ser
producto y verificar referencias, rutas de despliegue y consumidores.

## Verificación pendiente

### Pre-implementación (Fase 0)
- **Prueba de conectividad real HTTPS/WSS** entre GitHub Pages y Bridge Windows,
  ejecutada en el Moto G(7) Plus real.
- **Prueba mínima de `SendInput`** en C# y evaluación de alternativas.
- **Contrato de protocolo escrito** con versión, tipos de mensaje, validaciones
  y límites.

### Durante implementación
- Instalar dependencias de forma reproducible y ejecutar `npm run build`.
- Revisar la exportación estática y abrir la PWA desde la ruta `/JarbeesMotion/`
  en GitHub Pages; confirmar manifest, iconos y registro del service worker.
- **Medir latencia de extremo a extremo** (mediana y percentil 95) en red real.
- **Pruebas de estabilidad:** varios minutos de uso continuo sin bloqueos.
- **Pruebas de recuperación:** pérdida de red, reinicio del Bridge, token
  vencido, múltiples intentos de cliente, firewall bloqueado.
- **Prueba del botón de desconexión** local en Windows, efectiva incluso si el
  teléfono perdió conexión.

### Criterio de éxito final
El build del frontend por sí solo no certifica el control remoto: esa capacidad
solo se considera lista cuando:
1. Pasan las pruebas del Bridge y del dispositivo real.
2. La latencia medida es aceptable para uso diario.
3. La liberación segura de teclas/botones funciona en todos los escenarios de
   desconexión.
4. Una persona puede instalar, emparejar, usar y desconectar sin configuración
   manual peligrosa.
