import type { OpenGraph, TwitterCard } from "@/src/types/opengraph";

interface AiFeatureSettings {
  chat: boolean;
  chatWithPage: boolean;
  floatingInput: boolean;
}

interface CopyPageFeatureSettings {
  markdown: boolean;
  rawText: boolean;
}

interface AppSettings {
  site: {
    name: string;
    url: string;
    description: string;
    keywords: string[];
    icon: string;
  };
  company: {
    name: string;
    link: string;
  };
  seo: {
    ogImage: string;
    ogImageAlt: string;
    twitterHandle: string;
  };
  analytics: {
    gtmId: string;
    gtmEnabled: boolean;
  };
  features: {
    branding: boolean;
    rightSidebar: boolean;
    feedbackEdit: boolean;
    tableOfContents: boolean;
    scrollToTop: boolean;
    ai: AiFeatureSettings;
    copyPage: CopyPageFeatureSettings;
    loadFromGithub: boolean;
  };
  openGraph: OpenGraph;
  twitter: TwitterCard;
}

const siteUrl = import.meta.env.VITE_SITE_URL ?? "https://docs.doxa.so";
const companyLink = import.meta.env.VITE_COMPANY_LINK ?? siteUrl;

export const Settings: AppSettings = {
  site: {
    name: "doxa",
    url: siteUrl,
    description:
      "Beautiful, fast documentation that stays out of your way. Built for developers who care about the reading experience as much as the writing.",
    keywords: ["doxa", "documentation", "open source", "SEO"],
    icon: "/favicon.svg",
  },
  company: {
    name: "doxa",
    link: companyLink,
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
    ai: {
      chat: true,
      chatWithPage: true,
      floatingInput: true,
    },
    copyPage: {
      markdown: true,
      rawText: true,
    },
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
};
