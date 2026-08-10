import subprocess, os
os.chdir(r'C:\\Users\\forrydev\\Desktop\\LandMap')
with open('deploy_out.log','w',encoding='utf-8') as log:
    p = subprocess.Popen(['vercel','deploy','--prod','--yes'],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace', bufsize=1)
    for line in p.stdout:
        log.write(line); log.flush()
    rc = p.wait()
    log.write('\n\n__EXIT_CODE__='+str(rc)+'\n'); log.flush()
