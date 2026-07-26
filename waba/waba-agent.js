import { createCloudClient, createStore, createAgent, parseInbound } from './index.js';
import http from 'node:http'; import { agentConfig, WABA_PROJECT } from './waba-config.js';
const client=createCloudClient(); const store=createStore(); const agent=createAgent({client,store,...agentConfig});
const PORT=process.env.PORT||3000;
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,`http://localhost:${PORT}`);
 if(req.method==='POST'&&url.pathname==='/webhook'){let raw='';for await(const c of req)raw+=c;let b;try{b=JSON.parse(raw);}catch{return res.writeHead(400).end();}for(const m of parseInbound(b)){try{await agent.handle(m);}catch(e){}}return res.writeHead(200).end('ok');}
 if(req.method==='GET'&&url.pathname==='/health')return res.writeHead(200).end(JSON.stringify({ok:true,dryRun:client.dryRun}));
 if(req.method==='GET'&&url.pathname==='/leads'){const l=await store.listLeads();return res.writeHead(200).end(JSON.stringify({count:l.length,leads:l}));}
 res.writeHead(404).end();});
server.listen(PORT,()=>console.log(`[waba:${WABA_PROJECT}] :${PORT} dryRun=${client.dryRun}`));