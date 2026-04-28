# TFG — Inventario por eventos

API REST con **Node.js**, **Express**, **Prisma** y **PostgreSQL**, y aplicación web en **React**, **TypeScript** y **Vite** (materiales, eventos, movimientos y plantilla de material por evento).

## Requisitos

- Node.js 18+ (recomendado LTS)
- PostgreSQL accesible desde tu máquina

## Puesta en marcha (revisor / tutor)

### Arranque más rápido (mismo ordenador, cualquier IDE)

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL`.
2. (Solo la primera vez) Ejecuta:

```bash
npm run setup
```

3. Arranca **API + frontend** a la vez:

```bash
npm run dev:all
```

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`

1. **Clonar** el repositorio y entrar en la carpeta del proyecto.

2. **Variables de entorno (API)**  
   En la raíz del repo, duplicar el ejemplo como `.env` (Linux/macOS: `cp .env.example .env`; Windows: `copy .env.example .env`).  
   Editar `.env` y poner una `DATABASE_URL` válida hacia tu instancia de PostgreSQL.

3. **Instalar dependencias y base de datos**

   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma generate
   ```

   El cliente de Prisma se genera en `src/generated/prisma` (no está en el repositorio).

4. **Arrancar el API** (raíz del proyecto):

   ```bash
   npm run dev
   ```

   Por defecto: `http://localhost:3000`.

5. **Frontend** (otra terminal):

   ```bash
   cd frontend
   npm install
   ```

   Duplicar `frontend/.env.example` como `frontend/.env` (por defecto apunta al API en `http://127.0.0.1:3000`; cámbialo si tu API usa otro host o puerto).

   ```bash
   npm run dev
   ```

   Abrir la URL que indique Vite (habitualmente `http://localhost:5173`).

## Estructura breve

| Ruta        | Contenido                          |
|------------|-------------------------------------|
| `src/`     | Servidor Express, rutas, servicios  |
| `prisma/`  | Esquema y migraciones              |
| `frontend/`| Aplicación React + Vite            |

## Qué no se sube a Git (normal)

- `.env` (secretos y credenciales)
- `node_modules/`, `dist/`
- Cliente generado por Prisma en `src/generated/prisma/`

Cada quien crea su `.env` a partir de `.env.example`.

## Scripts útiles

- `npm run setup` — instala deps (root + frontend) y ejecuta `prisma migrate deploy` + `prisma generate`
- `npm run dev:all` — API + frontend en paralelo
- `npm run dev` — API en modo desarrollo
- `npm run db:clear-movements` — borra todos los movimientos (script en `scripts/`)
