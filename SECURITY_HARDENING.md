# Plano de Hardening e Segurança — Reobote Consórcios

Este documento detalha as medidas de segurança e endurecimento (*hardening*) de infraestrutura implementadas para mitigar ataques de injeção de scripts, SEO Spam e acessos não autorizados após a migração do site legado em WordPress para a nova arquitetura Jamstack em Next.js.

---

## 1. Cabeçalhos de Segurança HTTP (Security Headers)

Implementados para proteger os usuários contra ataques do lado do cliente (como XSS e Clickjacking) e forçar comunicações seguras.

### Arquivo Configurado: `vercel.json` (Raiz do Projeto)
Configuração aplicada para deploys na plataforma Vercel:

*   **Content-Security-Policy (CSP):** Restringe a execução de scripts e carregamento de recursos apenas a fontes autorizadas (como domínios da Cloudflare para proteção anti-bot e domínios oficiais do WhatsApp).
*   **X-Frame-Options (DENY):** Impede que o site seja incorporado em `<iframe>` de domínios externos, mitigando ataques de *Clickjacking*.
*   **X-Content-Type-Options (nosniff):** Força o navegador a respeitar os tipos MIME declarados, prevenindo ataques de *MIME sniffing* (execução de scripts disfarçados de imagens).
*   **Referrer-Policy:** Protege a privacidade dos usuários enviando apenas informações parciais de referência cruzada de domínios.
*   **Permissions-Policy:** Bloqueia recursos do navegador que o site não necessita (câmera, microfone, geolocalização).
*   **HSTS (Strict-Transport-Security):** Força o uso estrito de conexões seguras HTTPS por 2 anos (`max-age=63072000`), incluindo subdomínios e pré-carregamento.

---

## 2. Hardening de Servidor Apache / cPanel

### Arquivo Configurado: `public/.htaccess`
Como o build estático do Next.js exporta este arquivo para a raiz do servidor, as regras entram em vigor automaticamente ao hospedar em cPanel/Apache:

*   **Bloqueio de Listagem de Diretórios (`Options -Indexes`):** Impede que atacantes listem as pastas do site para mapear arquivos.
*   **Bloqueio a Arquivos Sensíveis:** Qualquer tentativa de acessar dotfiles como `.git`, `.env` ou configurações de projeto retorna `404 Not Found` imediatamente.
*   **Proteção contra Shells de Upload:** Desativa a execução de qualquer script (PHP, Python, CGI, etc.) que venha a ser enviado acidentalmente para as pastas públicas de mídia.
*   **Mitigação de SEO Spam Legado (WordPress):** URLs antigas muito visadas por robôs de spam (ex: `wp-login.php`, `wp-admin`, `wp-content`) retornam o status HTTP **410 Gone**, sinalizando para o Google remover indexações antigas rapidamente.

---

## 3. Análise de Superfície de Ataque (Formulários)

A atual arquitetura do site elimina formulários tradicionais que enviam dados para bancos de dados internos, optando pelo redirecionamento estruturado direto para canais oficiais do **WhatsApp (`wa.me`)**.

*   **Vantagem de Segurança:** Sem inputs ou endpoints de backend próprios expostos, o risco de injeção de SQL (SQLi), injeção de HTML no corpo de e-mails ou disparos massivos de spam a partir do seu domínio é reduzido a **zero**.
