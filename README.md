# JarBees Motion

JarBees Motion is a mobile-first PWA project intended to grow into a local-network
remote control for Windows: the phone will provide a touchpad and virtual
keyboard, and a separately installed Windows bridge will translate authenticated
commands into mouse and keyboard input.

## Current status

**The remote mouse/keyboard feature is not implemented yet.** The current home
screen is the JarBees Mobile assistant. This repository has PWA and mobile UI
foundations, an assistant command dispatcher, and an HTTP integration for
JarBees Core; it does not yet contain a WebSocket control protocol, trackpad
interface, Windows receiver, pairing flow, or Windows input injection.

The existing Core gateway is an HTTP assistant integration, not the Motion
Bridge. It should not be exposed to the local network as a control receiver.

## Target architecture

```text
Moto G(7) Plus PWA
  ├─ touchpad and virtual keyboard
  ├─ pairing and connection controls
  └─ authenticated WebSocket over the local network
                  │
                  ▼
JarBees Motion Bridge for Windows
  ├─ validates pairing, origin, and bounded command messages
  ├─ exposes an immediate disconnect/stop control
  └─ generates Windows input through a supported native API
```

The phone and PC need a network path between them; being on the same Wi-Fi
network alone does not guarantee that the router allows peer-to-peer traffic.
Windows Firewall, access-point client isolation, browser local-network
permissions, and HTTPS-to-WSS requirements must be tested on the target phone.

## Development

Prerequisites: Node.js 20 or Bun, plus the package manager lockfile you choose
for this checkout.

```bash
npm ci --legacy-peer-deps
npm run dev
npm run build
```

The current Next.js configuration uses static export for GitHub Pages. A static
PWA can be hosted remotely, but the Windows bridge must run separately on the PC.
The deployment workflow and HTTPS/WSS connection model are part of the readiness
work described in [the Motion Bridge plan](./docs/implementation_plan.md).

## Project direction and cleanup

The assistant, existing Core integration, product routes, and shared PWA
infrastructure remain in place for now. Some may support the planned Auren and
device-control experience. Do not delete these modules solely because they are
not part of the first mouse prototype; retire them only after their callers,
deployment use, and product scope have been verified.

See [PWA status and limitations](./PWA_JARBEES.md) for what the current PWA does
and [the implementation plan](./docs/implementation_plan.md) for readiness,
security requirements, milestones, and acceptance criteria.
