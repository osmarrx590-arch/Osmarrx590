# Backend (FastAPI) para Chope Pay Gateway

Passos rápidos para rodar localmente:

1. Criar e ativar um ambiente virtual (recomendado):

   python -m venv .venv
   # Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1

2. Instalar dependências

   pip install -r requirements.txt

   ou

   python.exe -m pip install fastapi "uvicorn[standard]" SQLAlchemy requests python-dotenv pydantic

3. Copiar `.env.example` para `.env` e ajustar `MERCADO_PAGO_ACCESS_TOKEN` e outras variáveis

4. Rodar o servidor (uvicorn)

- Se estiver em backend
cd..

   uvicorn backend.main:app --reload --port 8000

Endpoints principais:
- GET /health
- GET /cart
- POST /cart
- DELETE /cart/{id}
- POST /create-preference  -> envia payload para Mercado Pago e retorna `checkout_url`

Observações:
- O token do Mercado Pago deve ser de usuário de teste (conta de teste) para evitar cobranças reais.
- Mercado Pago rejeita `back_urls` que apontam para `localhost`/`127.0.0.1` para auto_return. Para testar callbacks automáticos, use uma URL pública (ngrok, localtunnel etc.) ou teste apenas o redirecionamento manual.
