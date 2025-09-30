FolderSiteManager - Deploy rápido

Backend (Railway)
1. Envie este repositório ao GitHub.
2. Na Railway: New Project → Deploy from GitHub → selecione o repo.
3. Em Settings, Start Command: node server.js.
4. Em Networking, gere um domínio público e copie a URL.
5. (Opcional) Crie Volumes e monte em /app/uploads e /app/data.
6. Redeploy/Restart.

Frontend (Vercel)
1. Edite public/config.js:
```
window.APP_CONFIG = {
    API_BASE: 'https://SEU-PROJETO.up.railway.app',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
};
```
2. Faça deploy da pasta public/ na Vercel.

O site chamará a API do Railway e manterá arquivos e links.

