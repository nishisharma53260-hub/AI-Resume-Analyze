/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ResumeAnalyzer from './components/ResumeAnalyzer';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <ResumeAnalyzer />
      
      <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} ResuMatch AI. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

