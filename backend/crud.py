from sqlalchemy.orm import Session
from backend import models, schemas
from typing import List

# --- Funções CRUD de Produto (existentes) ---
# ... (Manter as funções get_produto, get_produtos, create_produto aqui) ...
def get_produto(db: Session, produto_id: str):
    return db.query(models.Produto).filter(models.Produto.id == produto_id).first()

def get_produtos(db: Session, skip: int = 0, limit: int = 100) -> List[models.Produto]:
    """Retorna todos os produtos."""
    return db.query(models.Produto).offset(skip).limit(limit).all()

# --- NOVAS Funções CRUD de Pedido ---

def create_pedido(db: Session, pedido: schemas.PedidoCreate):
    """
    Cria um novo pedido com base na lista de itens do carrinho.
    
    1. Calcula o preço total e garante que todos os produtos existam.
    2. Cria o registro do Pedido (Pedido).
    3. Cria os registros dos Itens do Pedido (PedidoItem).
    """
    
    total_price = 0.0
    pedido_items_to_save = []

    # 1. Valida e calcula o total
    for item in pedido.items:
        produto = get_produto(db, produto_id=item.produto_id)
        if not produto:
            # Em um cenário real, você levantaria uma HTTPException aqui
            raise ValueError(f"Produto com ID '{item.produto_id}' não encontrado.")
        
        item_total = produto.price * item.quantity
        total_price += item_total
        
        # Prepara o PedidoItem para salvar
        pedido_items_to_save.append({
            "produto_id": produto.id,
            "produto_name": produto.name,
            "unit_price": produto.price, # Garante o preço no momento da compra
            "quantity": item.quantity
        })

    # 2. Cria o registro do Pedido (Pedido)
    db_pedido = models.Pedido(
        total_price=total_price,
        status="pending" # O status mudaria para 'approved' após a integração com MP
    )
    db.add(db_pedido)
    db.commit()
    db.refresh(db_pedido)
    
    # 3. Cria os registros dos Itens do Pedido (PedidoItem)
    for item_data in pedido_items_to_save:
        db_pedido_item = models.PedidoItem(**item_data, pedido_id=db_pedido.id)
        db.add(db_pedido_item)

    db.commit()
    db.refresh(db_pedido) # Refresca para incluir os 'items'
    return db_pedido

def get_pedido(db: Session, pedido_id: int):
    """Retorna um pedido específico pelo ID."""
    return db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()

def get_pedidos(db: Session, skip: int = 0, limit: int = 100) -> List[models.Pedido]:
    """Retorna a lista de pedidos."""
    return db.query(models.Pedido).offset(skip).limit(limit).all()

def create_produto(db: Session, produto: schemas.ProdutoCreate):
    """Cria e armazena um novo produto no banco de dados."""
    db_produto = models.Produto(
        id=produto.id,
        name=produto.name,
        description=produto.description,
        price=produto.price,
        image=produto.image,
        category=produto.category
    )
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto


