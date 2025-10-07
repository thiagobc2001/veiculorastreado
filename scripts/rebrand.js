/**
 * Script de Rebranding do Aplicativo
 *
 * Este script automatiza o processo de adaptação do aplicativo para um novo cliente,
 * alterando nomes de pacotes, cores, textos e outras configurações específicas.
 *
 * Uso: node scripts/rebrand.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para saída no console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Carregar configuração de rebranding
let config;
try {
  const configPath = path.join(__dirname, '..', 'rebrand-config.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log(`${colors.green}✓${colors.reset} Configuração de rebranding carregada com sucesso`);
} catch (error) {
  console.error(`${colors.red}✗${colors.reset} Erro ao carregar configuração: ${error.message}`);
  console.log(`${colors.yellow}⚠${colors.reset} Certifique-se de que o arquivo rebrand-config.json existe na raiz do projeto`);
  process.exit(1);
}

// Validar configuração
const requiredFields = [
  'originalPackageName', 'newPackageName', 'originalAppName', 'newAppName',
  'colors', 'notificationChannelId', 'notificationChannelName', 'webviewBaseUrl'
];

const missingFields = requiredFields.filter(field => !config[field]);
if (missingFields.length > 0) {
  console.error(`${colors.red}✗${colors.reset} Campos obrigatórios ausentes na configuração: ${missingFields.join(', ')}`);
  process.exit(1);
}

// Caminhos dos arquivos
const rootDir = path.join(__dirname, '..');
const paths = {
  appJson: path.join(rootDir, 'app.json'),
  packageJson: path.join(rootDir, 'package.json'),
  androidManifest: path.join(rootDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  buildGradle: path.join(rootDir, 'android', 'app', 'build.gradle'),
  colorsXml: path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'colors.xml'),
  stringsXml: path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'),
  firebaseJson: path.join(rootDir, 'firebase.json'),
  layoutTsx: path.join(rootDir, 'app', '_layout.tsx'),
  messagingTs: path.join(rootDir, 'utils', 'messaging.ts'),
  mainActivity: path.join(rootDir, 'android', 'app', 'src', 'main', 'java'),
  mainApplication: path.join(rootDir, 'android', 'app', 'src', 'main', 'java'),
};

// Funções utilitárias
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Erro ao ler arquivo ${filePath}: ${error.message}`);
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Erro ao escrever arquivo ${filePath}: ${error.message}`);
    return false;
  }
}

function replaceInFile(filePath, searchValue, replaceValue) {
  console.log(`${colors.blue}→${colors.reset} Processando ${path.relative(rootDir, filePath)}`);

  const content = readFile(filePath);
  if (!content) return false;

  // Verificar se o valor a ser substituído existe no arquivo
  if (!content.includes(searchValue)) {
    console.log(`${colors.yellow}⚠${colors.reset} Valor "${searchValue}" não encontrado em ${path.relative(rootDir, filePath)}`);
    return false;
  }

  const newContent = content.replace(new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceValue);

  if (writeFile(filePath, newContent)) {
    console.log(`${colors.green}✓${colors.reset} Substituído "${searchValue}" por "${replaceValue}"`);
    return true;
  }

  return false;
}

function updateJsonFile(filePath, updateFn) {
  console.log(`${colors.blue}→${colors.reset} Atualizando ${path.relative(rootDir, filePath)}`);

  const content = readFile(filePath);
  if (!content) return false;

  try {
    const json = JSON.parse(content);
    updateFn(json);
    const newContent = JSON.stringify(json, null, 2);

    if (writeFile(filePath, newContent)) {
      console.log(`${colors.green}✓${colors.reset} Arquivo JSON atualizado com sucesso`);
      return true;
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Erro ao processar JSON: ${error.message}`);
  }

  return false;
}

function findAndReplaceInDirectory(dir, searchValue, replaceValue, extensions = ['.java', '.kt', '.xml', '.json', '.ts', '.tsx', '.js']) {
  if (!fs.existsSync(dir)) {
    console.log(`${colors.yellow}⚠${colors.reset} Diretório ${dir} não encontrado`);
    return;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      findAndReplaceInDirectory(filePath, searchValue, replaceValue, extensions);
    } else if (extensions.includes(path.extname(file.name))) {
      replaceInFile(filePath, searchValue, replaceValue);
    }
  }
}

function updatePackagePaths() {
  console.log(`${colors.blue}→${colors.reset} Atualizando caminhos de pacotes Java/Kotlin`);

  const originalParts = config.originalPackageName.split('.');
  const newParts = config.newPackageName.split('.');

  // Construir caminhos de diretórios
  const originalPath = path.join(paths.mainActivity, ...originalParts);
  const newPath = path.join(paths.mainActivity, ...newParts);

  if (!fs.existsSync(originalPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} Caminho original ${originalPath} não encontrado`);
    return false;
  }

  // Criar diretórios para o novo pacote
  try {
    fs.mkdirSync(path.dirname(newPath), { recursive: true });

    // Copiar arquivos
    const files = fs.readdirSync(originalPath);
    for (const file of files) {
      const srcFile = path.join(originalPath, file);
      const destFile = path.join(newPath, file);

      // Ler conteúdo e substituir o nome do pacote
      let content = readFile(srcFile);
      if (content) {
        content = content.replace(
          new RegExp(`package ${config.originalPackageName}`, 'g'),
          `package ${config.newPackageName}`
        );

        writeFile(destFile, content);
        console.log(`${colors.green}✓${colors.reset} Arquivo ${file} copiado e atualizado`);
      }
    }

    return true;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Erro ao atualizar caminhos de pacotes: ${error.message}`);
    return false;
  }
}

function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`${colors.green}✓${colors.reset} Backup criado: ${path.relative(rootDir, backupPath)}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Erro ao criar backup: ${error.message}`);
    return false;
  }
}

// Funções de rebranding específicas
function updateAppJson() {
  return updateJsonFile(paths.appJson, (json) => {
    json.expo.name = config.newAppName;
    json.expo.slug = config.newAppName.toLowerCase().replace(/\s+/g, '-');
    json.expo.android.package = config.newPackageName;

    // Atualizar cores se existirem
    if (json.expo.primaryColor) {
      json.expo.primaryColor = config.colors.primary;
    }

    console.log(`${colors.green}✓${colors.reset} Nome do app e package atualizados em app.json`);
  });
}

function updatePackageJson() {
  return updateJsonFile(paths.packageJson, (json) => {
    json.name = config.newAppName.toLowerCase().replace(/\s+/g, '-');
    console.log(`${colors.green}✓${colors.reset} Nome do pacote atualizado em package.json`);
  });
}

function updateAndroidManifest() {
  // Fazer backup do arquivo
  backupFile(paths.androidManifest);

  // Substituir o package name
  return replaceInFile(paths.androidManifest, config.originalPackageName, config.newPackageName);
}

function updateBuildGradle() {
  // Fazer backup do arquivo
  backupFile(paths.buildGradle);

  // Substituir o package name e outras configurações
  let success = replaceInFile(paths.buildGradle, config.originalPackageName, config.newPackageName);

  // Atualizar nome do keystore alias se configurado
  if (config.keystoreAlias) {
    const originalAlias = 'mfrastreamento';
    success = replaceInFile(paths.buildGradle, originalAlias, config.keystoreAlias) && success;
  }

  return success;
}

function updateColorsXml() {
  // Fazer backup do arquivo
  backupFile(paths.colorsXml);

  // Ler o arquivo
  const content = readFile(paths.colorsXml);
  if (!content) return false;

  // Atualizar cores
  let newContent = content;

  // Atualizar cor primária
  newContent = newContent.replace(
    /<color name="colorPrimary">#[0-9a-fA-F]{6}<\/color>/,
    `<color name="colorPrimary">${config.colors.primary}</color>`
  );

  // Atualizar cor secundária (blue)
  newContent = newContent.replace(
    /<color name="blue">#[0-9a-fA-F]{6}<\/color>/,
    `<color name="blue">${config.colors.secondary}</color>`
  );

  // Atualizar cor de fundo
  newContent = newContent.replace(
    /<color name="splashscreen_background">#[0-9a-fA-F]{6}<\/color>/,
    `<color name="splashscreen_background">${config.colors.background}</color>`
  );

  // Escrever o arquivo atualizado
  if (writeFile(paths.colorsXml, newContent)) {
    console.log(`${colors.green}✓${colors.reset} Cores atualizadas em colors.xml`);
    return true;
  }

  return false;
}

function updateStringsXml() {
  // Verificar se o arquivo existe
  if (!fs.existsSync(paths.stringsXml)) {
    console.log(`${colors.yellow}⚠${colors.reset} Arquivo strings.xml não encontrado`);
    return false;
  }

  // Fazer backup do arquivo
  backupFile(paths.stringsXml);

  // Substituir o nome do app
  return replaceInFile(paths.stringsXml, config.originalAppName, config.newAppName);
}

function updateFirebaseJson() {
  // Fazer backup do arquivo
  backupFile(paths.firebaseJson);

  return updateJsonFile(paths.firebaseJson, (json) => {
    // Atualizar ID do canal de notificação
    if (json["react-native"] && json["react-native"].messaging_android_notification_channel_id) {
      json["react-native"].messaging_android_notification_channel_id = config.notificationChannelId;
      console.log(`${colors.green}✓${colors.reset} ID do canal de notificação atualizado`);
    }
  });
}

function updateLayoutTsx() {
  // Fazer backup do arquivo
  backupFile(paths.layoutTsx);

  // Substituir o nome do app
  return replaceInFile(paths.layoutTsx, config.originalAppName, config.newAppName);
}

function updateMessagingTs() {
  // Fazer backup do arquivo
  backupFile(paths.messagingTs);

  // Substituir textos de notificação
  let success = true;

  // Atualizar título da solicitação de permissão
  success = replaceInFile(
    paths.messagingTs,
    'Notification Permission',
    'Permissão de Notificação'
  ) && success;

  // Atualizar mensagem da solicitação de permissão
  success = replaceInFile(
    paths.messagingTs,
    'This app needs notification permission to send you updates.',
    `O aplicativo ${config.newAppName} precisa de permissão para enviar notificações.`
  ) && success;

  return success;
}

// Função principal de rebranding
async function performRebranding() {
  console.log(`\n${colors.bright}${colors.blue}=== INICIANDO PROCESSO DE REBRANDING ===${colors.reset}\n`);
  console.log(`${colors.cyan}De:${colors.reset} ${config.originalAppName} (${config.originalPackageName})`);
  console.log(`${colors.cyan}Para:${colors.reset} ${config.newAppName} (${config.newPackageName})\n`);

  // Criar backups dos arquivos principais
  console.log(`${colors.bright}${colors.blue}=== CRIANDO BACKUPS ===${colors.reset}`);
  backupFile(paths.appJson);
  backupFile(paths.packageJson);

  // Atualizar arquivos de configuração
  console.log(`\n${colors.bright}${colors.blue}=== ATUALIZANDO ARQUIVOS DE CONFIGURAÇÃO ===${colors.reset}`);
  updateAppJson();
  updatePackageJson();

  // Atualizar arquivos Android
  console.log(`\n${colors.bright}${colors.blue}=== ATUALIZANDO ARQUIVOS ANDROID ===${colors.reset}`);
  updateAndroidManifest();
  updateBuildGradle();
  updateColorsXml();
  updateStringsXml();

  // Atualizar arquivos de código
  console.log(`\n${colors.bright}${colors.blue}=== ATUALIZANDO ARQUIVOS DE CÓDIGO ===${colors.reset}`);
  updateLayoutTsx();
  updateMessagingTs();
  updateFirebaseJson();

  // Atualizar caminhos de pacotes Java/Kotlin
  console.log(`\n${colors.bright}${colors.blue}=== ATUALIZANDO CAMINHOS DE PACOTES ===${colors.reset}`);
  updatePackagePaths();

  // Buscar e substituir em todos os arquivos restantes
  console.log(`\n${colors.bright}${colors.blue}=== BUSCANDO REFERÊNCIAS RESTANTES ===${colors.reset}`);
  findAndReplaceInDirectory(rootDir, config.originalPackageName, config.newPackageName);
  findAndReplaceInDirectory(rootDir, config.originalAppName, config.newAppName);

  console.log(`\n${colors.bright}${colors.green}=== REBRANDING CONCLUÍDO ===${colors.reset}\n`);
  console.log(`${colors.yellow}⚠${colors.reset} Ações manuais necessárias:`);
  console.log(`  1. Substitua os ícones e imagens na pasta assets/images/`);
  console.log(`  2. Atualize o arquivo google-services.json com as configurações do Firebase do novo cliente`);
  console.log(`  3. Execute 'npm run configure' para regenerar os arquivos de configuração`);
  console.log(`  4. Teste o aplicativo para verificar se todas as alterações foram aplicadas corretamente\n`);
}

// Executar o rebranding
performRebranding().catch(error => {
  console.error(`${colors.red}✗${colors.reset} Erro durante o rebranding: ${error.message}`);
  process.exit(1);
});
