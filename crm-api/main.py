import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
VERIFY_TOKEN = "prospectai_seguro_2026"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="ProspectAI - CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MensagemCliente(BaseModel):
    telefone: str
    mensagem: str

@app.get("/")
def read_root():
    return {"status": "online", "mensagem": "API ProspectAI a correr!"}

# ==========================================
# 💻 ROTA DO PAINEL NEXT.JS (Teste Manual)
# ==========================================
@app.post("/chat")
def processar_mensagem(dados: MensagemCliente):
    print("👉 1. Mensagem recebida via Painel Next.js...")
    resposta_simulada = "Olá! Como assistente virtual, confirmo que a integração do CRM está a funcionar!"
    
    supabase.table('clientes').update({'status': 'em_atendimento'}).eq('telefone', dados.telefone).execute()
    
    return {
        "telefone": dados.telefone,
        "resposta_bot": resposta_simulada,
        "status_crm": "Atualizado para 'em_atendimento'"
    }

# ==========================================
# 🚀 ROTAS DO WHATSAPP OFICIAL (META CLOUD)
# ==========================================
@app.get("/webhook")
def verificar_webhook_meta(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == VERIFY_TOKEN:
            return Response(content=challenge, media_type="text/plain")
        else:
            return Response(content="Token inválido", status_code=403)
    return Response(content="Faltam parâmetros", status_code=400)


@app.post("/webhook")
async def receber_whatsapp_meta(request: Request):
    payload = await request.json()
    
    try:
        entry = payload.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if messages:
            mensagem_obj = messages[0]
            telefone_cliente = mensagem_obj.get("from")
            texto_mensagem = mensagem_obj.get("text", {}).get("body", "")
            
            # Tenta capturar o nome do perfil do WhatsApp (ex: Willyan Gabriel)
            contatos = value.get("contacts", [])
            nome_cliente = contatos[0].get("profile", {}).get("name", "Cliente") if contatos else "Cliente"

            print("\n" + "="*50)
            print("📲 NOVA MENSAGEM REAL DO WHATSAPP!")
            print(f"👤 Cliente: {nome_cliente} ({telefone_cliente})")
            print(f"💬 Mensagem: {texto_mensagem}")
            print("="*50)

            print("👉 A procurar cliente no Supabase...")
            
            # Verifica se o cliente já existe no banco
            resposta_db = supabase.table('clientes').select('*').eq('telefone', telefone_cliente).execute()
            
            if len(resposta_db.data) == 0:
                print("👉 Cliente novo! A criar card no CRM...")
                # Insere o cliente novo na coluna 'aguardando_bot'
                supabase.table('clientes').insert({
                    'nome': nome_cliente,
                    'telefone': telefone_cliente,
                    'status': 'aguardando_bot'
                }).execute()
            else:
                print("👉 Cliente já existe! A mover card para 'em_atendimento'...")
                # Move o cliente existente no funil
                supabase.table('clientes').update({'status': 'em_atendimento'}).eq('telefone', telefone_cliente).execute()
                
            print("✅ CRM atualizado com sucesso!")

    except Exception as e:
        # Ignora erros de status/recibos de leitura silenciosamente
        pass

    # A Meta exige resposta 200 rápida
    return {"status": "ok"}