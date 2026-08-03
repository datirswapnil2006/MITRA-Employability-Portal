import { Link } from "react-router-dom";
import Logo from "./common/Logo";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 px-6 md:px-16 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo variant="dark" size="sm" showSubtitle={true} />

        <div className="flex items-center gap-6 text-xs font-semibold text-slate-400">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/login" className="hover:text-white transition-colors">Student Login</Link>
        </div>

        <div className="text-xs text-slate-500 font-medium text-center md:text-right">
          &copy; {new Date().getFullYear()} MITRA Employability Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
