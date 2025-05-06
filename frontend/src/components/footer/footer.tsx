import Image from "next/image";
import {
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandGithub,
} from "@tabler/icons-react";

export default function Footer() {
  return (
    <footer className="w-full bg-neutral-900 text-white py-8">
      {/* Kaleidoscope Title */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-2">
          <Image
            src="/icon.png"
            alt="Kaleidoscope Logo"
            width={32}
            height={32}
            className="object-cover rounded-full"
          />
          <h2 className="text-3xl font-semibold">Kaleidoscope</h2>
        </div>
      </div>

      {/* Links Section */}
      <div className="text-center mb-8">
        <ul className="flex justify-center space-x-4 text-lg">
          <li><a href="/contact" className="hover:text-slate-400">Contact</a></li>
          <li><a href="/docs" className="hover:text-slate-400">Docs</a></li>
          <li><a href="/api" className="hover:text-slate-400">API</a></li>
          <li><a href="/privacy" className="hover:text-slate-400">Privacy</a></li>
          <li><a href="/terms" className="hover:text-slate-400">Terms</a></li>
        </ul>
      </div>

      {/* Social Media Icons */}
      <div className="flex justify-center space-x-6 mb-8">
        <a href="https://twitter.com" target="_blank" className="text-white hover:text-slate-400">
          <IconBrandTwitter size={24} />
        </a>
        <a href="https://linkedin.com" target="_blank" className="text-white hover:text-slate-400">
          <IconBrandLinkedin size={24} />
        </a>
        <a href="https://github.com" target="_blank" className="text-white hover:text-slate-400">
          <IconBrandGithub size={24} />
        </a>
      </div>

      {/* Copyright */}
      <div className="text-center text-sm text-slate-400">
        <p>&copy; 2025 Kaleidoscope. All rights reserved.</p>
      </div>
    </footer>
  );
}
