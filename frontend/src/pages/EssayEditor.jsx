function EssayEditor() {
  const [essay, setEssay] = React.useState('');
  const [analyzing, setAnalyzing] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);

  const analyzeEssay = async () => {
    if (!essay.trim()) {
      toast.error('Escreva sua redação primeiro!');
      return;
    }
    
    setAnalyzing(true);
    // Simular análise da IA
    setTimeout(() => {
      setFeedback({
        grade: Math.floor(Math.random() * (950 - 600) + 600),
        strengths: ['Boa estrutura textual', 'Argumentos coerentes', 'Uso adequado de conectivos'],
        improvements: ['Melhorar introdução', 'Desenvolver conclusão', 'Citar mais referências'],
        suggestions: ['Pratique revisão', 'Leia redações nota 1000', 'Faça exercícios de argumentação']
      });
      setAnalyzing(false);
      toast.success('Análise concluída!');
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">✍️ Editor de Redação com IA</h1>
          <p className="text-gray-600 mt-2">Escreva sua redação e receba feedback inteligente</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                placeholder="Escreva sua redação aqui..."
                className="w-full h-[500px] p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={analyzeEssay}
                disabled={analyzing}
                className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {analyzing ? 'Analisando...' : 'Analisar com IA'}
              </button>
            </div>
            
            <div>
              {feedback && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-purple-600 mb-4">Feedback da IA</h3>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold">{feedback.grade}/1000</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-600">✅ Pontos fortes</h4>
                      <ul className="list-disc pl-4 mt-1">
                        {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-600">⚠️ Melhorias</h4>
                      <ul className="list-disc pl-4 mt-1">
                        {feedback.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}