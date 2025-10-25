# OTC RFQ White-Label (Bitso)

Mini-plataforma RFQ con roles **admin** y **cliente**, comisión por usuario y **folio** para conciliación.

## Quick start
1. Clona el repo y crea `.env` desde `.env.example`.
2. `npm i`
3. `npm run prisma:migrate` (crea tablas)
4. Crea el primer admin manualmente con el script SQL de ejemplo de abajo o inserta vía psql.
5. `npm run dev`

## Variables .env
Ver `.env.example`.

## Notas
- Login por cookie JWT (HS256) **HttpOnly**.
- Admin crea usuarios y fija `commissionBps`.
- Cliente sólo puede pedir cotización y **cerrar precio** => genera FOLIO.
