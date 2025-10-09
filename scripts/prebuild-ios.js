const { execSync } = require("child_process");

console.log("🧹 Running Expo prebuild clean...");
execSync("npx expo prebuild --clean", { stdio: "inherit" });

try {
  console.log("📦 Updating CocoaPods repo...");
  execSync("cd ios && pod repo update && cd ..", { stdio: "inherit" });
} catch (err) {
  console.warn("⚠️ pod repo update skipped or failed (may not exist yet). Continuing...");
}
