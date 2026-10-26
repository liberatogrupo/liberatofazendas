# LIBERATO FAZENDAS

Sistema independente de inteligência rural brasileira, com interface territorial e arquitetura para fontes públicas.

## Stack
- **Web**: Next.js + TypeScript + MapLibre GL JS
- **API**: FastAPI + SQLAlchemy
- **GeoDB**: PostgreSQL/PostGIS

## Rodar localmente

Requisitos: Node.js 20+, npm, Docker com Compose.

```bash
docker compose up --build -d
cd apps/web
npm install
npm run dev
```

Abrir http://localhost:3000, API http://localhost:8000/docs.

Para testes de frontend sem Docker, o mapa-base ainda abre; a camada de propriedades exibe aviso de conexão indisponível. A instância PostGIS começa sem propriedades — **não são simulados registros rurais**.

## Endpoints
- `GET /health` testa a conectividade com o banco
- `GET /v1/sources` lista futuras fontes, todas com status `planned`
- `GET /v1/properties?limit=25&state=TO` retorna GeoJSON com geometrias cadastradas

## Fontes previstas

IBGE, INCRA/SIGEF, CAR/SICAR e MapBiomas são integrações **planejadas**, não conectores ativos. Dados públicos podem conter limitações de licença, precisão, atualização ou privacidade; verificar individualmente antes da ingestão.

## Segurança e estágio
O projeto está em estágio inicial; as credenciais no compose são **somente para ambiente local**. O banco e API são publicados em loopback para desenvolvimento. Não há deploy de produção nem integração com outros projetos.

Veja `docs/architecture.md` para o desenho técnico e próximos passos.
