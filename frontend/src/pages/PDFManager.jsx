import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUpload, FaFilePdf, FaSpinner, FaBrain, 
  FaList, FaChartSimple, FaDownload, FaShare
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const PDFManager = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [studyMaterials, setStudyMaterials] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const pdfFiles = acceptedFiles.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }
    setFiles(prev => [...prev, ...pdfFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const processPDF = async (file) => {
    setProcessing(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setStudyMaterials(data);
      toast.success('PDF processado com sucesso!');
    } catch (error) {
      toast.error('Erro ao processar PDF');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent">
                Biblioteca Inteligente
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Upload de PDFs e transformação automática em materiais de estudo
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Area */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                  ${isDragActive 
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-300 dark:border-dark-100 hover:border-primary-500'}`}
              >
                <input {...getInputProps()} />
                <FaUpload className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste PDFs ou clique para enviar'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Suporta PDF, slides e documentos acadêmicos
                </p>
              </motion.div>

              {/* Files List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm"
              >
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                  Meus Documentos
                </h3>
                <div className="space-y-3">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-100 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FaFilePdf className="text-red-500" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => processPDF(file)}
                        disabled={processing}
                        className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm"
                      >
                        {processing ? <FaSpinner className="animate-spin" /> : 'Processar'}
                      </button>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum documento ainda. Envie seu primeiro PDF!
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Study Materials Generated */}
            {studyMaterials && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Summary */}
                <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FaBrain className="text-purple-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Resumo Inteligente
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {studyMaterials.summary}
                  </p>
                </div>

                {/* Flashcards */}
                <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FaList className="text-blue-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Flashcards Gerados
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {studyMaterials.flashcards?.map((card, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-dark-100 rounded-lg">
                        <p className="font-medium text-gray-800 dark:text-white">{card.question}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions */}
                <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FaChartSimple className="text-green-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Questões de Fixação
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {studyMaterials.questions?.map((q, idx) => (
                      <div key={idx}>
                        <p className="font-medium text-gray-800 dark:text-white">{q.question}</p>
                        <div className="mt-2 space-y-1">
                          {q.options?.map((opt, optIdx) => (
                            <label key={optIdx} className="flex items-center gap-2 text-sm text-gray-600">
                              <input type="radio" name={`q${idx}`} />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mind Map */}
                <div className="bg-white dark:bg-dark-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FaShare className="text-orange-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Mapa Mental
                    </h3>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg">
                    <div className="text-center text-sm text-gray-600">
                      {studyMaterials.mindMap}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PDFManager;