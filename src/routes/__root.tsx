/// <reference types="vite/client" />
import type { ReactNode } from "react"
import { Footer } from "@/src/components/navigation/footer"
import { Navbar } from "@/src/components/navigation/navbar"
import { ChatWithDocs } from "@/src/components/chat"
import { ChatProvider } from "@/src/components/chat/chat-context"
import { Providers } from "@/src/providers"
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router"

import { Settings } from "@/src/types/settings"
import { getColorPreset } from "@/src/lib/colors"
import { primaryColor } from "@/src/contents/settings/color"

import globalsCss from "@/src/styles/globals.css?url"

const colorPreset = getColorPreset(primaryColor)
const colorCss = `:root { --primary: ${colorPreset.light.primary}; --primary-foreground: ${colorPreset.light.primaryForeground}; } .dark { --primary: ${colorPreset.dark.primary}; --primary-foreground: ${colorPreset.dark.primaryForeground}; }`

export const Route = createRootRoute({
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
        title: Settings.title,
      },
      {
        name: "description",
        content: Settings.description,
      },
      {
        name: "keywords",
        content: Settings.keywords.join(", "),
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
        content: `${Settings.metadataBase}${Settings.openGraph.images[0]?.url}`,
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
        content: `${Settings.metadataBase}${Settings.twitter.images[0]?.url}`,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: globalsCss,
      },
      {
        rel: "canonical",
        href: Settings.canonical,
      },
      {
        rel: "icon",
        href: Settings.siteicon,
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
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap",
      },
    ],
    //     scripts: Settings.gtmconnected
    //       ? [
    //           {
    //             type: "text/javascript",
    //             children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    // new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    // j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    // 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    // })(window,document,'script','dataLayer','${Settings.gtm}');`,
    //           },
    //         ]
    //       : [],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: colorCss }} />
      </head>
      <body className="font-regular">
        <Providers>
          <ChatProvider>
            <div className="flex h-screen">
              <div className="min-w-0 flex-1 overflow-y-auto">
                <Navbar />
                <main className="mx-auto h-auto max-w-[1440px] px-4 sm:px-6 md:px-8">
                  {children}
                </main>
                <Footer />
              </div>
              {Settings.chat && <ChatWithDocs />}
            </div>
          </ChatProvider>
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
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
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Go Home
        </a>
      </section>
    </RootDocument>
  )
}
