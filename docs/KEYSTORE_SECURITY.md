# Secure Keystore Password Management

This project uses EAS Secrets to securely manage keystore passwords for Android app signing. This approach keeps sensitive credentials out of your codebase and version control.

## Setting Up EAS Secrets

Before building the app, you need to set up the required secrets in your EAS account:

1. Make sure you're logged in to EAS:
   ```bash
   npx eas login
   ```

2. Set up the keystore password secrets:
   ```bash
   npx eas secret:create --name ANDROID_KEYSTORE_PASSWORD --value "your_actual_keystore_password"
   npx eas secret:create --name ANDROID_KEY_PASSWORD --value "your_actual_key_password"
   ```

   Replace `your_actual_keystore_password` and `your_actual_key_password` with the passwords you used when creating the keystore.

3. Verify that your secrets are set up correctly:
   ```bash
   npx eas secret:list
   ```

## Building the App

Once the secrets are set up, you can build your app using:

```bash
# For a preview build (APK)
npx eas build --platform android --profile preview

# For a production build (App Bundle)
npx eas build --platform android --profile production
```

## How It Works

1. The `eas.json` file is configured to use environment variables for the keystore passwords.
2. During the build process, EAS injects the secret values as environment variables.
3. The Android build process reads these environment variables to access the keystore.

## Local Development

For local development or testing, you can create a `.env` file (make sure to add it to `.gitignore`):

```
ANDROID_KEYSTORE_PASSWORD=your_actual_keystore_password
ANDROID_KEY_PASSWORD=your_actual_key_password
```

Then source this file before running any build commands:

```bash
source .env && npx eas build:local
```

## Security Best Practices

1. Never commit keystore files or passwords to version control
2. Regularly rotate your keystore passwords
3. Limit access to your EAS account and secrets
4. Keep a secure backup of your keystore files and passwords
