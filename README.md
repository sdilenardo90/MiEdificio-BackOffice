# MiEdificio - BackOffice Web Administrativo

Panel de control administrativo web construido en **Angular 19** (Standalone Components + PrimeNG 19 + TypeScript) para la gestión integral de consorcios, edificios, unidades y reservas.

## Arquitectura
- **Framework**: Angular 19 (Standalone Components, Signals, Router Guards, Functional Guards).
- **UI Library**: PrimeNG 19 + PrimeIcons con tema personalizado Aura.
- **Roles**:
  - `SUPER_ADMIN`: Administra consorcios y administradores de la plataforma.
  - `CONDOMINIUM_ADMIN`: Administra edificios, módulos, salones y reservas de su consorcio.
  - `BUILDING_ADMIN`: Administra edificios específicos asignados.
- **Comunicación**: Consume la API REST expuesta por `MiEdificio-Api` (.NET 10).

## Requisitos
- Node.js >= 20.x
- pnpm o npm

## Instalación y Ejecución
```bash
pnpm install
pnpm start
# Abre http://localhost:4200
```
