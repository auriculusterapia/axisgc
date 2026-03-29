# Guia de Deploy na Vercel - TCM-Clinic

Siga este guia para colocar seu sistema no ar usando a Vercel.

## 1. Login e Conexão
1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New"** > **"Project"**.
3. Importe o repositório `auriculusterapia/TCM-Clinic`.

## 2. Configurações de Ambiente (CRÍTICO)
Antes de clicar em Deploy, abra a seção **"Environment Variables"** e adicione as seguintes chaves que estão no seu arquivo `.env.local`:

| Chave | Valor |
|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | *(Cole a URL do seu Supabase aqui)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Cole a sua Anon Key aqui)* |

> [!IMPORTANT]
> Sem essas variáveis, o sistema não conseguirá carregar os pacientes nem salvar consultas na nuvem.

## 3. Comandos de Build
A Vercel detectará automaticamente que é um projeto Next.js, mas garanta que:
- **Framework Preset**: `Next.js`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 4. Finalização
1. Clique em **"Deploy"**.
2. Aguarde cerca de 2-3 minutos.
3. Se o build terminar com sucesso, você terá uma URL (ex: `tcm-clinic.vercel.app`) para acessar de qualquer lugar!

---
> [!TIP]
> **Dica de Segurança**: Nunca compartilhe sua URL ou Anon Key publicamente. O arquivo `.env.local` é ignorado pelo Git por segurança, por isso você precisa digitar esses valores manualmente na Vercel.

Em caso de erro no build (ex: "Build failed"), você pode ver o log de erros no painel da Vercel. Como configurei o projeto para ignorar avisos menores, o deploy deve ser suave.
