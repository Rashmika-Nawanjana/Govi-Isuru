import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Upload, Loader2, CheckCircle, AlertTriangle, MapPin, Info,
  Microscope, Stethoscope, Shield, Calendar, Leaf, Activity, Brain,
  FileText, ChevronRight, Coffee, Flame
} from 'lucide-react';

const AIDoctor = ({ lang, user, onInteraction }) => {
  const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState(null);
  const [showGradCam, setShowGradCam] = useState(false);
  const [cropType, setCropType] = useState('rice'); // 'rice', 'tea', or 'chili'
  const [reportSaved, setReportSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const t = {
    en: {
      title: "Govi Isuru",
      sectionTitle: "🌾 AI Crop Diagnosis",
      subtitle: "The smart AI solution for farming",
      uploadTitle: "Upload Leaf Photo",
      uploadDesc: "Take a clear photo of the affected crop leaf for instant AI diagnosis.",
      dragDrop: "Drag & drop your image here, or click to browse",
      dragActive: "Drop your image here...",
      changeImage: "Click or drag to change image",
      analyzeBtn: "Analyze Disease (25 Credits)",
      analyzing: "Analyzing...",
      results: "Diagnosis Report",
      treatment: "Recommended Treatment",
      footer: "Empowering Sri Lankan Farmers",
      steps: ["Uploading image...", "Running AI analysis...", "Generating diagnosis..."],
      diseaseDetected: "Disease Detected",
      confidence: "AI Confidence",
      whyDiagnosis: "Why this diagnosis?",
      gradcamExplain: "Red/yellow areas show where the AI model focused to identify the disease.",
      gradcamTrust: "This visual proof helps ensure the diagnosis is reliable.",
      viewAnalysis: "View AI Analysis",
      hide: "Hide",
      show: "Show",
      description: "Description",
      context: "Diagnosis Context",

      selectCrop: "Select Crop Type",
      rice: "Paddy",
      tea: "Tea",
      chili: "Chili",
      riceDesc: "Analyze paddy leaf diseases",
      teaDesc: "Analyze tea leaf diseases",
      chiliDesc: "Analyze chili plant diseases"
    },
    si: {
      title: "ගොවි ඉසුරු",
      sectionTitle: "🌾 AI බෝග රෝග විනිශ්චය",
      subtitle: "ගොවිතැනට සුහුරු AI විසඳුම",
      uploadTitle: "පත්‍ර ඡායාරූපය උඩුගත කරන්න",
      uploadDesc: "ක්ෂණික AI විශ්ලේෂණය සඳහා බලපෑමට ලක් වූ බෝග පත්‍රයේ පැහැදිලි ඡායාරූපයක් ගන්න.",
      dragDrop: "ඔබගේ රූපය මෙහි ඇදගෙන එන්න, නැතහොත් බ්‍රවුස් කිරීමට ක්ලික් කරන්න",
      dragActive: "ඔබගේ රූපය මෙහි දමන්න...",
      changeImage: "රූපය වෙනස් කිරීමට ක්ලික් කරන්න හෝ ඇදගෙන එන්න",
      analyzeBtn: "පරීක්ෂා කරන්න (ණය 25)",
      analyzing: "විශ්ලේෂණය කරමින්...",
      results: "රෝග විනිශ්චය වාර්තාව",
      treatment: "නිර්දේශිත ප්‍රතිකාර",
      footer: "ශ්‍රී ලාංකීය ගොවීන් සවිබල ගැන්වීම",
      steps: ["පින්තූරය උඩුගත කරමින්...", "AI විශ්ලේෂණය ක්‍රියාත්මක කරමින්...", "විශ්ලේෂණය ජනනය කරමින්..."],
      diseaseDetected: "හඳුනාගත් රෝගය",
      confidence: "AI විශ්වාසනීයත්වය",
      whyDiagnosis: "මෙම විනිශ්චය ඇයි?",
      gradcamExplain: "රතු/කහ ප්‍රදේශ AI ආකෘතිය රෝගය හඳුනා ගැනීමට අවධානය යොමු කළ ස්ථාන පෙන්වයි.",
      gradcamTrust: "මෙම දෘශ්‍ය සාක්ෂිය විශ්ලේෂණය විශ්වසනීය බව සහතික කරයි.",
      viewAnalysis: "AI විශ්ලේෂණය බලන්න",
      hide: "සඟවන්න",
      show: "පෙන්වන්න",
      description: "විස්තරය",
      context: "විශ්ලේෂණ සන්දර්භය",

      selectCrop: "බෝග වර්ගය තෝරන්න",
      rice: "වී",
      tea: "තේ",
      chili: "මිරිස්",
      riceDesc: "වී පත්‍ර රෝග විශ්ලේෂණය",
      teaDesc: "තේ පත්‍ර රෝග විශ්ලේෂණය",
      chiliDesc: "මිරිස් ශාක රෝග විශ්ලේෂණය"
    }
  };

  const text = t[lang] || t.en;

  const processFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setAnalysisStep(0);
      setReportSaved(false);
    }
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setShowGradCam(false);
    setAnalysisStep(1);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate step progression for UX
      setTimeout(() => setAnalysisStep(2), 800);
      setTimeout(() => setAnalysisStep(3), 1600);

      // Use crop-specific endpoint
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/api/ai/predict/${cropType}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;

      const mappedResult = {
        disease: data.prediction,
        si_name: data.si_name,
        confidence: data.confidence,
        treatment: Array.isArray(data.treatment) ? data.treatment.join('\n• ') : data.treatment,
        treatment_list: data.treatment,
        description: data.description,
        severity: data.severity,
        all_predictions: data.all_predictions,
        gradcam: data.gradcam,
        crop_type: data.crop_type
      };

      setResult(mappedResult);
      if (onInteraction) onInteraction();

      // Automatically save disease report if user is logged in and disease detected
      if (user && data.prediction && !data.prediction.toLowerCase().includes('healthy')) {
        await saveDiseaseReport(data, cropType);
      }
    } catch (error) {
      console.error("Error connecting to AI service", error);

      if (error.response && error.response.status === 403) {
        alert(lang === 'en'
          ? "⚠️ Insufficient Credits! Please top up to continue."
          : "⚠️ ප්‍රමාණවත් මුදල් නොමැත! කරුණාකර නැවත ආරෝපණය කරන්න.");
        window.dispatchEvent(new CustomEvent('open-credit-purchase'));
        return;
      }

      alert(lang === 'en'
        ? "Unable to connect to AI service. Please try again."
        : "AI සේවාවට සම්බන්ධ විය නොහැක. නැවත උත්සාහ කරන්න.");
    } finally {
      setLoading(false);
      setAnalysisStep(0);
    }
  };

  const saveDiseaseReport = async (predictionData, crop) => {
    try {
      const token = localStorage.getItem('token');

      // Convert image to base64
      let imageBase64 = '';
      if (file) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const reportData = {
        title: `${crop.charAt(0).toUpperCase() + crop.slice(1)} - ${predictionData.prediction}`,
        description: predictionData.description || 'Disease detected by AI Crop Doctor',
        image_url: imageBase64 || '',
        ai_prediction: predictionData.prediction,
        confidence_score: predictionData.confidence || 0,
        report_type: 'disease'
      };

      const response = await axios.post(
        `${API_BASE}/api/reports/submit`,
        reportData,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.data.success) {
        setReportSaved(true);
        console.log('Disease report submitted:', response.data);

        alert(lang === 'en'
          ? '✅ Report submitted to agricultural instructors for verification. You will be notified once verified.'
          : '✅ වාර්තාව සත්‍යාපනය සඳහා ඩිජිටල් අධිකරණ ක්‍ෂේත්‍ර නිලධාරීන්ට ඉදිරිපත් කරන ලද බව සිතුවිලි ලබන ඉතිරි කිරීමයි।');
      }
    } catch (error) {
      console.error('Error saving disease report:', error);
      const errorMsg = error.response?.data?.msg || error.response?.data?.error;
      alert(lang === 'en'
        ? (errorMsg || 'Error submitting report. Please try again.')
        : (errorMsg || 'වාර්තාව ඉදිරිපත් කිරීමේ දෝෂය. නැවත උත්සාහ කරන්න.'));
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'high': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500' };
      case 'medium': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500' };
      case 'none': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500' };
      default: return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500' };
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-LK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="font-sans text-gray-800 dark:text-gray-200 w-full">
      {/* Section Header - Minimal Mobile Padding */}
      <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-2 md:p-4 shadow-sm border border-slate-100 dark:border-gray-700 mb-2 md:mb-4">
        <h2 className="text-sm md:text-xl font-bold text-green-800 dark:text-green-400 flex items-center gap-1.5">
          <Stethoscope className="h-4 w-4 md:h-6 md:w-6 flex-shrink-0" />
          {text.sectionTitle}
        </h2>
        <p className="text-[10px] md:text-sm text-slate-500 dark:text-gray-400 mt-0.5">{text.subtitle}</p>
      </div>

      {/* Crop Type Selector - Show Names with Emojis */}
      <div className="mb-2 md:mb-4">
        <label className="block text-[10px] md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 px-0.5">{text.selectCrop}</label>
        <div className="grid grid-cols-3 gap-1.5 md:gap-3">{/* Rice Button */}
          <button
            onClick={() => { setCropType('rice'); setResult(null); }}
            className={`flex flex-col items-center gap-1 p-1.5 md:p-3 rounded-lg md:rounded-xl border-2 transition-all active:scale-95 shadow-sm ${cropType === 'rice'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md'
              : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 hover:bg-green-50/30'
              }`}
          >
            <div className={`p-1 md:p-2 rounded-lg flex-shrink-0 ${cropType === 'rice' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300'}`}>
              <Leaf className="h-3.5 w-3.5 md:h-5 md:w-5" />
            </div>
            <div className="text-center">
              <div className={`font-semibold text-[10px] md:text-sm ${cropType === 'rice' ? 'text-green-700' : 'text-slate-700'}`}>
                🌾 {text.rice}
              </div>
            </div>
          </button>

          {/* Tea Button */}
          <button
            onClick={() => { setCropType('tea'); setResult(null); }}
            className={`flex flex-col items-center gap-1 p-1.5 md:p-3 rounded-lg md:rounded-xl border-2 transition-all active:scale-95 shadow-sm ${cropType === 'tea'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md'
              : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 hover:bg-green-50/30'
              }`}
          >
            <div className={`p-1 md:p-2 rounded-lg flex-shrink-0 ${cropType === 'tea' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300'}`}>
              <Coffee className="h-3.5 w-3.5 md:h-5 md:w-5" />
            </div>
            <div className="text-center">
              <div className={`font-semibold text-[10px] md:text-sm ${cropType === 'tea' ? 'text-green-700' : 'text-slate-700'}`}>
                🍵 {text.tea}
              </div>
            </div>
          </button>

          {/* Chili Button */}
          <button
            onClick={() => { setCropType('chili'); setResult(null); }}
            className={`flex flex-col items-center gap-1 p-1.5 md:p-3 rounded-lg md:rounded-xl border-2 transition-all active:scale-95 shadow-sm ${cropType === 'chili'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/30 shadow-md'
              : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-red-300 hover:bg-red-50/30'
              }`}
          >
            <div className={`p-1 md:p-2 rounded-lg flex-shrink-0 ${cropType === 'chili' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300'}`}>
              <Flame className="h-3.5 w-3.5 md:h-5 md:w-5" />
            </div>
            <div className="text-center">
              <div className={`font-semibold text-[10px] md:text-sm ${cropType === 'chili' ? 'text-red-700' : 'text-slate-700'}`}>
                🌶️ {text.chili}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Upload Card - Minimal Padding */}
      <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
        <div className="p-2 md:p-4">{/* Upload Area */}
          <div
            onClick={handleUploadAreaClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-2 md:p-4 transition-all duration-300 cursor-pointer select-none ${
              isDragging
                ? 'border-green-500 bg-green-50 scale-[1.02] shadow-lg'
                : preview
                  ? 'border-green-400 bg-green-50/50 hover:border-green-500 hover:bg-green-50'
                  : 'border-slate-300 hover:border-green-400 hover:bg-green-50/30'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              {isDragging ? (
                <div className="w-full py-8 md:py-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex flex-col items-center justify-center">
                  <div className="p-3 md:p-4 bg-white rounded-full shadow-lg mb-2 animate-bounce">
                    <Upload className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  </div>
                  <p className="text-xs md:text-base text-green-700 font-bold">{text.dragActive}</p>
                </div>
              ) : preview ? (
                <div className="relative w-full group">
                  <img
                    src={preview}
                    alt="Crop preview"
                    className="w-full max-h-40 md:max-h-64 object-cover rounded-lg shadow-sm transition-all duration-300 group-hover:brightness-90"
                  />
                  <div className="absolute top-1 right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-[9px] md:text-xs font-bold flex items-center gap-1 shadow-md">
                    <CheckCircle className="h-2.5 w-2.5" /> Ready
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-lg">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-[10px] md:text-xs font-semibold text-green-700">{text.changeImage}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full py-4 md:py-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-lg flex flex-col items-center justify-center">
                  <div className="p-2 md:p-3 bg-white dark:bg-gray-600 rounded-full shadow-md mb-1">
                    <Upload className="h-5 w-5 md:h-7 md:w-7 text-green-500" />
                  </div>
                  <p className="text-[10px] md:text-sm text-slate-600 dark:text-gray-300 font-medium">{text.uploadTitle}</p>
                  <p className="text-[9px] md:text-xs text-slate-400 dark:text-gray-400 mt-0.5 text-center px-2">{text.uploadDesc}</p>
                  <p className="text-[8px] md:text-xs text-green-500 mt-1.5 font-medium">{text.dragDrop}</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className={`w-full mt-2 py-2.5 md:py-3.5 rounded-lg md:rounded-xl font-bold text-white text-xs md:text-base flex flex-col items-center justify-center gap-1 shadow-md transition-all duration-300 active:scale-95 ${!file ? 'bg-slate-300 cursor-not-allowed' : loading ? 'bg-green-600' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-lg'
              }`}
          >
            {loading ? (
              <>
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-3.5 w-3.5 md:h-5 md:w-5" />
                  <span>{text.analyzing}</span>
                </div>
                <div className="flex items-center gap-2 text-[8px] md:text-xs text-green-200 mt-0">
                  {analysisStep > 0 && (
                    <>
                      <Activity className="h-2.5 w-2.5" />
                      <span>{text.steps[analysisStep - 1]}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Microscope className="h-3.5 w-3.5 md:h-5 md:w-5" />
                <span>{text.analyzeBtn}</span>
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      {result && <hr className="my-8 border-green-100 dark:border-gray-700" />}

      {/* Results - Medical Report Style */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
          {/* Report Saved Status */}
          {reportSaved && user && (
            <div className="bg-green-600 text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  {lang === 'en'
                    ? '✓ Report automatically saved and sent to agricultural instructors in your area'
                    : '✓ වාර්තාව ස්වයංක්‍රීයව සුරකින ලද අතර ඔබගේ ප්‍රදේශයේ රජයේ නිලධාරීන් වෙත යවන ලදී'}
                </span>
              </div>
            </div>
          )}
          {/* Report Header */}
          <div className={`px-6 py-4 border-b-2 ${getSeverityStyle(result.severity).bg} ${getSeverityStyle(result.severity).border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.severity === 'none' ? (
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <div className={`p-2 ${getSeverityStyle(result.severity).badge} rounded-lg`}>
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    {text.results}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">AI-Powered Analysis • Govi Isuru</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getSeverityStyle(result.severity).badge}`}>
                {result.severity === 'none' ? '✓ Healthy' : result.severity === 'high' ? '⚠ High Risk' : '⚡ Moderate'}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Farmer Context Box */}
            {user && (
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
                <p className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider mb-2">{text.context}</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{user.gnDivision || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Leaf className="h-4 w-4 text-slate-400" />
                    <span>{cropType === 'rice' ? text.rice : cropType === 'tea' ? text.tea : text.chili}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{formatDate()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Disease Detection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🦠</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{text.diseaseDetected}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.disease}</p>
              {result.si_name && result.si_name !== result.disease && (
                <p className="text-base text-gray-500 dark:text-gray-400">{result.si_name}</p>
              )}
            </div>

            {/* Confidence Meter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{text.confidence}</span>
                <span className="ml-auto text-lg font-bold text-gray-900 dark:text-white">{(result.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${result.confidence > 0.75 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    result.confidence > 0.5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* Description */}
            {result.description && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{text.description}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{result.description}</p>
              </div>
            )}

            {/* Grad-CAM Visualization - Enhanced */}
            {result.gradcam && (
              <div className="border border-purple-200 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50">
                <button
                  onClick={() => setShowGradCam(!showGradCam)}
                  className="w-full p-4 flex items-center justify-between text-sm font-bold text-purple-700 hover:bg-purple-100/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    <span>🧠 {text.whyDiagnosis}</span>
                  </span>
                  <span className="text-xs bg-purple-200 px-3 py-1 rounded-full">
                    {showGradCam ? text.hide : text.show}
                  </span>
                </button>
                {showGradCam && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-purple-600 text-center bg-purple-100 rounded-lg p-2">
                      💡 {text.gradcamExplain}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-500 mb-2">Original</p>
                        <img src={preview} alt="Original" className="w-full h-36 object-cover rounded-xl shadow-md" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-500 mb-2">AI Focus</p>
                        <img
                          src={`data:image/png;base64,${result.gradcam.overlay}`}
                          alt="Grad-CAM"
                          className="w-full h-36 object-cover rounded-xl shadow-md"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-center text-gray-500 italic flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" /> {text.gradcamTrust}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Treatment */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💊</span>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{text.treatment}</span>
              </div>
              {result.treatment_list ? (
                <ul className="space-y-2">
                  {result.treatment_list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 text-sm">{result.treatment}</p>
              )}
            </div>

            {/* Submit Report Button */}
            {user && !reportSaved && result.disease && !result.disease.toLowerCase().includes('healthy') && (
              <button
                onClick={() => saveDiseaseReport(result, cropType)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <FileText size={20} />
                {lang === 'en'
                  ? '📋 Submit Report to Agricultural Instructors'
                  : '📋 රජයේ නිලධාරීන්ට වාර්තාව ඉදිරිපත් කරන්න'}
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AIDoctor;
