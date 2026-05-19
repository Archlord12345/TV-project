<p align="center">
  <img src="./logo.png" alt="TVRemoteApp Logo" width="180px" style="border-radius: 24px;" />
</p>

# TVRemoteApp - Télécommande Universelle (IR & Bluetooth)

Cette application est une télécommande universelle développée avec **React Native CLI**. Elle permet de contrôler des téléviseurs classiques via **Infrarouge (IR)** et des Smart TVs modernes via **Bluetooth Low Energy (BLE)**.

## 🛠 Technologies Utilisées

Ce projet s'appuie sur une pile technologique moderne pour garantir performance, type-safety et contrôle matériel bas niveau :

*   **React Native (v0.85)** : Framework principal multiplateforme pour un rendu natif et performant.
*   **TypeScript** : Pour un typage statique fort, une maintenance simplifiée et moins de bugs en production.
*   **react-native-ble-plx** : Gestion complète du Bluetooth Low Energy (BLE) et des connexions GATT pour les Smart TVs.
*   **react-native-ir-manager** : Pont natif bas niveau d'accès à l'émetteur infrarouge matériel (Android).
*   **lucide-react-native** : Fournisseur de l'élégant jeu d'icônes vectorielles de l'interface.
*   **react-native-svg** : Moteur de rendu haute performance pour les graphismes et composants SVG.
*   **react-native-safe-area-context** : Gestion dynamique et rigoureuse des bordures sécurisées (encoches, barre d'état).
*   **patch-package** : Automatisation et gestion des correctifs natifs de compatibilité au sein de `node_modules` (compatibilité Gradle 8+).
*   **ESLint & Prettier** : Outils complémentaires d'assurance qualité et d'uniformisation du code.
*   **Babel & Metro Bundler** : Chaîne d'outils de transpilation et de build pour l'écosystème JavaScript/React Native.
*   **GitHub Actions** : Workflow CI/CD optimisé avec mise en cache intelligente pour des builds plus rapides.

## 📂 Architecture et Fonctions Clés

Le projet est structuré de manière modulaire pour séparer l'interface de la logique matérielle.

### 1. `src/services/RemoteService.ts`
C'est le cœur logique de l'application. Il gère toutes les interactions avec le matériel.

- **`requestPermissions()`** : Demande les permissions nécessaires (Localisation, Bluetooth Scan/Connect) indispensables sur Android pour le BLE.
- **`checkIRSupport()`** : Vérifie si l'appareil dispose d'un émetteur infrarouge fonctionnel.
- **`sendIRCommand(command: string)`** : Récupère un motif (pattern) de signal et le transmet via le matériel. Supporte les protocoles **Samsung (32-bit)** et **NEC/LG**.
- **`scanAndConnect(onDeviceFound)`** : Lance la recherche sécurisée d'appareils Bluetooth à proximité avec garde anti-doublons.
- **`stopScan()`** : Stoppe proprement le scan matériel actif et applique une tempo de stabilisation de 500 ms sur l'adaptateur pour prévenir les collisions.
- **`connectToDevice(device)`** : Établit la connexion Bluetooth GATT après avoir stoppé le scan et stabilisé la pile BLE.
- **`disconnectDevice()`** : Rompt proprement la liaison active avec l'appareil connecté via `.cancelConnection()`.
- **`getConnectedDevice()`** : Récupère l'instance du périphérique Bluetooth actuellement associé.
- **`sendBluetoothCommand(command: string)`** : Envoie des commandes via le protocole Bluetooth (GATT/HID). Découvre automatiquement les caractéristiques d'écriture.

### 2. `App.tsx`
Gère l'interface utilisateur et fait le lien avec le service.

- **`handleCommand(command: string)`** : Fonction pivot qui décide d'envoyer la commande via IR ou BT selon le mode sélectionné.
- **Interface Réactive & Sécurisée** : Utilise des états React et des références (`isScanningRef`) pour une gestion rigoureuse des processus de scan (anti-double-clic instantané) et de connexion.
- **Filtrage et Carte Dédiée** : Filtre l'appareil connecté pour le retirer de la liste des périphériques disponibles à proximité, et affiche une carte premium avec indicateur de statut et bouton de déconnexion rapide.

## 🚀 Installation et Utilisation

### Installation
```bash
npm install
```

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

## ⚙️ Optimisation CI (GitHub Actions)
Le workflow GitHub Actions a été optimisé pour accélérer les builds :
- **Caching NPM** : Les dépendances `node_modules` sont mises en cache.
- **Caching Gradle** : Les fichiers de build Android et wrappers sont conservés entre les sessions.
- **Build Cache** : Utilisation du flag `--build-cache` pour une compilation incrémentale.

## ⚠️ Notes Techniques (Correctifs Natifs)
Ce projet inclut des correctifs importants pour la bibliothèque `react-native-ir-manager` (compatibilité Gradle 8+ et Java null checks). Ces correctifs sont stockés dans le dossier `/patches` et sont appliqués automatiquement après chaque `npm install` grâce à `patch-package`.

---
