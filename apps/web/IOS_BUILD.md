# Build iOS de desenvolvimento

O workflow `.github/workflows/ios-ipa.yml` compila e empacota um IPA **sem assinatura** em macOS. Verifique a execução em GitHub Actions após este commit. Artefato será publicado pelo workflow somente se o build terminar com sucesso. Não instalar sem certificado e perfil de provisionamento válidos. API FastAPI e PostGIS exigem hospedagem HTTPS separada; o IPA isolado não inclui o backend.
