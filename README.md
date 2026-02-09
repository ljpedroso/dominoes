# Dominoes Score Tracker

Aplicación web mobile-first (React + TypeScript + Tailwind + Vite) para llevar puntajes de dominó por equipos (2 vs 2).

## Funcionalidades

- Onboarding inicial en español:
  - Nombre del Equipo A
  - Nombre del Equipo B
  - Regla opcional: doblar la primera mano
- Marcador por manos con historial de la partida actual.
- Meta de juego en `150` puntos.
- Cierre automático de partida:
  - Si un equipo llega a 150+ y va arriba, gana la partida.
  - Se registra una victoria y comienza una nueva partida automáticamente.
- Panel de configuración desplegable (edición de nombres y regla) sin salir del marcador.
- Acciones rápidas:
  - Guardar mano
  - Deshacer última mano
  - Nueva partida (reinicia solo el marcador actual)
- Persistencia local en navegador.
- Exportar / importar respaldo JSON.

## Diseño

- UI en español.
- Estilo dominó con paleta inspirada en la bandera cubana (rojo, azul y blanco).
- Ajustada para lectura en móvil con mejor contraste.

## Requisitos

- Node.js 18+
- npm 9+

## Desarrollo

```bash
npm install
npm run dev
```

Vite abre por defecto en `http://localhost:5173`.

## Build de producción

```bash
npm run build
npm run preview
```

## Persistencia

- Clave de `localStorage`: `dominoes-score-tracker-v2`

## Notas de HMR (hot reload)

Si no refresca en desarrollo, reinicia el servidor de Vite:

```bash
npm run dev
```

El proyecto ya incluye `watch.usePolling` en `vite.config.ts` para mejorar detección de cambios en algunos entornos.
