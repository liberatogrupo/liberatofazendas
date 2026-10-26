# Arquitetura inicial

- **Frontend**: Next.js App Router, React, TypeScript e MapLibre GL JS, em `apps/web`.
- **API**: FastAPI REST, em `services/api`.
- **Persistência**: PostgreSQL 16 com PostGIS, geometrias MultiPolygon em SIRGAS 2000 (EPSG:4674), índices GiST.
- **Infraestrutura local**: Docker Compose para API e banco. Web separada em modo desenvolvimento.
- **Fluxo**: Dados públicos (futuros adaptadores) → validação e proveniência → PostGIS → GeoJSON via API → MapLibre.
- **Status real**: não há dados reais importados, autenticação, geocodificação ou jobs de ingestão implantados. Os cartões do painel indicam apenas infraestrutura/planejamento.
- **Próxima fase**: validar licenças, atribuições e condições de acesso das fontes; implementar ETL por fonte, paginação espacial (bbox), limites de requisição, observabilidade, autenticação e testes.

Não publicar o protótipo nem expor o banco local diretamente na Internet. Alterar credenciais antes de qualquer deploy.
