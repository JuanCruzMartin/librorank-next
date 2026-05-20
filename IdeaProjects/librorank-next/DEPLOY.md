# Deploy LibroRank en Vercel

## 1. Base de datos MySQL en la nube

Usá **Railway** (recomendado):
1. Creá una cuenta en https://railway.app
2. Creá un proyecto → "New Service" → MySQL
3. Copiá las variables: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
4. Importá el schema SQL de la base de datos existente

## 2. Deploy en Vercel

```bash
cd librorank-next
npm install -g vercel
vercel login
vercel
```

## 3. Variables de entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables, agregá:

| Variable | Descripción |
|----------|-------------|
| `DB_HOST` | Host de tu MySQL (Railway, PlanetScale) |
| `DB_PORT` | Puerto (generalmente 3306) |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña |
| `JWT_SECRET` | String aleatorio seguro (genera con: `openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob (opcional, para subida de fotos) |
| `GOOGLE_BOOKS_API_KEY` | API key de Google Books (opcional) |

## 4. Vercel Blob (subida de fotos)

1. En el dashboard de Vercel → Storage → Blob → Create
2. Copiá el token y guardalo como `BLOB_READ_WRITE_TOKEN`

## 5. SSL para Railway

Si Railway usa SSL, en la variable `DB_SSL` poné `true`.

## Desarrollo local

```bash
cd librorank-next
cp .env.example .env.local
# Editá .env.local con tus datos
npm install
npm run dev
```

La app corre en http://localhost:3000
