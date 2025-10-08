const { withDangerousMod } = require('@expo/config-plugins');

module.exports = function withForceModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const fs = require('fs');
      const path = require('path');

      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf-8');
        // Encontra a linha do platform para adicionar logo abaixo
        if (!podfile.includes('use_modular_headers!')) {
          podfile = podfile.replace(
            /(platform :ios,[^\n]*\n)/,
            "$1use_modular_headers!\n"
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
