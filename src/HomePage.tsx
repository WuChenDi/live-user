import type { FC } from 'hono/jsx';
import { Layout } from './Layout';

interface HomePageProps {
  url: string;
}

export const HomePage: FC<HomePageProps> = ({ url }) => {
  return (
    <Layout>
      <div className="bg-gradient-to-br via-white to-indigo-50 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/30 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-12 text-center">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                  🚀 LiveUser Real-time Statistics
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Display the number of online users on your website in real-time, powered by WebSocket technology
                </p>
              </div>
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-lg border border-white/60">
                  <span className="text-base sm:text-lg font-medium text-gray-700">
                    Online Users:
                  </span>
                  <span id="liveuser" className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Connecting...
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-1 lg:grid-cols-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    🔧
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                    How to Use
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Add the following code to your webpage to integrate the LiveUser counter:
                </p>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">HTML</span>
                  </div>
                  <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap break-all sm:break-normal">
                    {`<div id="liveuser">Loading...</div>`} <br />
                    {`<script src="${url}/liveuser.js"></script>`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    ⚙️
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Customization Options
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Customize the LiveUser counter by adding query parameters to the script URL:
                </p>

                <div className="bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">HTML with Parameters</span>
                  </div>
                  <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap break-all sm:break-normal">
                    {`<script src="${url}/liveuser.js?siteId=your-site&displayElementId=custom-id&debug=true"></script>`}
                  </pre>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Available Parameters:
                  </h4>
                  <div className="grid gap-3 sm:gap-4">
                    {[
                      {
                        name: 'serverUrl',
                        desc: 'WebSocket server URL',
                        default: 'auto-detected from current protocol and host'
                      },
                      {
                        name: 'siteId',
                        desc: 'Site identifier',
                        default: "current domain or 'default-site'"
                      },
                      {
                        name: 'displayElementId',
                        desc: 'Element ID for displaying user count',
                        default: "'liveuser'"
                      },
                      {
                        name: 'reconnectDelay',
                        desc: 'Reconnect delay in milliseconds',
                        default: '3000'
                      },
                      {
                        name: 'debug',
                        desc: 'Enable debug logging',
                        default: 'true'
                      }
                    ].map((param, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-3 sm:p-4 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <code className="text-sm sm:text-base font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                            {param.name}
                          </code>
                          <span className="text-xs sm:text-sm text-gray-600 flex-1">
                            {param.desc}
                          </span>
                        </div>
                        <div className="mt-1 sm:mt-2 text-xs text-gray-500">
                          Default: <code className="bg-gray-100 px-1 rounded">{param.default}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-white/95 backdrop-blur-sm m-1 rounded-lg sm:rounded-xl p-6 sm:p-8">
                <div className="text-center space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ✨ Key Features
                  </h3>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { icon: '⚡', title: 'Real-time', desc: 'Instant updates' },
                      { icon: '🔄', title: 'Auto Reconnect', desc: 'Never miss a beat' },
                      { icon: '🎨', title: 'Customizable', desc: 'Fits your design' },
                      { icon: '📱', title: 'Responsive', desc: 'Works everywhere' }
                    ].map((feature, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                        <div className="text-lg sm:text-xl mb-1 sm:mb-2">{feature.icon}</div>
                        <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1">{feature.title}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{feature.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script src="/liveuser.js?siteId=official-website"></script>
    </Layout>
  );
};
