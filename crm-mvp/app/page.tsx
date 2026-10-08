import { supabase } from '../lib/supabase';
export const instant = false;
// Garante que o painel mostre os dados mais recentes sem usar cache estático

export default async function DashboardSaaS() {
  // 1. Buscar clientes e vendas no Supabase (COM RADAR DE ERROS ATIVADO)
  const { data: clientes, error: erroClientes } = await supabase
    .from('clientes')
    .select('*')
    .order('ultima_interacao', { ascending: false });

  const { data: vendas, error: erroVendas } = await supabase
    .from('vendas')
    .select('*');

  // RADAR: Isto vai imprimir o erro secreto no terminal do VS Code
  console.log("👉 ERRO CLIENTES:", erroClientes);
  console.log("👉 ERRO VENDAS:", erroVendas);
  console.log("👉 DADOS CLIENTES:", clientes);

  // 2. Calcular as métricas financeiras e de conversão
  const totalFaturado = vendas?.reduce((acc, venda) => acc + Number(venda.valor_total), 0) || 0;
  const totalLeads = clientes?.length || 0;
  
  const clientesCompraram = clientes?.filter(c => c.status === 'comprou').length || 0;
  const taxaConversao = totalLeads > 0 ? Math.round((clientesCompraram / totalLeads) * 100) : 0;

  // 3. Organizar os clientes para o Kanban
  const funil = {
    aguardando_bot: clientes?.filter(c => c.status === 'aguardando_bot') || [],
    em_atendimento: clientes?.filter(c => c.status === 'em_atendimento') || [],
    comprou: clientes?.filter(c => c.status === 'comprou') || [],
    nao_comprou: clientes?.filter(c => c.status === 'nao_comprou') || [],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho e Métricas */}
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

        {/* Quadro Kanban */}
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-800">Pipeline de Clientes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          
          {/* Coluna: Aguardando IA */}
          <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
              Aguardando Bot 
              <span className="bg-gray-200 text-gray-600 py-1 px-3 rounded-full text-xs">{funil.aguardando_bot.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.aguardando_bot.map(cliente => (
                <div key={cliente.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-gray-900">{cliente.nome || 'Cliente Desconhecido'}</p>
                  <p className="text-sm text-gray-500 mt-1">{cliente.telefone}</p>
                </div>
              ))}
              {funil.aguardando_bot.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum cliente aqui.</p>}
            </div>
          </div>

          {/* Coluna: Em Atendimento */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-4 flex justify-between items-center">
              Em Atendimento 
              <span className="bg-blue-200 text-blue-800 py-1 px-3 rounded-full text-xs">{funil.em_atendimento.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.em_atendimento.map(cliente => (
                <div key={cliente.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-gray-900">{cliente.nome || 'Cliente Desconhecido'}</p>
                  <p className="text-sm text-gray-500 mt-1">{cliente.telefone}</p>
                </div>
              ))}
              {funil.em_atendimento.length === 0 && <p className="text-sm text-blue-300 text-center py-4">Nenhum atendimento ativo.</p>}
            </div>
          </div>

          {/* Coluna: Comprou */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <h3 className="font-bold text-green-800 mb-4 flex justify-between items-center">
              Comprou 
              <span className="bg-green-200 text-green-800 py-1 px-3 rounded-full text-xs">{funil.comprou.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.comprou.map(cliente => (
                <div key={cliente.id} className="bg-white p-4 rounded-lg shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-gray-900">{cliente.nome || 'Cliente Desconhecido'}</p>
                  <p className="text-sm text-gray-500 mt-1">{cliente.telefone}</p>
                </div>
              ))}
              {funil.comprou.length === 0 && <p className="text-sm text-green-300 text-center py-4">Nenhuma venda ainda.</p>}
            </div>
          </div>

          {/* Coluna: Não Comprou */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <h3 className="font-bold text-red-800 mb-4 flex justify-between items-center">
              Não Comprou 
              <span className="bg-red-200 text-red-800 py-1 px-3 rounded-full text-xs">{funil.nao_comprou.length}</span>
            </h3>
            <div className="space-y-3">
              {funil.nao_comprou.map(cliente => (
                <div key={cliente.id} className="bg-white p-4 rounded-lg shadow-sm border border-red-200 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-gray-900">{cliente.nome || 'Cliente Desconhecido'}</p>
                  <p className="text-sm text-gray-500 mt-1">{cliente.telefone}</p>
                </div>
              ))}
              {funil.nao_comprou.length === 0 && <p className="text-sm text-red-300 text-center py-4">Nenhum lead perdido.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}