# Cardenal Xin SpA — Panel de flota

Next.js 16 + Supabase. Módulos: camiones, conductores, rutas, tarifario, viajes, mantenciones, combustible, documentos, gastos, facturación (con abonos), dashboard y reportes.

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. En el SQL Editor del proyecto, pega y ejecuta `supabase/migrations/0001_init.sql`.
3. En Project Settings → API, copia la **Project URL** y la **anon public key**.
4. Copia `.env.local.example` a `.env.local` y pega esos dos valores.
5. Como esta app no tiene registro público, crea tu usuario a mano en Authentication → Users → Add user (con email y contraseña) dentro del dashboard de Supabase.
6. Instala dependencias y corre en local:

```bash
npm install
npm run dev
```

7. Abre http://localhost:3000 e inicia sesión con el usuario que creaste en el paso 5.

## Estructura

- `src/lib/modules.tsx` — definición de campos y columnas de cada módulo (equivalente al `MODULES` del prototipo original en `panel_flota.html`).
- `src/lib/actions/records.ts` — server actions genéricas de crear/editar/eliminar, usadas por todos los módulos.
- `src/app/(dashboard)/[modulo]/page.tsx` — página genérica de listado + formulario para 9 de los 10 módulos.
- `src/app/(dashboard)/invoices/page.tsx` — facturación, con el mismo sistema genérico más el modal de abonos.
- `src/lib/reports.ts` — misma lógica de negocio del prototipo (costo directo, margen por camión, antigüedad de cobranza) portada a TypeScript.
- `src/proxy.ts` — protege todas las rutas excepto `/login` (Next.js 16 renombró "middleware" a "proxy").

## Deploy

Recomendado: [Vercel](https://vercel.com), importando este repo y configurando las mismas dos variables de entorno en el proyecto de Vercel.
