# Guia de Rebranding do Aplicativo

Este documento descreve como adaptar o aplicativo MF Rastreamento para um novo cliente, alterando todas as informações específicas do cliente original.

## Visão Geral

O processo de rebranding envolve a alteração de vários arquivos e configurações para personalizar o aplicativo para um novo cliente. O script `scripts/rebrand.js` automatiza grande parte desse processo.

## Arquivos que Precisam ser Atualizados

### Arquivos Principais

1. **app.json** - Configurações do Expo, nome do app, slug, etc.
2. **package.json** - Nome do pacote e outras configurações
3. **android/app/src/main/AndroidManifest.xml** - Package name e configurações Android
4. **android/app/build.gradle** - Configurações de build Android
5. **android/app/google-services.json** - Configuração do Firebase para Android
6. **firebase.json** - Configurações do Firebase
7. **app/_layout.tsx** - Título do aplicativo nas telas

### Recursos Visuais

1. **assets/images/** - Todos os ícones e imagens
   - icon.png
   - adaptive-icon.png
   - splash-icon.png
   - favicon.png
   
2. **android/app/src/main/res/values/colors.xml** - Cores do aplicativo
3. **android/app/src/main/res/values/strings.xml** - Strings do aplicativo

### Configurações de Notificação

1. **firebase.json** - Configurações de notificação
2. **utils/messaging.ts** - Textos de solicitação de permissão

## Como Usar o Script de Rebranding

1. Edite o arquivo `rebrand-config.json` com as informações do novo cliente:

```json
{
  "originalPackageName": "com.wesodev1.mfrastreamento",
  "newPackageName": "com.novaempresa.appname",
  "originalAppName": "MF Rastreamento",
  "newAppName": "Novo App Name",
  "colors": {
    "primary": "#023c69",
    "secondary": "#2196F3",
    "background": "#232323",
    "text": "#FFFFFF"
  },
  "notificationChannelId": "high-priority",
  "notificationChannelName": "Notificações Importantes"
}
```

2. Execute o script de rebranding:

```bash
node scripts/rebrand.js
```

3. O script fará as seguintes alterações:
   - Atualizará todos os arquivos de configuração com o novo nome de pacote
   - Substituirá o nome do aplicativo em todos os arquivos relevantes
   - Atualizará as cores nos arquivos de recursos
   - Configurará o canal de notificação com o novo nome

4. **Ações manuais necessárias após o script:**
   - Substitua os ícones e imagens na pasta `assets/images/`
   - Atualize o arquivo `google-services.json` com as configurações do Firebase do novo cliente
   - Verifique se todas as strings específicas do cliente foram atualizadas

## Verificação Pós-Rebranding

Após executar o script e realizar as ações manuais, verifique:

1. Execute o aplicativo em modo de desenvolvimento:
   ```bash
   npm run run-android
   ```

2. Verifique se:
   - O nome do aplicativo está correto na tela inicial e na barra de notificações
   - As cores estão corretas em toda a interface
   - As notificações funcionam corretamente com o novo canal
   - O ícone do aplicativo está correto

## Solução de Problemas

Se encontrar problemas após o rebranding:

1. **Problemas de compilação Android:**
   - Verifique se o package name foi atualizado em todos os arquivos Java/Kotlin
   - Execute `npm run configure` para regenerar os arquivos de configuração

2. **Problemas com notificações:**
   - Verifique se o `google-services.json` foi atualizado corretamente
   - Verifique se o canal de notificação está configurado corretamente em `firebase.json`

3. **Problemas visuais:**
   - Verifique se todas as referências às cores antigas foram atualizadas
   - Certifique-se de que os novos ícones têm as dimensões corretas
