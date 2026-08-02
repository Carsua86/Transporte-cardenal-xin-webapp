# Cardenal Xin SpA — Panel de Gestión de Flota

![CI](https://github.com/REEMPLAZA-CON-TU-USUARIO/cardenal-xin-webapp/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3ECF8E)

Sistema interno de gestión para una empresa de transporte de carga: flota, clientes, viajes, mantenciones, combustible, documentos, facturación, nómina y reportes financieros — todo en un solo panel, con autenticación y base de datos en tiempo real.

> Nota de contexto: pensado como reemplazo con dominio propio de un prototipo funcional construido inicialmente en Claude, migrando el modelo de datos y la lógica de negocio ya validada a una arquitectura productiva (Next.js + Supabase + Vercel).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend / Backend | Next.js 16 (App Router, Server Actions, Server Components) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL (Supabase), con Row Level Security |
| Auth | Supabase Auth (usuarios internos, sin registro público) |
| Archivos | Supabase Storage (fotos de documentos, licencias, carnets) |
| Estilos | Tailwind CSS v4 |
| Hosting | Vercel |
| CI | GitHub Actions (lint + typecheck + build en cada push) |

## Funcionalidades

- **Flota**: camiones, mantenciones (con alerta por km/fecha), combustible (rendimiento km/L), documentos con archivo adjunto y vencimiento.
- **Personal**: conductores (con foto, carnet y licencia adjuntos), préstamos, nómina mensual con bono automático por cumplimiento de viajes, y reajuste anual de sueldo por IPC con vista previa de cálculo.
- **Comercial**: clientes con precio pactado; al crear un viaje, se autocompleta destino/comuna/región/vendedor/tarifa según el cliente elegido.
- **Operación**: viajes con cálculo de costo directo y margen en tiempo real.
- **Finanzas**: gastos administrativos, facturación con registro de abonos y saldo pendiente, antigüedad de cuentas por cobrar.
- **Alertas centralizadas**: documentos y licencias por vencer, notas/recordatorios con fecha, y vencimientos recurrentes de IVA y Previred.
- **Reportes**: resumen mensual, margen por camión, ranking de viajes por vendedor/región, todo calculado a partir de los datos operativos (sin duplicar información).

## Arquitectura

El proyecto usa un **sistema de módulos genérico**: cada entidad (camiones, conductores, clientes, gastos, etc.) se define una sola vez en [`src/lib/modules.tsx`](src/lib/modules.tsx) — campos, tipo de dato, columnas de la tabla — y una única página dinámica ([`src/app/(dashboard)/[modulo]/page.tsx`](<src/app/(dashboard)/[modulo]/page.tsx>)) más un formulario genérico ([`RecordFormModal`](src/components/crud/record-form-modal.tsx)) resuelven el CRUD completo para todas ellas. Los módulos con lógica propia (viajes con autocompletado, facturación con abonos, nómina con cálculo de bono) tienen su propia ruta que reutiliza los mismos componentes base.

```
src/
├─ app/
│  ├─ login/                 → autenticación (Server Actions)
│  └─ (dashboard)/
│     ├─ [modulo]/           → CRUD genérico (9 módulos)
│     ├─ trips/              → viajes, con autocompletado por cliente
│     ├─ invoices/           → facturación + abonos
│     ├─ nomina/             → cálculo de nómina mensual
│     ├─ ajustes_ipc/        → reajuste anual + vista previa
│     └─ reportes/           → agregaciones financieras
├─ components/
│  ├─ crud/                  → tabla y formulario genéricos
│  ├─ trips/ invoices/       → componentes con lógica de negocio propia
│  └─ illustrations/         → ilustración animada del login
├─ lib/
│  ├─ modules.tsx            → definición de todos los módulos (fuente única)
│  ├─ reports.ts             → lógica de negocio pura (testeable, sin I/O)
│  ├─ actions/                → Server Actions (mutaciones)
│  └─ supabase/               → clientes de Supabase (browser/server/proxy)
└─ proxy.ts                  → protección de rutas (Next.js 16 renombró "middleware" a "proxy")
supabase/migrations/         → historial de cambios de esquema, en orden
```

## Puesta en marcha local

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. En el SQL Editor del proyecto, corre las migraciones de `supabase/migrations/` **en orden** (0001 → 0007).
3. En Project Settings → API, copia la **Project URL** y la **anon/publishable key**.
4. Copia `.env.local.example` a `.env.local` y pega esos dos valores.
5. Como esta app no tiene registro público, crea tu usuario a mano en Authentication → Users → Add user.
6. Instala dependencias y corre en local:

```bash
npm install
npm run dev
```

7. Abre http://localhost:3000 e inicia sesión con el usuario del paso 5.

### Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run lint        # ESLint
npm run typecheck   # TypeScript sin emitir archivos
```

## Deploy

[Vercel](https://vercel.com): importa este repositorio, configura las mismas dos variables de entorno, y cada push a `main` se despliega automáticamente.
