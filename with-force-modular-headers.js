const { withDangerousMod } = require('@expo/config-plugins');

module.exports = function withForceModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const fs = require('fs');
      const path = require('path');

      // Caminho do Podfile após ele ter sido gerado por Expo/eas
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf-8');
        // Garante a linha global no topo do Podfile
        if (!podfile.includes('use_modular_headers!')) {
          podfile = podfile.replace(
            "platform :ios,",
            `platform :ios,\nuse_modular_headers!`
          );
          fs.writeFileSync(podfilePath, podfile);
          console.log('✅ [with-force-modular-headers] Adicionado use_modular_headers! global ao Podfile');
        }
      } else {
        console.warn('[with-force-modular-headers] Podfile nao encontrado!');
      }

      return config;
    }
  ]);
};
