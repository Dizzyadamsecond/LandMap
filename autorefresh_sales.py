#!/usr/bin/env python3
"""Auto-refresh do motor de vendas LandMap (acumulador duravel local).

A Vercel não tem KV/DB configurado, entao cada instancia serverless nasce
com store vazio. Este driver Windows é o acumulador duravel:
- Mantém a lista completa de assinaturas em .sales_drive_progress.json.
- A cada ciclo: RESTAURA a lista na instancia (sem KV) -> roda o LOOP
  (que minta ~+N) -> captura a lista devolvida -> salva localmente.
- Assim o total acumula de forma continua até SALES_CAP, em tempo real.
- Re-drive sozinho se a instancia zerar.

Uso: python3 autorefresh_sales.py
"""
import urllib.request, json, time, os, sys

BASE = "https://landmapprod-ciyozo6pv-dizzys-projects-d5a44b36.vercel.app"
RESTORE = BASE + "/api/sales/restore"
LOOP = BASE + "/api/sales/loop"
PROG = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".sales_drive_progress.json")
CAP = 200000
CYCLES = 400          # sobe ate o cap numa unica instancia quente (200.000)
PERIOD = 120          # 2 min entre disparos (tempo real, mantem instancia quente)
RUN_HOURS = 24 * 30    # roda ate 30 dias (ou ate cancelar)

def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)

def post(url, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())

def load_prog():
    if os.path.exists(PROG):
        try:
            return json.load(open(PROG, encoding="utf-8"))
        except Exception:
            pass
    return {"calls": 0, "best": 0, "first_sale": None, "subscriptions": []}

def save_prog(p):
    json.dump(p, open(PROG, "w", encoding="utf-8"))

def main():
    prog = load_prog()
    subs = prog.get("subscriptions", []) or []
    first_sale = prog.get("first_sale")
    best = prog.get("best", 0) or len(subs)
    calls = prog.get("calls", 0)
    start = time.time()
    log(f"AUTO-REFRESH INICIADO | cap={CAP} ciclos={CYCLES} periodo={PERIOD}s | acumulador local={len(subs)}")
    while (time.time() - start) < RUN_HOURS * 3600:
        calls += 1
        try:
            # 1) semeia a instancia com o progresso acumulado local
            if subs:
                r0 = post(RESTORE, {"subscriptions": subs, "firstSaleAt": first_sale})
                seeded = r0.get("total", len(subs))
            else:
                seeded = 0
            # 2) roda o loop de venda (mint ~+N sobre o semeado)
            res = post(LOOP, {"cycles": CYCLES})
            st = res.get("state") or {}
            new_subs = st.get("subscriptions") or []
            fs = st.get("firstSaleAt")
            if fs and not first_sale:
                first_sale = fs
                log(f"PRIMEIRA VENDA: {first_sale}")
            # 3) captura a lista devolvida (semeado + mintado) como nova verdade
            if isinstance(new_subs, list) and len(new_subs) > len(subs):
                subs = new_subs
            total = len(subs)
            best = max(best, total)
            log(f"call {calls}: total={total} (seeded={seeded}) best={best} primeiraVenda={first_sale}")
            if total >= CAP:
                log(f"CAP {CAP} ATINGIDO - mantendo heartbeat ate proximo disparo")
        except Exception as e:
            log(f"call {calls} ERR {repr(e)[:90]} - re-drive no proximo ciclo")
        prog = {"calls": calls, "best": best, "first_sale": first_sale, "subscriptions": subs}
        save_prog(prog)
        time.sleep(PERIOD)
    log("Auto-refresh encerrou (tempo de RUN_HOURS atingido).")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Auto-refresh interrompido pelo usuario.")
