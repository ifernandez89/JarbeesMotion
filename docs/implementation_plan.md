# JarBees Motion — plan del Windows Motion Bridge

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

1. **HTTPS/WSS:** la PWA publicada se sirve por HTTPS. Una conexión `ws://` a
   una IP de la LAN puede quedar bloqueada como contenido mixto. La solución
   debe usar WSS con certificado confiable por el teléfono o una estrategia de
   origen seguro local compatible con los navegadores objetivo. Verificarlo en
   el Moto G(7) Plus real; no dar por hecho que compartir Wi-Fi resuelve esta
   política.
2. **Red local:** probar permisos de acceso a dispositivos de la red local,
   firewall de Windows, redes de invitados, aislamiento de clientes y cambios
   de IP. Informar al usuario si no hay conectividad.
3. **Autorización:** mostrar un código de emparejamiento de corta duración,
   limitar intentos y exigir aprobación local en Windows. Validar `Origin`,
   autenticar la sesión y no incluir secretos en URL, logs o repositorio.
4. **Control seguro:** permitir solo mensajes versionados de mouse/teclado;
   validar tipos y rangos, limitar frecuencia y tamaño, cerrar sesiones
   inválidas y detener botones/teclas mantenidos al desconectar o expirar la
   sesión.
5. **Consentimiento y control:** mostrar en Windows cuándo hay una sesión
   activa y ofrecer una desconexión inmediata. No iniciar automáticamente el
   Bridge con Windows en el primer prototipo.
6. **Límites de Windows:** `SendInput` no evita UAC ni controla de forma
   fiable escritorios seguros o pantallas de inicio de sesión; documentar
   esos límites.

## Plan por fases

### Fase 0 — Prueba de viabilidad y contrato

- Probar, en un Windows y en el Moto real, la conexión PWA HTTPS a un Bridge
  WSS local con certificado confiable y permisos de red local.
- Comparar una llamada mínima a `SendInput` en C# con la alternativa de Node y
  elegir el runtime del Bridge a partir de compatibilidad y distribución.
- Definir versión de protocolo, emparejamiento, caducidad de sesión,
  desconexión y límites. No implementar el envío de eventos antes de cerrar
  estas decisiones.

**Salida:** decisión documentada sobre runtime y TLS/WSS, más una prueba
reproducible de conexión desde el teléfono. Si el navegador no puede establecer
el canal seguro local, resolver ese bloqueo antes de avanzar con UI.

### Fase 1 — Mouse táctil

- Añadir una pantalla de control móvil separada del asistente actual.
- Traducir desplazamientos relativos del dedo en deltas de cursor; incluir
  clic izquierdo/derecho, estado de conexión, emparejamiento y desconexión.
- Crear el Bridge mínimo para recibir, validar y ejecutar movimientos y clics.
- Mantener el Bridge limitado a localhost/LAN y al usuario que lo inició.

**Aceptación:** con PWA y Bridge emparejados, mover y hacer clic en Windows de
forma repetible; una conexión rechazada, perdida o no autenticada no genera
acciones; se puede detener el control inmediatamente desde ambos dispositivos.

### Fase 2 — Teclado

- Añadir entrada de texto y teclas especiales necesarias (Escape, Enter,
  Tab, modificadores y flechas).
- Definir reglas para teclas mantenidas, repetición, foco y liberación segura
  ante pérdida de conexión.
- No incluir combinaciones destructivas o envío de comandos arbitrarios.

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

## Limpieza y límites de alcance

En esta actualización se reorientan los README y el plan, se corrigen las rutas
PWA que apuntaban a otro repositorio y se eliminan documentos obsoletos,
archivos de plantilla y un backup confirmado como no referenciado. Se conservan por ahora el
asistente, el Core gateway, las rutas de productos/lector/chat y la lógica
compartida: son código funcional, y algunos componentes podrían servir para
Auren. Antes de retirar esas áreas hace falta confirmar que dejan de ser
producto y verificar referencias, rutas de despliegue y consumidores.

## Verificación pendiente

- Instalar dependencias de forma reproducible y ejecutar `npm run build`.
- Revisar la exportación estática y abrir la PWA desde la ruta `/JarbeesMotion/`
  en GitHub Pages; confirmar manifest, iconos y registro del service worker.
- Ejecutar la prueba real de WSS/entrada con Moto G(7) Plus y Windows.
- Probar pérdida de red, reinicio del Bridge, token vencido, múltiples clientes,
  firewall bloqueado y botón de desconexión.

El build del frontend por sí solo no certifica el control remoto: esa capacidad
solo se considera lista cuando pasan las pruebas del Bridge y del dispositivo
real.
