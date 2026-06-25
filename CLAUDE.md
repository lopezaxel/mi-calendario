# Calendario de Pagos — Contexto del proyecto

## Stack
- **Framework:** React 19 + TypeScript + Vite 8
- **Estilos:** Tailwind CSS v4 (plugin `@tailwindcss/vite`, sin `tailwind.config.js`)
- **Componentes:** Shadcn/ui v4 — usa `@base-ui/react` (NO `@radix-ui`)
- **Backend:** Supabase JS client (`@supabase/supabase-js`)
- **Deploy:** Vercel — `vercel.json` configurado, build OK (`npm run build` → `dist/`)

## Supabase
- **Proyecto:** Sistema NIKI
- **Project ID:** `zomukalrkafpmbxgdgwl`
- **URL:** `https://zomukalrkafpmbxgdgwl.supabase.co`
- **Credenciales:** en `.env` (nunca commitear)

### Regla crítica
No tocar las tablas existentes del proyecto:
`chat_history`, `filtrador_*`, `fiscal_*`, `platform_config`, `storage_files`, `tenant_tools`, `tenants`, `tools`, `user_tool_permissions`, `users`

### Tablas propias (creadas el 2026-06-24)

**`calendario_pagos`**
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| nombre | text | ej: "Claude Pro" |
| monto | numeric nullable | null = monto variable |
| moneda | text | 'ARS' \| 'USD' |
| dia_vencimiento | int | 1–31 |
| es_recurrente | boolean | aparece cada mes automáticamente |
| categoria | text | 'suscripcion' \| 'impuesto' \| 'servicio' \| 'otro' |
| activo | boolean | false = oculto sin borrar |
| created_at | timestamptz | |

**`calendario_pagos_registro`**
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| pago_id | uuid FK | → calendario_pagos(id) ON DELETE CASCADE |
| mes | int | 1–12 |
| año | int | |
| pagado | boolean | |
| fecha_pago_real | date nullable | |
| created_at | timestamptz | |

Unique constraint en `(pago_id, mes, año)`.

## Estructura de archivos

```
src/
├── types.ts                        # Tipos TypeScript (Pago, RegistroPago, PagoConRegistro)
├── App.tsx                         # Pantalla principal
├── main.tsx                        # Entry point
├── index.css                       # Solo @import "tailwindcss"
├── lib/
│   ├── supabase.ts                 # Cliente Supabase
│   ├── api.ts                      # Todas las operaciones DB
│   └── utils.ts                    # cn() helper (clsx + tailwind-merge)
└── components/
    ├── FilaPago.tsx                # Fila individual: marcar pagado / eliminar
    ├── NuevoPagoDialog.tsx         # Modal para agregar un pago nuevo
    └── ui/                         # Componentes Shadcn generados
        ├── button.tsx
        ├── badge.tsx
        ├── dialog.tsx
        └── select.tsx
```

## Lógica de negocio

- `getPagosDelMes(mes, año)`: trae todos los pagos activos + su registro del mes. Los pagos recurrentes aparecen siempre; los únicos solo si tienen registro.
- `marcarPagado(pagoId, mes, año, pagado)`: upsert en `calendario_pagos_registro`.
- `eliminarPago(id)`: soft delete (activo = false), no borra la fila.
- Estado de un pago: **pagado** (registro.pagado = true) / **vencido** (dia < hoy y no pagado, solo en mes actual) / **pendiente**.

## UI / Diseño
- Dark mode fijo: fondo `zinc-950`, cards `zinc-900`, bordes `zinc-800`
- Acento: violeta (`violet-600`)
- Vencidos: rojo (`red-950/20` fondo, `red-400` texto)
- Pagados: opacidad reducida + tachado
- USD en verde esmeralda, ARS en gris
- Vista: lista ordenada por `dia_vencimiento` (no grid de calendario)
- Navegación: flechas para cambiar de mes + botón "Volver a hoy"
- Totales pendientes ARS / USD al tope si los hay

## Variables de entorno
```
VITE_SUPABASE_URL=https://zomukalrkafpmbxgdgwl.supabase.co
VITE_SUPABASE_ANON_KEY=<en .env local y en Vercel env vars>
```

## Comandos
```bash
npm run dev      # servidor local en localhost:5173
npm run build    # build de producción
npm run preview  # preview del build
```

## Decisiones tomadas
- Sin autenticación (uso personal)
- Sin librerías de fecha (Date nativo es suficiente)
- Shadcn agregado con `npx shadcn@latest add <componente>` (no `init` completo por conflicto con TS refs)
- `@base-ui/react` instalado manualmente (dependencia de Shadcn v4)
- Path alias `@/` → `src/` configurado en vite.config.ts y tsconfig.app.json
