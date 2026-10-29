# JarBees Motion PWA — estado actual

JarBees Motion conserva la base PWA de JarBees Mobile, pero todavía no ofrece
control remoto de mouse ni teclado. La pantalla principal actual es el asistente
móvil existente; no existe aún un trackpad, un cliente WebSocket ni un flujo de
emparejamiento con Windows.

## Capacidades presentes

- Next.js App Router con exportación estática.
- Manifest, iconos e instalación como PWA.
- Registro de service worker.
- Interfaz móvil del asistente y un gateway HTTP separado para JarBees Core.

El gateway HTTP del Core no controla la PC ni debe confundirse con el futuro
Motion Bridge. La disponibilidad de cada capacidad del asistente está limitada
por las APIs del navegador y los permisos del dispositivo.

## Publicación y conexión futura

La configuración actual de GitHub Pages apunta a `/JarbeesMotion/`. El manifest
usa rutas relativas para seguir ese prefijo sin codificar rutas de otro
repositorio. El PWA estático no puede generar entradas en Windows: esa función
requiere un proceso Motion Bridge separado que se ejecute en la PC.

No conectar una PWA HTTPS a un `ws://` de la LAN suponiendo que funcionará:
los navegadores pueden bloquear contenido mixto y aplicar controles de acceso a
la red local. El puente debe diseñarse para una conexión segura, emparejada y
probada en Chrome Android sobre el Moto G(7) Plus, además de tener en cuenta el
firewall y el aislamiento de clientes Wi-Fi.

Para el alcance, los riesgos y los criterios verificables, consultar
[el plan de Motion Bridge](./docs/implementation_plan.md).
