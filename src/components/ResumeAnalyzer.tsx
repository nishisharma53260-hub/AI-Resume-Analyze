import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, BarChart3, Lightbulb, Briefcase, GraduationCap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjsLib from 'pdfjs-dist';
import { analyzeResume, type AnalysisResult } from '../lib/gemini';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const extractTextFromPdf = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      throw new Error('Failed to extract text from PDF. Please try pasting the text instead.');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        setResumeText(text);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setResumeText(text);
      } else {
        setError('Unsupported file type. Please upload a PDF or TXT file.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both a resume and a job description.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeResume(resumeText, jobDescription);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <header className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium border border-emerald-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Powered by Gemini AI
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-bold tracking-tight text-slate-900"
        >
          ResuMatch AI
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-slate-500 max-w-2xl mx-auto"
        >
          Optimize your career path. Upload your resume and job description to get instant AI-powered feedback and suitability scores.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <h2>Job Description</h2>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description or role requirements here..."
              className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-slate-700 bg-slate-50/50"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2>Resume Content</h2>
            </div>
            
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50",
                fileName ? "bg-emerald-50/30 border-emerald-200" : ""
              )}
            >
              <input {...getInputProps()} />
              <Upload className={cn("w-10 h-10 mx-auto mb-4", fileName ? "text-emerald-500" : "text-slate-400")} />
              {fileName ? (
                <div className="space-y-1">
                  <p className="text-emerald-700 font-medium">{fileName}</p>
                  <p className="text-xs text-emerald-600">Click or drag to replace</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-slate-600 font-medium">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400">PDF or TXT files supported</p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Or paste text below</span>
              </div>
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (fileName) setFileName(null);
              }}
              placeholder="Paste your resume text here..."
              className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-slate-700 bg-slate-50/50"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !resumeText.trim() || !jobDescription.trim()}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20",
              isAnalyzing 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <BarChart3 className="w-6 h-6" />
                Analyze Suitability
              </>
            )}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </div>

        {/* Results Section */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Analysis Yet</h3>
                <p className="text-slate-500 max-w-xs">Upload your resume and job description to see your suitability score and improvement tips.</p>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Your Profile</h3>
                <p className="text-slate-500">Gemini is comparing your skills with the job requirements...</p>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Score Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-4">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * result.suitabilityScore) / 100}
                        className={cn(
                          "transition-all duration-1000 ease-out",
                          result.suitabilityScore >= 80 ? "text-emerald-500" : 
                          result.suitabilityScore >= 50 ? "text-amber-500" : "text-red-500"
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">{result.suitabilityScore}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Match Score</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Suitability Analysis</h3>
                    <div className="mt-4 text-slate-600 text-sm leading-relaxed">
                      <Markdown>{result.detailedFeedback}</Markdown>
                    </div>
                  </div>
                </div>

                {/* Skills & Qualifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <h3>Matching Skills</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.skillsFound.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <GraduationCap className="w-5 h-5 text-blue-500" />
                      <h3>Qualifications</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.qualifications.map((q, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Experience Highlights */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    <h3>Experience Highlights</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.experienceHighlights.map((exp, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvement Suggestions */}
                <div className="bg-emerald-900 rounded-2xl p-8 shadow-xl text-white space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-800 rounded-lg">
                      <Lightbulb className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Optimization Tips</h3>
                      <p className="text-emerald-300 text-sm">How to make your resume stand out</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {result.improvementSuggestions.map((suggestion, i) => (
                      <motion.li 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-start gap-3 group"
                      >
                        <div className="mt-1 p-0.5 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400/40 transition-colors">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-emerald-50 leading-relaxed">{suggestion}</p>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
