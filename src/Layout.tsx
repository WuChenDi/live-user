import type { FC, PropsWithChildren } from 'hono/jsx';

interface LayoutProps {
  title?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ title = 'LiveUser Demo', children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
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
          <header class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-4xl mx-auto px-4 py-4">
              <h1 class="text-2xl font-bold text-gray-800">LiveUser Demo</h1>
            </div>
          </header>
          <main class="flex-1 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl mx-auto">
              {children}
            </div>
          </main>
          <footer class="bg-white border-t border-gray-200 py-8 text-center">
            <div class="max-w-4xl mx-auto px-4">
              <p class="text-sm text-gray-500">Powered by LiveUser</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
};
