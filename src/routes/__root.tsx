/// <reference types="vite/client" />
import type { ReactNode } from "react"
import { ChatWithDocs } from "@/src/components/chat"
import { ChatProvider } from "@/src/components/chat/chat-context"
import { DemoChatWithDocs } from "@/src/components/chat/demo-chat"
import { FloatingChatBar } from "@/src/components/chat/floating-chat-bar"
import { Footer } from "@/src/components/navigation/footer"
import { Navbar } from "@/src/components/navigation/navbar"
import themeSettings from "@/src/contents/settings/theme.json"
import { DemoModeProvider } from "@/src/contexts/demo-mode"
import { getColorPreset } from "@/src/lib/colors"
import { generateThemeCss, getTheme } from "@/src/lib/themes"
import { Providers } from "@/src/providers"
import { Settings } from "@/src/settings/main"
import globalsCss from "@/src/styles/globals.css?url"
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router"

const theme = getTheme(themeSettings.activeTheme)
const themeCss = generateThemeCss(theme)

const colorPreset = getColorPreset(themeSettings.primaryColor)
const colorCss = `:root { --primary: ${colorPreset.light.primary}; --primary-foreground: ${colorPreset.light.primaryForeground}; } .dark { --primary: ${colorPreset.dark.primary}; --primary-foreground: ${colorPreset.dark.primaryForeground}; }`

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    const demo =
      search.demo === true ||
      search.demo === "true" ||
      search.demo === "" ||
      search.demo === 1 ||
      search.demo === "1"

    return demo ? { demo: true as const } : {}
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: Settings.site.name,
      },
      {
        name: "description",
        content: Settings.site.description,
      },
      {
        name: "keywords",
        content: Settings.site.keywords.join(", "),
      },
      // Open Graph
      {
        property: "og:type",
        content: Settings.openGraph.type,
      },
      {
        property: "og:title",
        content: Settings.openGraph.title,
      },
      {
        property: "og:description",
        content: Settings.openGraph.description,
      },
      {
        property: "og:site_name",
        content: Settings.openGraph.siteName,
      },
      {
        property: "og:image",
        content: `${Settings.site.url}${Settings.openGraph.images[0]?.url}`,
      },
      // Twitter
      {
        name: "twitter:card",
        content: Settings.twitter.card,
      },
      {
        name: "twitter:title",
        content: Settings.twitter.title,
      },
      {
        name: "twitter:description",
        content: Settings.twitter.description,
      },
      {
        name: "twitter:site",
        content: Settings.twitter.site,
      },
      {
        name: "twitter:image",
        content: `${Settings.site.url}${Settings.twitter.images[0]?.url}`,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: globalsCss,
      },
      {
        rel: "icon",
        href: Settings.site.icon,
        type: "image/svg+xml",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      ...theme.fonts.map((font) => ({
        rel: "stylesheet" as const,
        href: font.href,
      })),
    ],
    //     scripts: Settings.analytics.gtmEnabled
    //       ? [
    //           {
    //             type: "text/javascript",
    //             children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    // new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    // j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    // 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    // })(window,document,'script','dataLayer','${Settings.analytics.gtmId}');`,
    //           },
    //         ]
    //       : [],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
})

function RootComponent() {
  const { demo = false } = Route.useSearch()
  return (
    <RootDocument isDemoMode={demo}>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({
  children,
  isDemoMode = false,
}: Readonly<{ children: ReactNode; isDemoMode?: boolean }>) {
  const appScrollStyle = {
    minWidth: 0,
    flex: "1 1 0%",
    overflowY: isDemoMode ? "hidden" : "auto",
    scrollbarGutter: isDemoMode ? undefined : "stable",
  } as const

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{ height: "100%", overflow: "hidden" }}
    >
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <style dangerouslySetInnerHTML={{ __html: colorCss }} />
      </head>
      <body
        className="font-regular"
        style={{ height: "100%", margin: 0, overflow: "hidden" }}
      >
        <Providers>
          <DemoModeProvider value={isDemoMode}>
            <ChatProvider>
              <div
                className="flex h-screen"
                style={{ display: "flex", height: "100vh" }}
              >
                <div
                  id="app-scroll-container"
                  className={`min-w-0 flex-1 ${isDemoMode ? "overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "overflow-y-auto"}`}
                  style={appScrollStyle}
                >
                  <Navbar />
                  <main className="mx-auto h-auto max-w-[1440px] px-4 sm:px-6 md:px-8">
                    {children}
                  </main>
                  {!isDemoMode && <Footer />}
                </div>
                {Settings.features.ai.chat &&
                  (isDemoMode ? <DemoChatWithDocs /> : <ChatWithDocs />)}
              </div>
              {Settings.features.ai.chat &&
                Settings.features.ai.floatingInput &&
                !isDemoMode && <FloatingChatBar />}
            </ChatProvider>
          </DemoModeProvider>
        </Providers>
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-[86.5vh] flex-col items-center justify-center px-2 py-8 text-center">
      <h1 className="mb-4 text-4xl font-bold sm:text-7xl">404</h1>
      <p className="mb-8 max-w-[600px] text-foreground sm:text-base">
        Page not found
      </p>
      <div className="flex items-center">
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Return Home
        </a>
      </div>
    </div>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <RootDocument>
      <section className="flex min-h-[99vh] flex-col items-start gap-3 px-2 py-8">
        <div>
          <h2 className="text-5xl font-bold">Oops!</h2>
          <p className="text-muted-foreground">Something went wrong!</p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 overflow-auto rounded bg-muted p-4 text-sm">
              {error.message}
            </pre>
          )}
        </div>
        <a
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Go Home
        </a>
      </section>
    </RootDocument>
  )
}
