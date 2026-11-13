# Tema BitPortal para Keycloak

A tela de entrada clara segue a identidade visual BitPortal. O tema também personaliza a tela de cadastro e o console de conta.

O JAR contém o tema de login e conta. Ele funciona com usuário ou e-mail e senha. Quando o realm tem os provedores de identidade [LNURL-auth](https://github.com/Sats-Lottu/keycloak-lnurl-auth) ou [Nostr Auth](https://github.com/Sats-Lottu/keycloak-nostr-auth) instalados e configurados, o tema apresenta os atalhos correspondentes.

## Instalar

Baixe `keycloak-bitportal-theme-0.2.2.jar` e seu checksum no [GitHub Releases](https://github.com/Sats-Lottu/keycloak-bitportal-theme/releases/latest). Use o Keycloak **26.8.2** ou uma versão com as correções de segurança posteriores.

1. Copie o JAR para `/opt/keycloak/providers/`. Em uma imagem otimizada, execute `kc.sh build` antes de iniciar o servidor.
2. No realm, selecione `bitportal` em **Realm settings → Themes**, nos campos **Login theme** e **Account theme**.
3. Configure cadastro e campos de perfil no realm conforme necessário.

## Desenvolver e testar

Execute `docker compose up --build -d keycloak` e abra o [console de conta de teste](http://localhost:8080/realms/bitportal/account/). O realm de exemplo aceita cadastro por senha e deixa e-mail, primeiro nome e sobrenome opcionais.

```sh
docker compose --profile test up --build --abort-on-container-exit --exit-code-from tests
```

O build e os testes em Chromium usam somente o JAR do tema. Para publicar uma versão, atualize a versão Maven em `pom.xml` e envie uma tag anotada `vX.Y.Z` a partir da `main`. O GitHub Actions gera o JAR e o checksum após os testes.

[Licença MIT](LICENSE) · [Documentação de temas do Keycloak](https://www.keycloak.org/ui-customization/themes)
