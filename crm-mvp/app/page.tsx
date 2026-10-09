"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DashboardSaaS() {
  // 1. Estados da nossa interface (Client Side)
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendas, setVendas] = useState<any[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<any | null>(null);
  const [mensagemTexto, setMensagemTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  // 2. Buscar dados do Supabase
  const carregarDados = async () => {
    const { data: clientesData } = await supabase.from('clientes').select('*').order('ultima_interacao', { ascending: false });
    const { data: vendasData } = await supabase.from('vendas').select('*');
    if (clientesData) setClientes(clientesData);
    if (vendasData) setVendas(vendasData);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // 3. Função para enviar mensagem à nossa API Python
  const enviarMensagem = async () => {
    if (!mensagemTexto.trim() || !clienteSelecionado) return;
    setEnviando(true);

    try {
      // Faz o POST para o FastAPI local
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: clienteSelecionado.telefone,
          mensagem: mensagemTexto
        })
      });

      if (res.ok) {
        setMensagemTexto('');
        setClienteSelecionado(null); // Fecha o modal
        await carregarDados(); // Recarrega o quadro Kanban para vermos o card a mover-se
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro ao contactar a API. O backend Python está ligado?");
    } finally {
      setEnviando(false);
    }
  };

  // 4. Cálculos das métricas
  const totalFaturado = vendas?.reduce((acc, venda) => acc + Number(venda.valor_total), 0) || 0;
  const totalLeads = clientes?.length || 0;
  const clientesCompraram = clientes?.filter(c => c.status === 'comprou').length || 0;
  const taxaConversao = totalLeads > 0 ? Math.round((clientesCompraram / totalLeads) * 100) : 0;

  // 5. Organizar o Funil
  const funil = {
    aguardando_bot: clientes?.filter(c => c.status === 'aguardando_bot') || [],
    em_atendimento: clientes?.filter(c => c.status === 'em_atendimento') || [],
    comprou: clientes?.filter(c => c.status === 'comprou') || [],
    nao_comprou: clientes?.filter(c => c.status === 'nao_comprou') || [],
  };

  // Componente visual de um Card clicável
  const CardCliente = ({ cliente }: { cliente: any }) => (
    <div 
      onClick={() => setClienteSelecionado(cliente)}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-400 transition-all"
    >
      <p className="font-semibold text-gray-900">{cliente.nome || 'Cliente Desconhecido'}</p>
      <p className="text-sm text-gray-500 mt-1">{cliente.telefone}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans relative">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Visão Geral do Atendimento</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Faturado</p>
              <p className="text-4xl font-bold text-green-600 mt-2">R$ {totalFaturado.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Leads no Funil</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{totalLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Taxa de Conversão</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{taxaConversao}%</p>
            </div>
          </div>
        </header>

        <h2 className="text-xl font-bold text-gray-800 mb-6">Pipeline de Clientes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {/* Coluna: Aguardando IA */}
          <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
              Aguardando Bot <span className="bg-gray-200 text-gray-600 py-1 px-3 rounded-full text-xs">{funil.aguardando_bot.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.aguardando_bot.map(c => <CardCliente key={c.id} cliente={c} />)}
            </div>
          </div>

          {/* Coluna: Em Atendimento */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-4 flex justify-between items-center">
              Em Atendimento <span className="bg-blue-200 text-blue-800 py-1 px-3 rounded-full text-xs">{funil.em_atendimento.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.em_atendimento.map(c => <CardCliente key={c.id} cliente={c} />)}
            </div>
          </div>

          {/* Coluna: Comprou */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <h3 className="font-bold text-green-800 mb-4 flex justify-between items-center">
              Comprou <span className="bg-green-200 text-green-800 py-1 px-3 rounded-full text-xs">{funil.comprou.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.comprou.map(c => <CardCliente key={c.id} cliente={c} />)}
            </div>
          </div>

          {/* Coluna: Não Comprou */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <h3 className="font-bold text-red-800 mb-4 flex justify-between items-center">
              Não Comprou <span className="bg-red-200 text-red-800 py-1 px-3 rounded-full text-xs">{funil.nao_comprou.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.nao_comprou.map(c => <CardCliente key={c.id} cliente={c} />)}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CHAT FLUTUANTE */}
      {clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-gray-800 p-4 flex justify-between items-center">
              <h3 className="text-white font-bold">Atendimento: {clienteSelecionado.nome || clienteSelecionado.telefone}</h3>
              <button onClick={() => setClienteSelecionado(null)} className="text-gray-300 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 bg-gray-50 h-64 overflow-y-auto">
              <p className="text-sm text-gray-500 text-center mb-4">Envie uma mensagem simulando o cliente. A IA (Python) irá processar e atualizar o CRM.</p>
              {/* O histórico de chat virá aqui no futuro */}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2 bg-white">
              <input 
                type="text" 
                value={mensagemTexto}
                onChange={(e) => setMensagemTexto(e.target.value)}
                placeholder="Ex: Olá, quero comprar..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
              />
              <button 
                onClick={enviarMensagem}
                disabled={enviando || !mensagemTexto.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}