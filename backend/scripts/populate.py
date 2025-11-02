# backend/scripts/populate.py
"""
Script utilitário para popular o DB com os produtos definidos em `backend/data.py`.

Uso recomendado (a partir da raiz do repositório):
    python -m backend.scripts.populate

Também funciona executando diretamente o arquivo (corrige sys.path automaticamente):
    .venv/Scripts/python.exe backend/scripts/populate.py

"""
import os
import sys

# Quando executado diretamente (python scripts\populate.py), o diretório atual
# é `backend/scripts` e o package `backend` não está no sys.path. Tentamos
# importar normalmente e, em caso de falha, inserimos o parent do diretório
# scripts (o diretório `backend`) no sys.path.
try:
    from backend import crud, data, database, schemas
except Exception:
    # Quando executado diretamente, adicionamos o diretório PAI do pacote
    # `backend` (ou seja, a raiz do repositório) ao sys.path.
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    from backend import crud, data, database, schemas


def main() -> None:
    db = database.SessionLocal()
    try:
        count = 0
        for prod in data.initial_produtos:
            try:
                prod_schema = schemas.ProdutoCreate(**prod)
            except Exception as e:
                print("Erro de validação para produto:", prod.get("id"), e)
                continue

            if crud.get_produto(db, produto_id=prod_schema.id) is None:
                # Assinatura correta: create_produto(db, produto: schemas.ProdutoCreate)
                crud.create_produto(db, prod_schema)
                count += 1

        print(f"{count} produtos adicionados.")
    finally:
        db.close()


if __name__ == "__main__":
    main()