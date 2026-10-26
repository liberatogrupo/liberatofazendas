# Bloqueios de execução e critérios de liberação

## Falhas identificadas na revisão de 26/10/2026
1. `NEXT_PUBLIC_API_URL` cai em `http://localhost:8000`; no iOS real localhost refere-se ao dispositivo, não ao backend.
2. API e PostGIS não estão implantados em HTTPS de homologação.
3. SICAR WFS não foi verificado ponta a ponta; nomes de camadas/atributos/condições de acesso devem ser confirmados nas respostas do servidor oficial.
4. Importadores SICAR/IBAMA não foram executados; dados ausentes não indicam fazenda regular.
5. Código Next.js/MapLibre/Capacitor não possui build, lint, integração e teste de dispositivo registrados.
6. Arquivo IPA sem assinatura não será instalável no ESign sem certificado/provisionamento válido.
7. Serviço público Nominatim não suporta volume indiscriminado de consultas; é necessário provedor e política de uso adequados.

## Critérios mínimos antes de declarar 'funcional'
- [ ] `npm ci` e `npm run typecheck` e `npm run build` passando
- [ ] `docker compose up --build` com testes de saúde, migrations e ingestão real
- [ ] `GET /v1/sicar-live/car/{CAR_VALÍDO}` validado contra fonte, incluindo erro offline e ausência de resultado
- [ ] `GET /v1/territory/properties` e `/embargoes` consultando geometrias reais
- [ ] API HTTPS acessível pelo aparelho configurada **antes** da compilação
- [ ] Busca, medição e 3D testados no iPhone com mapa carregado
- [ ] IPA gerado em Xcode, validado e assinatura/provisionamento legítimos

Não publicar para usuários finais enquanto itens críticos permanecerem pendentes.
