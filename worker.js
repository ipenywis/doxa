import server from "virtual:tanstack-start-server-entry"

function redirectToPath(url, pathname) {
  const redirectUrl = new URL(url)
  redirectUrl.pathname = pathname

  return Response.redirect(redirectUrl.toString(), 308)
}

export default {
  async fetch(request, env) {
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
