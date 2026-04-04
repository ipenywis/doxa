import server from "./dist/server/server.js"

function redirectToPath(url, pathname) {
  const redirectUrl = new URL(url)
  redirectUrl.pathname = pathname

  return Response.redirect(redirectUrl.toString(), 308)
}

export default {
  async fetch(request, env) {
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          // eslint-disable-next-line no-undef
          process.env[key] = value
        }
      }
    }

    const url = new URL(request.url)

    if (url.pathname === "/docs/docs") {
      return redirectToPath(url, "/docs")
    }

    if (url.pathname.startsWith("/docs/docs/")) {
      return redirectToPath(url, url.pathname.replace(/^\/docs\/docs/, "/docs"))
    }

    if (url.pathname.startsWith("/docs/assets/")) {
      return redirectToPath(url, url.pathname.replace(/^\/docs\/assets/, "/assets"))
    }

    if (env.ASSETS) {
      const directResponse = await env.ASSETS.fetch(request.clone())
      if (directResponse.ok) return directResponse
    }

    return server.fetch(request)
  },
}
