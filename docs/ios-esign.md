# iOS / IPA para assinatura pelo ESign

## Estado
Este commit **prepara o projeto**, mas não inclui um arquivo IPA nem assinatura digital. O código iOS nativo será gerado pelo Capacitor na máquina macOS.

## Requisitos
- macOS com Xcode e CocoaPods configurados
- Node.js 20+, npm
- Certificado e perfil de provisionamento iOS válidos e compatíveis com o identificador de app `br.com.liberatogrupo.fazendas`
- ESign instalado pelo próprio usuário conforme regras aplicáveis

## Preparação
```bash
cd apps/web
npm install
npx cap add ios
npm run ios:prepare
npm run ios:open
```

No Xcode, selecione um time de desenvolvimento e ajuste o bundle identifier se necessário. Para obter IPA, use Product > Archive e a exportação adequada à sua distribuição/certificado. Para uso com ESign, é preciso um pacote IPA compatível com re-assinatura e um certificado/perfil válidos; o procedimento exato de exportação depende da conta Apple e do método de distribuição. Não desabilite a verificação de assinatura.

## Conectividade
- A API FastAPI não está hospedada: `http://localhost:8000` **não funciona no iPhone** como endpoint do computador de desenvolvimento.
- Antes de testar dados reais no iPhone, configure `NEXT_PUBLIC_API_URL` apontando para uma API HTTPS de teste acessível pelo dispositivo e reconstrua o export. Não introduza segredos na variável pública.
- O mapa-base consulta serviço de terceiros e requer Internet e cumprimento dos termos e atribuições.
- Não há webhook, WhatsApp, nem publicação de produção.

## Verificações antes de um IPA
1. `npm run typecheck` e `npm run build`.
2. Abrir o projeto no Xcode e verificar recursos, bundle ID, permissões e execução no simulador/dispositivo.
3. Arquivar e exportar IPA, testar abertura, mapa e acesso à API.
4. Só depois assinar com certificado válido e testar a instalação.

Este repositório não contém certificados, perfis de provisionamento ou chaves privadas.
