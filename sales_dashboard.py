#!/usr/bin/env python3
"""LandMap Sales War-Room — dashboard simples no terminal.

Roda no SEU terminal (deixe aberto). A cada 3s mostra o estado vivo do motor;
a cada 90s dispara um ciclo (seed+loop) para o motor continuar acumulando.
Para sozinho na PRIMEIRA VENDA REAL (quando Stripe + lead real entra).

Sem credenciais (Stripe/Resend), o badge fica SIMULADO — os numeros sao do
motor e NAO sao vendas reais. O dashboard avisa o que colar no .env.

Uso:
  python sales_dashboard.py
  SALES_BASE=https://landmap.us.kg python sales_dashboard.py
  DRIVE=0 python sales_dashboard.py   # soh visualizar, nao disparar ciclos
"""
import os, sys, time, json, urllib.request, urllib.error

BASE = os.environ.get("SALES_BASE", "https://landmapprod-9o8703eeg-dizzys-projects-d5a44b36.vercel.app")
STATE_URL = BASE + "/api/sales/state"
LOOP_URL = BASE + "/api/sales/loop"
PROG = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".sales_drive_progress.json")
DRIVE = os.environ.get("DRIVE", "1") == "1"
POLL = 3
DRIVE_EVERY = 90

C = {
    "reset": "\033[0m", "bold": "\033[1m", "dim": "\033[2m",
    "green": "\033[32m", "yellow": "\033[33m", "red": "\033[31m",
    "cyan": "\033[36m", "magenta": "\033[35m", "blue": "\033[34m",
    "white": "\033[37m", "gray": "\033[90m",
}


def c(k): return C.get(k, "")


def get(url, timeout=15):
    req = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def post(url, payload, timeout=300):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def load_prog():
    if os.path.exists(PROG):
        try:
            return json.load(open(PROG, encoding="utf-8"))
        except Exception:
            pass
    return {"calls": 0, "best": 0, "first_sale": None, "subscriptions": []}


def save_prog(p):
    try:
        json.dump(p, open(PROG, "w", encoding="utf-8"))
    except Exception:
        pass


def bar(pct, width=24):
    pct = max(0, min(100, pct))
    fill = int(pct / 100 * width)
    return "[" + c("green") + "#" * fill + c("gray") + "-" * (width - fill) + c("reset") + "]"


def render(state, prog, last_err, drive_in):
    now = time.strftime("%H:%M:%S")
    sys.stdout.write("\033[2J\033[H")
    print(c("bold") + c("cyan") + "  LANDMAP · SALES WAR-ROOM" + c("reset") + c("dim") + f"   {now}  (BASE {BASE})" + c("reset"))
    print(c("gray") + "  " + "-" * 64 + c("reset"))

    mode = state.get("mode", {}) if state else {}
    simulated = mode.get("simulated", True) if state else True
    if simulated:
        print(c("yellow") + "  [SIMULADO]" + c("reset") + c("dim") +
              " motor rodando, mas SEM credenciais → não é venda real" + c("reset"))
    else:
        print(c("green") + "  [REAL]" + c("reset") + c("dim") + " canais de pagamento/envio plugados" + c("reset"))

    if not state:
        print(c("red") + f"  conectando… ({last_err})" + c("reset"))
        return

    total = state.get("total", 0)
    goal = state.get("goal", 200000)
    mrr = state.get("mrr", 0)
    active = state.get("active", 0)
    trials = state.get("trials", 0)
    pct = round(total / goal * 100) if goal else 0

    print()
    print(f"  {c('bold')}Assinaturas:{c('reset')} {total:>6}   {c('bold')}Ativas:{c('reset')} {active:>5}   {c('bold')}Trials:{c('reset')} {trials:>5}")
    print(f"  {c('bold')}MRR (R$):{c('reset')} {mrr:>8,.0f}   {c('bold')}Meta:{c('reset')} {goal:>8,.0f}   {c('bold')}Progresso:{c('reset')} {pct}%")
    print("  " + bar(pct) + f"  {pct}%")
    print()
    d = state.get("daily", {})
    print(f"  {c('cyan')}Hoje:{c('reset')} subs={d.get('subs',0)} leads={d.get('leads',0)} deals={d.get('deals',0)}")
    fs = state.get("firstSaleAt")
    print(f"  {c('cyan')}Primeira venda:{c('reset')} " + (c("green") + fs + c("reset") if fs else c("yellow") + "ainda não" + c("reset")))
    print()

    # agentes
    ags = state.get("agents", [])[:8]
    print(c("gray") + "  Agentes (8 de %d):" % len(state.get("agents", [])) + c("reset"))
    for a in ags:
        st = a.get("status", "idle")
        mark = c("green") + "●" if st == "running" else c("gray") + "○"
        print(f"   {mark} {c('reset')}{a.get('name','?'):<16} {c('dim')}{a.get('role',''):<12} ações={a.get('actionsToday',0):>3} ok={a.get('successToday',0):>3}{c('reset')}")
    print()
    print(c("gray") + f"  ticks locais: {prog.get('calls',0)}  melhor total: {prog.get('best',0)}  drive: {'ON' if drive_in else 'OFF'}" + c("reset"))
    print(c("gray") + "  Ctrl+C para sair." + c("reset"))


def main():
    prog = load_prog()
    state = None
    last_err = ""
    last_drive = 0
    print(c("bold") + "LandMap War-Room iniciando… (Ctrl+C p/ sair)" + c("reset"))
    try:
        while True:
            # fetch state
            try:
                state = get(STATE_URL)
                last_err = ""
            except Exception as e:
                last_err = repr(e)[:70]

            # drive cycle periodically (seed+loop numa unica chamada)
            drive_now = DRIVE and (time.time() - last_drive >= DRIVE_EVERY)
            if drive_now:
                last_drive = time.time()
                try:
                    post(LOOP_URL, {"cycles": 400,
                                     "seed": {"subscriptions": prog.get("subscriptions", []),
                                              "firstSaleAt": prog.get("first_sale")}})
                    # refresh state after drive
                    state = get(STATE_URL)
                    if state:
                        subs = state.get("subscriptions", []) or []
                        fs = state.get("firstSaleAt")
                        if fs and not prog.get("first_sale"):
                            prog["first_sale"] = fs
                            print(c("green") + f"\n  >> PRIMEIRA VENDA: {fs}" + c("reset"))
                        if len(subs) > len(prog.get("subscriptions", [])):
                            prog["subscriptions"] = subs
                        prog["best"] = max(prog.get("best", 0), len(subs))
                        save_prog(prog)
                        # PARAR na primeira venda REAL
                        if state.get("mode", {}).get("realPayments") and fs and not str(fs).startswith("2026-07-2"):
                            print(c("green") + "\n  PRIMEIRA VENDA REAL CONFIRMADA — encerrando war-room." + c("reset"))
                            save_prog(prog)
                            return
                except Exception as e:
                    last_err = "drive: " + repr(e)[:60]

            render(state, prog, last_err, DRIVE)
            time.sleep(POLL)
    except KeyboardInterrupt:
        print(c("yellow") + "\nWar-Room encerrado pelo usuario." + c("reset"))
        save_prog(prog)


if __name__ == "__main__":
    main()
