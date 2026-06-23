import { MessageCircle, Mail, Globe, Shield } from "lucide-react";

interface FooterProps {
  onSetActiveView: (
    view:
      | "dashboard"
      | "shop"
      | "missions"
      | "settings"
      | "forum"
      | "leaderboard"
      | "privacy"
      | "terms"
      | "rules"
  ) => void;
}

export default function Footer({ onSetActiveView }: FooterProps) {
  return (
    <footer className="hidden md:block relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-300 py-8 sm:py-12 border-t-2 border-orange-500/40 shadow-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 4px,
                rgba(249, 115, 22, 0.1) 4px,
                rgba(249, 115, 22, 0.1) 8px
              )
            `,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-radial from-orange-500/5 via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-center md:justify-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BS</span>
                </div>
                <span>BigSlick Games</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Premier online gaming platform delivering exciting poker and
                card games with competitive gameplay and generous rewards.
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <div className="flex items-center space-x-1 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/40">
                  <Globe className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-orange-400 text-xs font-semibold">
                    Trusted Platform
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="text-white font-bold text-base mb-4 flex items-center justify-center md:justify-start space-x-2">
                <Shield className="w-4 h-4 text-orange-400" />
                <span>Legal & Support</span>
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => onSetActiveView("privacy")}
                    className="text-gray-400 hover:text-blue-400 transition-all duration-200 text-sm hover:translate-x-1 inline-block"
                  >
                    → Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSetActiveView("terms")}
                    className="text-gray-400 hover:text-purple-400 transition-all duration-200 text-sm hover:translate-x-1 inline-block"
                  >
                    → Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSetActiveView("rules")}
                    className="text-gray-400 hover:text-green-400 transition-all duration-200 text-sm hover:translate-x-1 inline-block"
                  >
                    → Community Guidelines
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="text-center md:text-left">
              <h4 className="text-white font-bold text-base mb-4 flex items-center justify-center md:justify-start space-x-2">
                <MessageCircle className="w-4 h-4 text-orange-400" />
                <span>Get In Touch</span>
              </h4>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-orange-500/30 mb-3">
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                  <Mail className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-semibold text-sm">
                    Email Support
                  </span>
                </div>
                <a
                  href="mailto:bigslickgames@gmail.com"
                  className="text-orange-400 hover:text-orange-300 transition-colors duration-200 text-sm font-medium hover:underline block"
                >
                  bigslickgames@gmail.com
                </a>
                <p className="text-gray-400 text-xs mt-2">
                  📧 Response time: 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent mb-6"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()}{" "}
              <span className="text-orange-400 font-semibold">
                BigSlick Games
              </span>
              . All rights reserved.
            </p>

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Built for gamers</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Version 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
