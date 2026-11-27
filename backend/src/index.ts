import app from './app'

// En Vercel la app se exporta como función; en local escucha en un puerto.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3000)
  app.listen(port, () => console.log(`API en http://localhost:${port}`))
}

export default app
