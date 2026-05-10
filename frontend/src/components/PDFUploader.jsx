// frontend/src/components/PDFUploader.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FaUpload, FaFilePdf, FaSpinner, FaCheckCircle, FaTimes, FaBook, FaLightbulb, FaBrain } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const PDFUploader = ({ user, onPDFProcessed }) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const pdfFiles = acceptedFiles.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }
    
    const newFiles = pdfFiles.map(file => ({
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      status: 'pending',
      id: Date.now() + Math.random()
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`${pdfFiles.length} arquivo(s) adicionado(s)`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const processPDF = async (fileItem) => {
    setProcessing(true);
    setSelectedFile(fileItem);
    
    setFiles(prev => prev.map(f => 
      f.id === fileItem.id ? { ...f, status: 'processing' } : f
    ));

    const formData = new FormData();
    formData.append('pdf', fileItem.file);

    try {
      const response = await axios.post('https://scholaros-5ncu.onrender.com/api/pdf/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });
      
      setProcessedData(response.data);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'completed' } : f
      ));
      
      // Chamar callback para registrar XP e histórico
      if (onPDFProcessed) {
        await onPDFProcessed(fileItem.name, response.data.metadata?.pageCount || 0);
      }
      
      toast.success('✅ PDF processado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('❌ Erro ao processar PDF. Tente novamente.');
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'pending' } : f
      ));
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      setProcessedData(null);
    }
    toast.success('Arquivo removido');
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'processing': return <FaSpinner className="animate-spin text-yellow-500" />;
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      default: return <FaFilePdf className="text-red-500" />;
    }
  };

  const formatMindMap = (mindMap) => {
    if (!mindMap) return ['Mapa mental gerado com sucesso!'];
    if (typeof mindMap === 'string') {
      return mindMap.split('\n').filter(line => line.trim());
    }
    return [String(mindMap)];
  };

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-purple-500'}`}
      >
        <input {...getInputProps()} />
        <FaUpload className="text-6xl text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {isDragActive ? 'Solte o arquivo aqui' : 'Arraste PDFs ou clique para enviar'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Suporta PDF, slides e documentos acadêmicos (max. 50MB)
        </p>
      </motion.div>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            Meus Documentos ({files.length})
          </h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size} MB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {file.status === 'pending' && (
                    <button
                      onClick={() => processPDF(file)}
                      disabled={processing}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold"
                    >
                      {processing ? <FaSpinner className="animate-spin" /> : 'Processar'}
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resultados do Processamento */}
      {processedData && selectedFile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Resumo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FaBook className="text-purple-500 text-xl" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Resumo Inteligente</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{processedData.summary}</p>
          </div>

          {/* Flashcards */}
          {processedData.flashcards && processedData.flashcards.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaLightbulb className="text-yellow-500 text-xl" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Flashcards Gerados</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedData.flashcards.map((card, idx) => (
                  <div key={idx} className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                    <p className="font-medium text-gray-800 dark:text-white">{card.question}</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">{card.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questões */}
          {processedData.questions && processedData.questions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaCheckCircle className="text-green-500 text-xl" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Questões de Fixação</h3>
              </div>
              <div className="space-y-6">
                {processedData.questions.map((q, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-0">
                    <p className="font-semibold mb-2">{idx + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options?.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-2 text-sm">
                          <input type="radio" name={`q${idx}`} />
                          <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapa Mental */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <FaBrain className="text-white text-xl" />
              <h3 className="text-xl font-semibold">🗺️ Mapa Mental</h3>
            </div>
            <div className="space-y-2">
              {formatMindMap(processedData.mindMap).map((line, idx) => (
                <p key={idx} className="text-white/90 text-sm leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PDFUploader;