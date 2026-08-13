#!/usr/bin/env python3
"""Gera data/auctions.json — dataset estruturado de leilões (casas, apartamentos,
terrenos e comerciais) com fontes reais brasileiras (Caixa, Banco do Brasil, TJ
estaduais, leiloeiros oficiais). Determinístico (seed fixa) para reprodutibilidade.

Copy-i18n-safe: nomes de ruas/logradouros são genéricos; não há PII.
"""
import json, random, os, math
from datetime import datetime, timedelta

random.seed(20260813)

# (cidade, uf, lat, lon) — capitais + polos relevantes
CITIES = [
    ("São Paulo", "SP", -23.5505, -46.6333),
    ("Rio de Janeiro", "RJ", -22.9068, -43.1729),
    ("Belo Horizonte", "MG", -19.9167, -43.9345),
    ("Curitiba", "PR", -25.4284, -49.2733),
    ("Porto Alegre", "RS", -30.0346, -51.2177),
    ("Recife", "PE", -8.0476, -34.8770),
    ("Salvador", "BA", -12.9777, -38.5016),
    ("Fortaleza", "CE", -3.7319, -38.5267),
    ("Brasília", "DF", -15.7939, -47.8828),
    ("Goiânia", "GO", -16.6869, -49.2648),
    ("Florianópolis", "SC", -27.5954, -48.5477),
    ("Campinas", "SP", -22.9099, -47.0626),
    ("Belém", "PA", -1.4558, -48.5039),
    ("Manaus", "AM", -3.1190, -60.0217),
    ("Vitória", "ES", -20.2976, -40.2958),
    ("Natal", "RN", -5.7945, -35.2110),
    ("João Pessoa", "PB", -7.1195, -34.8450),
    ("Maceió", "AL", -9.6658, -35.7353),
    ("São Luís", "MA", -2.5387, -44.2825),
    ("Cuiabá", "MT", -15.6014, -56.0979),
]
NEIGHBORHOODS = {
    "São Paulo": ["Pinheiros", "Vila Mariana", "Mooca", "Lapa", "Santana", "Tatuapé"],
    "Rio de Janeiro": ["Copacabana", "Tijuca", "Barra da Tijuca", "Madureira", "Méier"],
    "Belo Horizonte": ["Savassi", "Funcionários", "Pampulha", "Barro Preto"],
    "Curitiba": ["Batel", "Água Verde", "Centro", "Boa Vista"],
    "Porto Alegre": ["Moinhos de Vento", "Belo Horizonte", "Cidade Baixa", "Auxiliadora"],
    "Recife": ["Boa Viagem", "Casa Forte", "Graças", "Pina"],
    "Salvador": ["Barra", "Pituba", "Ondina", "Itapuã"],
    "Fortaleza": ["Meireles", "Aldeota", "Praia de Iracema", "Papicu"],
    "Brasília": ["Asa Sul", "Asa Norte", "Lago Sul", "Águas Claras"],
    "Goiânia": ["Setor Bueno", "Jardim Goiás", "Oeste", "Marista"],
    "Florianópolis": ["Trindade", "Centro", "Lagoa da Conceição", "Campeche"],
    "Campinas": ["Cambuí", "Taquaral", "Barão Geraldo", "Centro"],
    "Belém": ["Batista Campos", "Nazaré", "Umarizal", "Campina"],
    "Manaus": ["Adrianópolis", "Centro", "Ponta Negra", "Chapada"],
    "Vitória": ["Praia do Canto", "Enseada do Suá", "Jardim da Penha", "Centro"],
    "Natal": ["Ponta Negra", "Lagoa Nova", "Tirol", "Capim Macio"],
    "João Pessoa": ["Tambaú", "Manaíra", "Cabo Branco", "Centro"],
    "Maceió": ["Pajuçara", "Ponta Verde", "Jatiúca", "Centro"],
    "São Luís": ["Renascença", "Calhau", "Ponta d'Areia", "Centro"],
    "Cuiabá": ["Goiabeiras", "Arena Pantanal", "Centro", "Coxipó"],
}
STREETS = ["Rua das Acácias", "Avenida Brasil", "Rua Sete de Setembro", "Travessa do Comércio",
           "Alameda dos Anjos", "Rua Marechal Deodoro", "Avenida das Nações", "Rua Ipiranga"]

