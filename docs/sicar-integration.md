# SICAR / CAR — implantação operacional

**Fontes confirmadas:** https://consulta.car.gov.br/ (consulta individual e mapa), https://consultapublica.car.gov.br/publico/ (geosserviços e downloads), https://www.gov.br/car/pt-br/canais_atendimento/perguntas-frequentes/dados-e-informacoes (relatórios), https://dadosabertos.ibama.gov.br/dataset/termos-de-embargo (polígonos de embargo).

## Campos públicos na ficha
- CAR (código de registro), nome *quando publicado*, município/UF, área declarada, tipo e situação cadastral;
- origem e data de coleta, APP, Reserva Legal, vegetação nativa, uso restrito, área consolidada e hidrografia quando disponíveis;
- interseções com embargos efetivamente importados (não equivale a certidão);
- histórico de cobertura ambiental somente após ingestão autorizada da série temporal.

## Importar um arquivo oficial autorizado
1. Baixe os dados públicos pelos portais oficiais cumprindo licença e CAPTCHA.
2. Converta o shapefile autorizado para GeoJSON EPSG:4326 (ex.: com GDAL/ogr2ogr).
3. Configure o banco Docker e aplique `003_sicar.sql` caso esteja usando volume anterior ao novo esquema.
4. Execute `cd services/api && python -m app.import_sicar /dados/AREA_IMOVEL.geojson --source-url https://origem-oficial`.
5. Acesse `/consultar` para buscar CAR ou nome já importado e `/operacional` para medir áreas.

**Importante:** o importador não faz download automaticamente, não contorna CAPTCHA, não importa nomes/CPFs de proprietários e não substitui informações dos órgãos. A forma e qualidade das colunas variam por conjunto de dados; revisar cada arquivo antes de carregar.

## Próximas integrações técnicas
- Importador dos polígonos oficiais IBAMA incluindo versões, situação atual, histórico e data de referência.
- Importadores para camadas ambientais SICAR e parcelas SIGEF, com validação topológica.
- Cache e limite de acesso por provedor de geocodificação; políticas do Nominatim público não comportam uso intensivo irrestrito e são incompatíveis com consulta automática ilimitada em massa.
- Séries históricas MapBiomas/PRODES com indicação de período, resolução, método e licença.
- Testes ponta a ponta, deploy HTTPS de homologação e compilação iOS.

O CAR é **declaratório**, não comprova titularidade nem regularidade ambiental. O campo nome pode estar ausente dos dados públicos e nunca deve ser preenchido por inferência.
