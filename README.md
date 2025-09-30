# FolderSiteManager - Deploy Gratuito Permanente

## Backend (Render - 100% Gratuito)
1. **GitHub**: Envie este repositório ao GitHub
2. **Render**: 
   - Acesse [render.com](https://render.com)
   - New → Web Service
   - Connect GitHub → selecione seu repositório
   - Configurações:
     - **Name**: foldersitemanager
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Plan**: Free
3. **Deploy**: Clique em "Create Web Service"
4. **URL**: Copie a URL gerada (ex: `https://foldersitemanager.onrender.com`)

## Frontend (Vercel - Gratuito)
1. **Config**: Edite `public/config.js`:
```js
window.APP_CONFIG = {
    API_BASE: 'https://SEU-PROJETO.onrender.com',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
};
```
2. **Vercel**: 
   - New Project → Import Git Repository
   - Root Directory: `public/`
   - Deploy

## Vantagens do Render
- ✅ **100% Gratuito** (sem trial)
- ✅ **Persistência** de arquivos no disco
- ✅ **Domínio** `.onrender.com` permanente
- ✅ **Auto-deploy** do GitHub
- ✅ **SSL** automático

## Teste Final
- Acesse o link da Vercel
- Adicione favoritos e arquivos
- Tudo deve persistir perfeitamente!

