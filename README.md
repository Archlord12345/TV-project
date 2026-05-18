# TVRemoteApp - Télécommande Universelle (IR & Bluetooth)

Cette application est une télécommande universelle développée avec **React Native CLI**. Elle permet de contrôler des téléviseurs classiques via **Infrarouge (IR)** et des Smart TVs modernes via **Bluetooth Low Energy (BLE)**.

## 🛠 Technologies Utilisées

- **React Native (v0.85)** : Framework principal.
- **TypeScript** : Pour un typage fort et une meilleure maintenabilité.
- **react-native-ir-manager** : Accès au port infrarouge (Android).
- **react-native-ble-plx** : Gestion du Bluetooth Low Energy.
- **lucide-react-native** & **react-native-svg** : Système d'icônes moderne.
- **react-native-safe-area-context** : Gestion des zones sécurisées (encoches, bordures).
- **patch-package** : Utilisé pour maintenir des correctifs natifs dans les bibliothèques tierces.

## 📂 Architecture et Fonctions Clés

Le projet est structuré de manière modulaire pour séparer l'interface de la logique matérielle.

### 1. `src/services/RemoteService.ts`
C'est le cœur logique de l'application. Il gère toutes les interactions avec le matériel.

- **`requestPermissions()`** : Demande les permissions nécessaires (Localisation, Bluetooth Scan/Connect) indispensables sur Android pour le BLE.
- **`checkIRSupport()`** : Vérifie si l'appareil dispose d'un émetteur infrarouge fonctionnel.
- **`sendIRCommand(command: string)`** : Récupère un motif (pattern) de signal et le transmet via le matériel.
- **`scanAndConnect(onDeviceFound)`** : Lance la recherche d'appareils Bluetooth à proximité.
- **`sendBluetoothCommand(command: string)`** : Envoie des commandes via le protocole Bluetooth (GATT).

### 2. `App.tsx`
Gère l'interface utilisateur et fait le lien avec le service.

- **`handleCommand(command: string)`** : Fonction pivot qui décide d'envoyer la commande via IR ou BT selon le mode sélectionné.
- **Interface Réactive** : Utilise des états React pour basculer dynamiquement entre les modes de connexion et mettre à jour l'interface.

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

## ⚠️ Notes Techniques (Correctifs Natifs)
Ce projet inclut des correctifs importants pour la bibliothèque `react-native-ir-manager` (compatibilité Gradle 8+ et Java null checks). Ces correctifs sont stockés dans le dossier `/patches` et sont appliqués automatiquement après chaque `npm install` grâce à `patch-package`.

---

## 🌐 Serveurs Gratuits 24/24 (Recommandations 2026)

Si vous souhaitez étendre l'application avec un backend (profils, cloud), voici les meilleures options :

1. **Oracle Cloud Free Tier** : Offre la meilleure puissance gratuite à vie (ARM Ampere).
2. **Google Cloud Platform (GCP)** : Instance `e2-micro` gratuite à vie.
3. **AWS Free Tier** : 12 mois gratuits pour des instances micro.
