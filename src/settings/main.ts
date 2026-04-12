import type { OpenGraph, TwitterCard } from "@/src/types/opengraph"

interface AppSettings {
  site: {
    name: string
    url: string
    description: string
    keywords: string[]
    icon: string
  }
  company: {
    name: string
    link: string
  }
  seo: {
    ogImage: string
    ogImageAlt: string
    twitterHandle: string
  }
  analytics: {
    gtmId: string
    gtmEnabled: boolean
  }
  features: {
    branding: boolean
    rightSidebar: boolean
    feedbackEdit: boolean
    tableOfContents: boolean
    scrollToTop: boolean
    chatWithDocs: boolean
    loadFromGithub: boolean
  }
  openGraph: OpenGraph
  twitter: TwitterCard
}

export const Settings: AppSettings = {
  site: {
    name: "doxa",
    url: "https://doxa-docs.islem-coderone.workers.dev",
    description:
      "Beautiful, fast documentation that stays out of your way. Built for developers who care about the reading experience as much as the writing.",
    keywords: ["doxa", "documentation", "open source", "SEO"],
    icon: "/favicon.svg",
  },
  company: {
    name: "doxa",
    link: "https://doxa-docs.islem-coderone.workers.dev",
  },
  seo: {
    ogImage: "/images/og-image.png",
    ogImageAlt: "doxa documentation",
    twitterHandle: "",
  },
  analytics: {
    gtmId: "GTM-XXXXXXX",
    gtmEnabled: true,
  },
  features: {
    branding: true,
    rightSidebar: true,
    feedbackEdit: true,
    tableOfContents: true,
    scrollToTop: true,
    chatWithDocs: true,
    loadFromGithub: false,
  },
  openGraph: {
    type: "website",
    title: "doxa",
    description:
      "Beautiful, fast documentation that stays out of your way. Built for developers who care about the reading experience as much as the writing.",
    siteName: "doxa",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "doxa documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "doxa",
    description:
      "Beautiful, fast documentation that stays out of your way. Built for developers who care about the reading experience as much as the writing.",
    site: "",
    images: [
      {
        url: "/images/og-image.png",
        alt: "doxa documentation",
      },
    ],
  },
}
