import subprocess, time, os, sys
cd = os.path.dirname(os.path.abspath(__file__))
py = sys.executable
while True:
    try:
        subprocess.run([py, os.path.join(cd,"sales_tick.py")], cwd=cd, timeout=320)
    except Exception as e:
        print("runner err", repr(e)[:90], flush=True)
    time.sleep(120)
