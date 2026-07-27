#!/usr/bin/env python3
"""Tick one-shot do motor de vendas LandMap (acumulador local, sem KV).

Chamado pelo agendador a cada 2 min. Restaura o progresso acumulado em
.sales_drive_progress.json na instancia serverless, roda o loop, e salva
de volta. Assim o total cresce em tempo real entre cold starts.

Sem credenciais de envio/pagamento, os numeros sao do motor (modo simulado
honesto) — o dashboard war-room rotula isso.
"""
import urllib.request, json, os, sys, time

BASE = os.environ.get("SALES_BASE",
    "https://landmapprod-ciyozo6pv-dizzys-projects-d5a44b36.vercel.app")
LOOP = BASE + "/api/sales/loop"
PROG = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".sales_drive_progress.json")
CAP = int(os.environ.get("SALES_CAP", "200000"))
CYCLES = int(os.environ.get("SALES_CYCLES", "400"))

def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)

def post(url, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data,
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read().decode())

def load_prog():
    if os.path.exists(PROG):
        try:
            return json.load(open(PROG, encoding="utf-8"))
        except Exception:
            pass
    return {"calls": 0, "best": 0, "first_sale": None, "subscriptions": []}

def main():
    prog = load_prog()
    subs = prog.get("subscriptions", []) or []
    first_sale = prog.get("first_sale")
    best = prog.get("best", 0) or len(subs)
    calls = prog.get("calls", 0)
    calls += 1
    try:
        # 1 requisição única: semeia o acumulado E roda o loop no mesmo processo
        # (em serverless, RESTORE+LOOP separados caem em instâncias distintas).
        res = post(LOOP, {
            "cycles": CYCLES,
            "seed": {"subscriptions": subs, "firstSaleAt": first_sale},
        })
        st = res.get("state") or {}
        new_subs = st.get("subscriptions") or []
        fs = st.get("firstSaleAt")
        if fs and not first_sale:
            first_sale = fs
            log(f"PRIMEIRA VENDA: {first_sale}")
        if isinstance(new_subs, list) and len(new_subs) > len(subs):
            subs = new_subs
        total = len(subs)
        best = max(best, total)
        log(f"tick {calls}: total={total} best={best} primeiraVenda={first_sale}")
    except Exception as e:
        log(f"tick {calls} ERR {repr(e)[:90]}")
    json.dump({"calls": calls, "best": best, "first_sale": first_sale, "subscriptions": subs},
              open(PROG, "w", encoding="utf-8"))

if __name__ == "__main__":
    main()
