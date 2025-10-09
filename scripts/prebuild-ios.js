const { execSync } = require("child_process");

console.log("🧹 Limpando build anterior e gerando projeto iOS...");
execSync("npx expo prebuild --clean", { stdio: "inherit" });

try {
  console.log("📦 Atualizando repositório CocoaPods...");
  execSync("cd ios && pod repo update && cd ..", { stdio: "inherit" });
} catch (err) {
  console.warn("⚠️ Aviso: pod repo update falhou ou ainda não existe — continuando o build...");
}
