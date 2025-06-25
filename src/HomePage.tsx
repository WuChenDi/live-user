import type { FC } from 'hono/jsx';
import { Layout } from './Layout';

interface HomePageProps {
  url: string;
}

export const HomePage: FC<HomePageProps> = ({ url }) => {
  return (
    <Layout>
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-8">
        <div>
          <div
            id="liveuser"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-8 rounded-full font-semibold text-xl inline-block transition-all duration-300 hover:shadow-md"
          >
            Connecting...
          </div>
        </div>

        <div className="bg-blue-50 p-8 rounded-xl border-l-4 border-blue-600 space-y-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <span>📊</span> Real-time User Statistics
          </h3>
          <p className="text-gray-600 leading-relaxed">
            This tool displays the number of online users on your website in real-time, powered by WebSocket technology.
          </p>
        </div>

        <div className="bg-blue-50 p-8 rounded-xl border-l-4 border-blue-600 space-y-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <span>🔧</span> How to Use
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Add the following code to your webpage to integrate the LiveUser counter:
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg text-left font-mono text-sm text-gray-800 border border-gray-200 overflow-x-auto shadow-sm">
            {`<div id="liveuser">Loading...</div>\n<script src="${url}/liveuser.js"></script>`}
          </pre>
        </div>

        <div className="bg-blue-50 p-8 rounded-xl border-l-4 border-blue-600 space-y-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <span>⚙️</span> Customization Options
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Customize the LiveUser counter by adding query parameters to the script URL:
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg text-left font-mono text-sm text-gray-800 border border-gray-200 overflow-x-auto shadow-sm">
            {`<script src="${url}/liveuser.js?siteId=your-site&displayElementId=custom-id&debug=true"></script>`}
          </pre>
          <div className="space-y-3 text-left text-gray-700">
            <h4 className="text-lg font-semibold text-gray-800">Available Parameters:</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="font-medium">serverUrl</strong>: WebSocket server URL
                <span className="text-gray-500"> (default: auto-detected from current protocol and host)</span>
              </li>
              <li>
                <strong className="font-medium">siteId</strong>: Site identifier
                <span className="text-gray-500"> (default: current domain or 'default-site')</span>
              </li>
              <li>
                <strong className="font-medium">displayElementId</strong>: Element ID for displaying user count
                <span className="text-gray-500"> (default: 'liveuser')</span>
              </li>
              <li>
                <strong className="font-medium">reconnectDelay</strong>: Reconnect delay in milliseconds
                <span className="text-gray-500"> (default: 3000)</span>
              </li>
              <li>
                <strong className="font-medium">debug</strong>: Enable debug logging
                <span className="text-gray-500"> (default: true)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <script src="/liveuser.js?siteId=official-website"></script>
    </Layout>
  );
};
