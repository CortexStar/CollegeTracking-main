import { Info, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="h-16 w-full bg-slate-800 text-slate-100 dark:bg-gray-950">
      <div className="flex h-full items-center px-4">
        <span className="text-sm">© {new Date().getFullYear()} COURSE CHARTS</span>

        {/* Right-side icons */}
        <div className="ml-auto flex gap-4">
          <a
            href="#"
            className="text-gray-300 hover:text-white transition duration-200"
            aria-label="Information"
          >
            <Info className="h-5 w-5" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition duration-200"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
