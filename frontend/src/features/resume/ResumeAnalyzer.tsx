import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Upload,
  FileText,
  AlertCircle,
  ArrowRight,
  Award,
  Sparkles,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Improvement {
  section: string;
  currentText: string;
  suggestedText: string;
  reason: string;
}

interface ResumeData {
  _id: string;
  resumeUrl: string;
  createdAt: string;
  analysis: {
    overallFeedback: string;
    missingKeywords: string[];
    improvements: Improvement[];
  };
}

const fetchLatestResume = async () => {
  const response = await api.get('/resume/latest');
  return response.data.data.resume;
};

export default function ResumeAnalyzer() {
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState<string>('Uploading to storage...');

  // 1. Fetch latest analysis
  const { data: resume, isLoading } = useQuery<ResumeData | null>({
    queryKey: ['latestResume'],
    queryFn: fetchLatestResume,
  });

  // 2. Upload mutation
  const uploadResume = async (fileToUpload: File) => {
    setIsUploading(true);
    setLoaderMessage('Streaming document to cloud storage...');
    
    // Simulate loading updates
    const timers = [
      setTimeout(() => setLoaderMessage('Activating Gemini multimodal PDF engine...'), 2000),
      setTimeout(() => setLoaderMessage('Scanning formatting structure and parsing sections...'), 4500),
      setTimeout(() => setLoaderMessage('Extracting technical keywords and mapping deficiencies...'), 7000),
      setTimeout(() => setLoaderMessage('Optimizing bullet points and structuring suggestions...'), 9500),
    ];

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      timers.forEach((t) => clearTimeout(t));
      queryClient.invalidateQueries({ queryKey: ['latestResume'] });
    } catch (err) {
      console.error(err);
      alert('Upload failed. Ensure file is a valid PDF resume under 5MB.');
    } finally {
      timers.forEach((t) => clearTimeout(t));
      setIsUploading(false);
      setFile(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        uploadResume(droppedFile);
      } else {
        alert('Only PDF files are supported.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        uploadResume(selectedFile);
      } else {
        alert('Only PDF files are supported.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin mb-4" />
        <p className="text-zinc-550 text-xs font-light">Loading resume analyzer modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Resume Analyzer <Sparkles className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-zinc-400 text-sm font-light mt-1">
            Evaluate your resume using Google Gemini. Identify technical keywords and structure impact-driven metrics.
          </p>
        </div>
        {resume && (
          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-xs font-semibold rounded-lg cursor-pointer text-zinc-350 hover:text-white transition-all">
            <Upload className="w-3.5 h-3.5" /> Re-upload Resume
            <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Main Contents */}
      <AnimatePresence mode="wait">
        {/* State A: Loading Parser */}
        {isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-xl p-12 border border-zinc-900 bg-zinc-950/20 text-center flex flex-col items-center justify-center min-h-[400px] space-y-6"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-t-2 border-purple-500 animate-spin" />
              <FileText className="absolute w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Analyzing Resume Details</h3>
              <p className="text-xs text-zinc-500 font-mono max-w-xs mx-auto animate-pulse">
                {loaderMessage}
              </p>
            </div>
          </motion.div>
        ) : !resume ? (
          /* State B: Empty / Upload Cockpit */
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`glass-card rounded-xl border-2 border-dashed p-16 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-purple-500 bg-purple-500/5'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/10'
              }`}
            >
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="resume-input" />
              <label htmlFor="resume-input" className="cursor-pointer space-y-4 flex flex-col items-center">
                <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Drag & drop your resume</h3>
                  <p className="text-xs text-zinc-550">Only PDF files up to 5MB are accepted</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-650 hover:bg-purple-750 text-white text-xs font-semibold shadow-lg shadow-purple-500/10">
                  Select File
                </span>
              </label>
            </div>
          </motion.div>
        ) : (
          /* State C: Report view */
          <motion.div
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left metadata & general feedback */}
            <div className="lg:col-span-1 space-y-6">
              {/* Document card */}
              <div className="glass-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Active Document</h3>
                    <p className="text-[10px] text-zinc-550 mt-0.5">
                      Analyzed on{' '}
                      {new Date(resume.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <a
                  href={resume.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-805 text-zinc-350 hover:text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Resume
                </a>
              </div>

              {/* Overall Feedback */}
              <div className="glass-card rounded-xl p-6 border border-zinc-900 bg-zinc-950/20 space-y-4">
                <div className="flex items-center gap-2 text-purple-400">
                  <Award className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Overall Feedback</h3>
                </div>
                <p className="text-xs text-zinc-350 leading-relaxed font-light">
                  {resume.analysis.overallFeedback}
                </p>
              </div>

              {/* Missing keywords */}
              <div className="glass-card rounded-xl p-6 border border-zinc-900 bg-zinc-950/20 space-y-4">
                <div className="flex items-center gap-2 text-rose-455">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Missing Keywords</h3>
                </div>
                <p className="text-[10px] text-zinc-550 leading-relaxed font-light">
                  Incorporate these missing keywords in your project bullet points to bypass automated resume screeners.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {resume.analysis.missingKeywords.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-rose-500/20 bg-rose-950/10 text-rose-400 font-mono font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right detailed section modifications */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-white">Suggested Structural Enhancements</h2>
              <div className="space-y-4">
                {resume.analysis.improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="glass-card rounded-xl border border-zinc-900 overflow-hidden bg-zinc-950/10"
                  >
                    {/* Header title */}
                    <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950/30 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                        {imp.section}
                      </span>
                      <span className="text-[10px] text-zinc-550 font-mono">Suggestion {idx + 1}</span>
                    </div>

                    <div className="p-5 space-y-4 text-xs font-light leading-relaxed">
                      {/* Before diff */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold text-zinc-550 uppercase tracking-widest">
                          Original Text
                        </span>
                        <p className="p-3 bg-red-950/10 border border-red-500/10 text-zinc-400 rounded-lg">
                          &ndash; {imp.currentText}
                        </p>
                      </div>

                      {/* Transition arrow */}
                      <div className="flex justify-center text-zinc-700">
                        <ArrowRight className="w-5 h-5 rotate-90 sm:rotate-0" />
                      </div>

                      {/* Suggested text */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold text-emerald-450 uppercase tracking-widest">
                          Recommended Replacement
                        </span>
                        <p className="p-3 bg-emerald-950/10 border border-emerald-500/15 text-emerald-300 font-medium rounded-lg">
                          + {imp.suggestedText}
                        </p>
                      </div>

                      {/* Rationale explanation */}
                      <div className="pt-2 border-t border-zinc-900/60 mt-3 space-y-1">
                        <span className="block text-[10px] font-bold text-zinc-550 uppercase tracking-widest">
                          Why this works
                        </span>
                        <p className="text-zinc-400 text-xs font-light leading-relaxed">
                          {imp.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
