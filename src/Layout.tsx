import type { FC, PropsWithChildren } from 'hono/jsx';

interface LayoutProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  url?: string;
  author?: string;
  type?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({
  title = 'LiveUser Demo',
  description = 'A powerful real-time user activity tracking and analytics platform',
  keywords = 'LiveUser, real-time analytics, user tracking, activity monitoring, web analytics',
  ogImage = 'https://live-user.chendi.workers.dev/og-image.png',
  url = 'https://live-user.chendi.workers.dev/',
  author = 'wudi',
  type = 'website',
  children
}) => {
  const currentDate = new Date().toISOString();

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />

        {/* Author & Publisher */}
        <link rel="author" href="https://github.com/WuChenDi" />
        <meta name="author" content={author} />
        <meta name="creator" content={author} />
        <meta name="publisher" content="LiveUser" />

        {/* SEO & Crawling */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="copyright" content="© 2025 wudi. All rights reserved." />
        <meta name="language" content="en" />
        <meta name="classification" content="Web Application, Analytics, User Tracking" />
        <meta name="category" content="Analytics,Real-time Monitoring,Web Tools" />
        <meta name="application-name" content="LiveUser" />
        <meta name="referrer" content="no-referrer-when-downgrade" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="LiveUser" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:updated_time" content={currentDate} />
        <meta property="article:author" content={author} />
        <meta property="article:section" content="Analytics Tools" />
        <meta property="article:tag" content="analytics,real-time,user tracking" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={url} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:creator" content="@wuchendi96" />
        <meta name="twitter:site" content="@wuchendi96" />

        {/* Canonical URL */}
        <link rel="canonical" href={url} />

        {/* Favicon */}
        <link rel="icon" type="image/png" href="https://notes-wudi.pages.dev/images/logo.png" />
        <link rel="apple-touch-icon" href="https://notes-wudi.pages.dev/images/logo.png" />

        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://cdn.tailwindcss.com" />
        <link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* JSON-LD Structured Data - Website */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "LiveUser",
            "url": url,
            "description": description,
            "inLanguage": "en",
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${url}?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })
        }} />

        {/* JSON-LD Structured Data - WebApplication */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LiveUser",
            "description": description,
            "url": url,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "browserRequirements": "Requires JavaScript. Compatible with Chrome 90+, Firefox 88+, Safari 14+, Edge 90+",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "author": {
              "@type": "Person",
              "name": author,
              "url": "https://github.com/WuChenDi"
            },
            "publisher": {
              "@type": "Organization",
              "name": author,
              "url": url
            },
            "datePublished": "2025-01-01",
            "dateModified": currentDate,
            "inLanguage": "en",
            "isAccessibleForFree": true,
            "keywords": keywords,
            "screenshot": {
              "@type": "ImageObject",
              "contentUrl": ogImage,
              "description": "LiveUser Interface Screenshot"
            },
            "softwareVersion": "1.0.0",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150",
              "bestRating": "5",
              "worstRating": "1"
            },
            "featureList": [
              "Real-time user activity tracking",
              "Advanced analytics dashboard",
              "Custom event monitoring",
              "User behavior insights",
              "Privacy-focused design",
              "Easy integration",
              "Free to use"
            ],
            "interactionStatistic": {
              "@type": "InteractionCounter",
              "interactionType": { "@type": "http://schema.org/ViewAction" },
              "userInteractionCount": 5000
            },
            "sameAs": [
              "https://github.com/WuChenDi",
              "https://x.com/wuchendi96"
            ]
          })
        }} />

        {/* JSON-LD Structured Data - SoftwareApplication */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "LiveUser",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0"
            },
            "operatingSystem": "Any",
            "permissions": "Browser access permissions"
          })
        }} />

        {/* JSON-LD Structured Data - BreadcrumbList */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": url
            }]
          })
        }} />

        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Inter', 'system-ui', 'sans-serif'],
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body class="bg-gray-50 min-h-screen font-sans">
        <div class="min-h-screen flex flex-col">
          <main class="flex-1 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl mx-auto">
              {children}
            </div>
          </main>
          {/* <footer class="bg-white border-t border-gray-200 py-8 text-center">
            <div class="max-w-4xl mx-auto px-4">
              <p class="text-sm text-gray-500">Powered by LiveUser</p>
            </div>
          </footer> */}
          <footer className="relative w-full border-t text-center text-sm text-gray-600 dark:text-gray-400 py-6 md:py-8">
            <div className="container mx-auto px-4 flex items-center justify-center">
              Copyright © 2025-PRESENT |
              <a href="https://github.com/WuChenDi/" className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 pl-2">
                wudi
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
};
