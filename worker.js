import server from "virtual:tanstack-start-server-entry"

export default {
  async fetch(request, env) {
    if (env.ASSETS) {
      const directResponse = await env.ASSETS.fetch(request.clone())
      if (directResponse.ok) return directResponse
    }

    return server.fetch(request)
  },
}
