from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas, crud
from backend.database import engine, get_db

# Cria as tabelas no DB se elas não existirem (incluindo Pedido e PedidoItem)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Choperia Digital API")

# Habilita CORS para o frontend em desenvolvimento (Vite padrão em localhost:8080)
# Ajuste `allow_origins` conforme o host/porta do seu frontend em dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carrega variáveis de ambiente do arquivo backend/.env (e como fallback tenta a raiz do projeto)
import logging
_logger = logging.getLogger("uvicorn.error")

# Tentar carregar .env a partir de alguns locais óbvios para evitar problemas com o reloader
env_paths_tried = []
backend_env = os.path.join(os.path.dirname(__file__), ".env")
root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

for path in (backend_env, root_env):
    env_paths_tried.append(path)
    if os.path.exists(path):
        load_dotenv(dotenv_path=path, override=False)
        _logger.info(f"Carregado .env de: {path}")
        break
else:
    # Nenhum .env encontrado nos caminhos esperados — ainda assim continuamos (variáveis podem vir do ambiente)
    _logger.info(f"Nenhum arquivo .env encontrado. Caminhos verificados: {env_paths_tried}")

# Log minimal indicando se a variável de ambiente do Mercado Pago foi carregada (não imprime o token)
_mp_token_present = bool(os.getenv("MERCADO_PAGO_ACCESS_TOKEN"))
_logger.info(f"MERCADO_PAGO_ACCESS_TOKEN present: {_mp_token_present}")


# Modelo mínimo para aceitar a requisição do frontend e repassar ao Mercado Pago
class MPPreferenceIn(BaseModel):
    items: Any
    back_urls: Dict[str, str]
    auto_return: Optional[str] = None
    external_reference: Optional[str] = None


@app.post("/mp/create_preference/", tags=["MercadoPago"])
def create_mp_preference(pref: MPPreferenceIn):
    """
    Cria uma preferência no Mercado Pago usando o token do backend (.env).
    Retorna o JSON bruto que o Mercado Pago devolve (incluindo init_point / sandbox_init_point).
    """
    token = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="MERCADO_PAGO_ACCESS_TOKEN not configured on the server")

    url = "https://api.mercadopago.com/checkout/preferences"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        resp = requests.post(url, headers=headers, json=pref.dict(exclude_none=True))
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Erro ao conectar ao Mercado Pago: {str(e)}")

    if not resp.ok:
        # repassar erro do Mercado Pago de forma controlada
        raise HTTPException(status_code=502, detail=f"Mercado Pago error: {resp.status_code} - {resp.text}")

    return resp.json()


# --- Rotas para Produtos ---

@app.get("/produtos/", response_model=List[schemas.Produto], status_code=status.HTTP_200_OK, tags=["Produtos"])
def read_produtos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retorna a lista de todos os produtos cadastrados."""
    produtos = crud.get_produtos(db, skip=skip, limit=limit)
    return produtos

@app.post("/produtos/", response_model=schemas.Produto, status_code=status.HTTP_201_CREATED, tags=["Produtos"])
def create_produto(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    """Cria um novo produto."""
    db_produto = crud.get_produto(db, produto_id=produto.id)
    if db_produto:
        raise HTTPException(status_code=400, detail="Produto ID already registered")
    return crud.create_produto(db=db, produto=produto)

@app.get("/produtos/{produto_id}", response_model=schemas.Produto, tags=["Produtos"])
def read_produto(produto_id: str, db: Session = Depends(get_db)):
    """Retorna um produto específico pelo ID."""
    db_produto = crud.get_produto(db, produto_id=produto_id)
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto not found")
    return db_produto

# --- Rota de Exemplo para Popular o Banco de Dados (Opcional) ---

# Use esta rota para popular o DB com os dados do seu frontend
from backend.data import initial_produtos # Importaremos de um novo arquivo 'data.py'

@app.post("/initialize_produtos/", tags=["Dev Tools"])
def initialize_produtos(db: Session = Depends(get_db)):
    """Adiciona a lista inicial de produtos do frontend ao banco de dados, se não existirem."""
    count = 0
    for prod_data in initial_produtos:
        # Usa um schema Pydantic para validar e garantir a tipagem
        produto_schema = schemas.ProdutoCreate(**prod_data) 
        if crud.get_produto(db, produto_id=produto_schema.id) is None:
            crud.create_produto(db, produto_schema)
            count += 1
    
    if count > 0:
        return {"message": f"{count} produtos iniciais adicionados com sucesso."}
    else:
        return {"message": "Todos os produtos iniciais já estavam cadastrados."}
    

# --- NOVAS Rotas para Pedidos ---


@app.post("/pedidos/", response_model=schemas.Pedido, status_code=status.HTTP_201_CREATED, tags=["Pedidos"])
def create_new_pedido(pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    """
    Cria um novo pedido (simula o checkout) com os itens do carrinho.
    
    O frontend deve enviar uma lista de {produto_id, quantity}.
    """
    if not pedido.items:
        raise HTTPException(status_code=400, detail="O pedido deve ter pelo menos um item.")
    
    try:
        return crud.create_pedido(db=db, pedido=pedido)
    except ValueError as e:
        # Captura o erro de produto não encontrado do CRUD
        raise HTTPException(status_code=404, detail=str(e))



@app.get("/pedidos/", response_model=List[schemas.Pedido], tags=["Pedidos"])
def list_pedidos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retorna a lista de todos os pedidos."""
    pedidos = crud.get_pedidos(db, skip=skip, limit=limit)
    return pedidos

@app.get("/pedidos/{pedido_id}", response_model=schemas.Pedido, tags=["Pedidos"])
def read_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Retorna um pedido específico pelo ID."""
    db_pedido = crud.get_pedido(db, pedido_id=pedido_id)
    if db_pedido is None:
        raise HTTPException(status_code=404, detail="Pedido not found")
    return db_pedido


