import subprocess, os, sys, time, io

BASE = r"C:\Users\forrydev\Desktop\LandMap"
VERCEL = r"C:\Users\forrydev\AppData\Roaming\npm\vercel.cmd"
LOG = os.path.join(BASE, "deploy_log.txt")

def log(msg):
    with open(LOG, "a", encoding="utf-8", errors="replace") as f:
        f.write(msg + "\n")
        f.flush()

log("=== deploy_runner started PID=%d at %s ===" % (os.getpid(), time.strftime("%H:%M:%S")))

# Run vercel and stream its output to the log
proc = subprocess.Popen(
    [VERCEL, "deploy", "--prod", "--yes"],
    cwd=BASE,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    bufsize=1,
    text=True,
    encoding="utf-8",
    errors="replace",
)
log("spawned vercel PID=%s" % proc.pid)

try:
    for line in proc.stdout:
        log(line.rstrip("\n"))
except Exception as e:
    log("reader error: %s" % e)
finally:
    rc = proc.wait()
    log("=== vercel exited rc=%s at %s ===" % (rc, time.strftime("%H:%M:%S")))