CATEGORIES = ["apartamento", "casa", "terreno", "comercial"]
AUCTION_TYPES = ["judicial", "extrajudicial", "bank"]
SOURCES = {
    "judicial": [
        ("TJ-SP Oficial de Justiça", "https://www.tjsp.jus.br/leiloes"),
        ("TJ-RJ Leilões", "https://www.tjrj.jus.br/leiloes"),
        ("TJ-MG Leilões", "https://www.tjmg.jus.br/leiloes"),
        ("TJ-RS Leilões", "https://www.tjrs.jus.br/leiloes"),
        ("TJ-PE Leilões", "https://www.tjpe.jus.br/leiloes"),
        ("TJ-BA Leilões", "https://www.tjba.jus.br/leiloes"),
        ("TJ-CE Leilões", "https://www.tjce.jus.br/leiloes"),
    ],
    "extrajudicial": [
        ("Leiloeiro Oficial SP", "https://www.celebraimoveis.com.br"),
        ("Supero Leilões", "https://www.superoleiloes.com.br"),
        ("Sodré Santoro", "https://www.sodresantoro.com.br"),
        ("Ortoleilões", "https://www.ortoleiloes.com.br"),
    ],
    "bank": [
        ("Caixa Econômica Federal", "https://www.caxa.gov.br/voce/imoveis"),
        ("Banco do Brasil", "https://www.bb.com.br/leiloes"),
        ("Banco Santander", "https://www.santander.com.br/imoveis"),
        ("Itaú Unibanco", "https://www.itau.com.br/leiloes"),
        ("Bradesco", "https://www.bradesco.com.br/leiloes"),
    ],
}
ORIGEM = {
    "judicial": ["Execução fiscal", "Ação de cobrança", "Divórcio", "Inventário", "Recuperação de crédito"],
    "extrajudicial": ["Inadimplência de financiamento", "Alienação fiduciária", "Cédula de crédito"],
    "bank": ["Alienação fiduciária", "Crédito não honrado", "Imóvel adjudicado"],
}
RISKS = ["ocupação", "litígio", "débitos_condomínio", "débitos_iptu", "regularização", "usucapião"]
DRIVERS = ["localização", "desconto_edital", "liquidez", "valorização_região", "demanda", "zona_valor"]

TITLES = {
    "apartamento": "Apartamento", "casa": "Casa", "terreno": "Terreno", "comercial": "Imóvel comercial",
}

def grade_from_score(s):
    if s >= 88: return "A"
    if s >= 76: return "B"
    if s >= 62: return "C"
    if s >= 48: return "D"
    if s >= 34: return "E"
    return "F"

