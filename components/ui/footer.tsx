import { Github, Mail, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl mx-auto max-w-6xl px-6 py-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/video-transcript-icon.jpg" alt="Video Transcript Player" className="h-8 w-8" />
              <h3 className="text-lg font-semibold text-white">ClariMeet</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-md">
              Experience seamless video playback with synchronized transcripts, live captions, and intelligent
              navigation. Built for modern web applications.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#api" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  API Docs
                </a>
              </li>
              <li>
                <a href="#examples" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Examples
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-medium text-white mb-3">Connect</h4>
            <div className="flex gap-3">
              <a
                href="https://github.com/clarimeet"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/20 rounded-lg transition-all"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/clarimeet"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/20 rounded-lg transition-all"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@clarimeet.com"
                className="p-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/20 rounded-lg transition-all"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-400/30 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-400">© 2024 ClariMeet. Built with modern web technologies.</p>
        </div>
      </div>
    </footer>
  )
}
