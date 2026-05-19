# TVRemoteApp - Télécommande Universelle BT & IR

Une application React Native moderne pour contrôler votre téléviseur via Bluetooth (GATT/HID) et Infrarouge (Samsung/NEC).

## 🚀 Fonctionnalités

- **Mode Infrarouge** : Support des protocoles Samsung (standard) et NEC (LG/Sony). Nécessite un émetteur IR intégré.
- **Mode Bluetooth** : Connexion aux TV modernes via le profil HID/GATT. Détection automatique des caractéristiques d'écriture.
- **Interface Intuitive** : Design sombre et ergonomique avec retour haptique visuel.
- **Android & iOS** : Support multi-plateforme (IR limité à Android).

## 🛠 Installation

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/votre-compte/TVRemoteApp.git
   cd TVRemoteApp
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   # Pour iOS
   cd ios && pod install && cd ..
   ```

3. **Lancer l'application** :
   - **Android** : `npm run android`
   - **iOS** : `npm run ios`

## 📡 Protocoles Supportés

### Infrarouge (IR)
L'application utilise des motifs de signal précis :
- **Samsung** : Fréquence 38kHz, Header 4.5ms, Codage 32 bits.
- **NEC/LG** : Fréquence 38kHz, Header 9.0ms.

### Bluetooth (BT)
La connexion s'appuie sur `react-native-ble-plx` :
- Découverte des services GATT.
- Recherche prioritaire du service HID (UUID `1812`) et de la caractéristique Report (UUID `2A4D`).

## ⚙️ Configuration CI/CD (GitHub Actions)

Le projet inclut un workflow optimisé pour GitHub Actions :
- **Mise en cache** : Dépendances NPM et Gradle mises en cache pour réduire le temps de build de ~30%.
- **Build Cache** : Utilisation du flag `--build-cache` de Gradle.

## 🚀 Build & Production

### Développement (Lancement sur appareil/émulateur)
```bash
npm run android
```

### Build Production (Générer l'APK)
Pour générer un APK installable sur n'importe quel téléphone :
```bash
npm run build:android
```
L'APK sera généré dans : `android/app/build/outputs/apk/release/app-release.apk`

## ⚠️ Notes Techniques (Correctifs Natifs)
Ce projet inclut des correctifs importants pour la bibliothèque `react-native-ir-manager` (compatibilité Gradle 8+ et Java null checks). Ces correctifs sont stockés dans le dossier `/patches` et sont appliqués automatiquement après chaque `npm install` grâce à `patch-package`.

## 📄 Licence

MIT