def make_lot(i, now):
    city, uf, lat, lon = random.choice(CITIES)
    cat = random.choice(CATEGORIES)
    atype = random.choice(AUCTION_TYPES)
    src_name, src_url = random.choice(SOURCES[atype])
    neighborhood = random.choice(NEIGHBORHOODS.get(city, ["Centro"]))
    street = random.choice(STREETS)

    # área
    if cat == "terreno":
        area = random.choice([180, 240, 300, 360, 450, 500, 600, 720])
        beds = None; baths = None; suites = None; park = None
    elif cat == "casa":
        area = random.choice([90, 120, 150, 180, 220, 280, 340])
        beds = random.choice([2, 3, 3, 4, 4, 5])
        baths = random.choice([1, 2, 2, 3, 3])
        suites = max(0, beds - random.choice([1, 2, 2, 3]))
        park = random.choice([1, 2, 2, 3, 4])
    elif cat == "apartamento":
        area = random.choice([42, 48, 55, 65, 72, 85, 95, 110, 130])
        beds = random.choice([1, 2, 2, 3, 3, 4])
        baths = random.choice([1, 1, 2, 2, 2])
        suites = max(0, beds - random.choice([1, 2, 2]))
        park = random.choice([1, 1, 2, 2, 3])
    else:  # comercial
        area = random.choice([60, 90, 120, 160, 220, 300, 450])
        beds = None; baths = random.choice([1, 2, 2, 3]); suites = None
        park = random.choice([1, 2, 3, 4])

    pricePerM2 = random.choice([2600, 3200, 4100, 5200, 6400, 7800, 9200])
    market = int(area * pricePerM2 * random.uniform(0.95, 1.15))
    # desconto: leilão costuma ficar entre 20% e 60% abaixo da avaliação
    discount = random.uniform(0.18, 0.62)
    price = int(market * (1 - discount))

    # status / data
    roll = random.random()
    if roll < 0.45:
        status = "open"
        days = random.randint(2, 40)
    elif roll < 0.8:
        status = "scheduled"
        days = random.randint(5, 75)
    else:
        status = "closed"
        days = random.randint(-20, -1)
    auction_date = (now + timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    score = int(40 + discount * 70 + random.uniform(-8, 8))
    score = max(20, min(98, score))
    grade = grade_from_score(score)

    n_risk = random.randint(0, 2)
    n_drv = random.randint(1, 3)
    risks = random.sample(RISKS, n_risk)
    drivers = random.sample(DRIVERS, n_drv)
    tags = [cat, atype] + (["com_desconto"] if discount > 0.45 else []) + (["abaixo_avaliacao"] if discount > 0.35 else [])

    return {
        "id": f"auction-{i:04d}",
        "source": src_name,
        "sourceUrl": src_url,
        "title": f"{TITLES[cat]} {city} — {neighborhood}",
        "description": f"{TITLES[cat]} em leilão {atype} ({src_name}). Bairro {neighborhood}, {city}/{uf}.",
        "category": cat,
        "auctionType": atype,
        "city": city,
        "state": uf,
        "neighborhood": neighborhood,
        "street": street,
        "latitude": round(lat + random.uniform(-0.05, 0.05), 6),
        "longitude": round(lon + random.uniform(-0.05, 0.05), 6),
        "areaM2": area,
        "bedrooms": beds,
        "bathrooms": baths,
        "suites": suites,
        "parkingSpaces": park,
        "price": price,
        "marketPrice": market,
        "discountPct": round(discount * 100, 1),
        "auctionDate": auction_date,
        "status": status,
        "matricula": f"Matrícula {random.randint(1, 99)}.{random.randint(1000, 9999)} — Cartório {random.randint(1, 12)}º Ofício",
        "editalUrl": f"{src_url}/lote/{i:04d}",
        "origemDivida": random.choice(ORIGEM[atype]),
        "grade": grade,
        "score": round(score, 1),
        "risks": risks,
        "drivers": drivers,
        "tags": tags,
        "updatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

def main():
    now = datetime(2026, 8, 13, 12, 0, 0)
    N = 240
    lots = [make_lot(i + 1, now) for i in range(N)]
    out = os.path.join(os.path.dirname(__file__), "..", "data", "auctions.json")
    out = os.path.abspath(out)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(lots, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(lots)} lots -> {out}")
    # quick sanity
    from collections import Counter
    print("by category:", dict(Counter(l["category"] for l in lots)))
    print("by type:", dict(Counter(l["auctionType"] for l in lots)))
    print("by status:", dict(Counter(l["status"] for l in lots)))
    print("avg discount%:", round(sum(l["discountPct"] for l in lots)/len(lots), 1))

if __name__ == "__main__":
    main()
