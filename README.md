# Projet Télécommande TV (React Native CLI)

Ce projet est une application mobile développée avec **React Native CLI** (sans Expo) qui fait office de télécommande universelle. Elle supporte deux modes de communication :
1. **Infrarouge (IR)** : Utilise l'émetteur IR intégré du téléphone (uniquement sur Android).
2. **Bluetooth Low Energy (BLE)** : Permet de se connecter aux téléviseurs modernes compatibles Bluetooth.

## 🚀 Prérequis

- Node.js (v18 ou supérieur)
- Java Development Kit (JDK) 17
- Android Studio (pour l'émulateur et le SDK Android)
- Un appareil Android physique avec un émetteur infrarouge (pour tester l'IR).

## 📦 Installation

1. Clonez ou téléchargez ce dossier.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Liez les dépendances natives (si nécessaire sur les anciennes versions, mais géré automatiquement sur RN 0.70+) :
   ```bash
   npx pod-install # Pour iOS (uniquement pour le Bluetooth, l'IR n'est pas supporté sur iOS)
   ```

## 🛠️ Lancement de l'application

### Sur Android
Assurez-vous qu'un émulateur est lancé ou qu'un appareil physique est connecté via USB (avec le débogage USB activé).
```bash
npm run android
```

## 🧩 Bibliothèques utilisées

- `react-native-ble-plx` : Pour la gestion complète du Bluetooth Low Energy.
- `react-native-ir-manager` : Pour accéder à l'API `ConsumerIRManager` d'Android.
- `lucide-react-native` : Pour les icônes de l'interface utilisateur.

## 🌐 Serveurs Gratuits 24/24 (Recommandations 2026)

Si vous avez besoin d'un serveur backend pour accompagner cette application (par exemple, pour sauvegarder des configurations de télécommandes, des profils utilisateurs, ou relayer des commandes via le réseau local), voici les meilleures options gratuites à vie (Free Tier) :

1. **Oracle Cloud Free Tier** (Le meilleur choix)
   - **Avantages** : Offre jusqu'à 4 cœurs ARM (Ampere A1) et 24 Go de RAM gratuitement à vie. Vous pouvez installer Ubuntu, Oracle Linux ou Windows (via des images personnalisées).
   - **Disponibilité** : 24/24 et 7/7.
   - **Lien** : [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)

2. **Google Cloud Platform (GCP) Free Tier**
   - **Avantages** : 1 instance `e2-micro` gratuite par mois (dans les régions us-west1, us-central1, us-east1). Idéal pour un petit serveur Linux (Debian/Ubuntu).
   - **Lien** : [GCP Free Tier](https://cloud.google.com/free)

3. **Amazon Web Services (AWS) Free Tier**
   - **Avantages** : 750 heures par mois d'instance `t2.micro` ou `t3.micro` (Linux ou Windows) pendant 12 mois.
   - **Lien** : [AWS Free Tier](https://aws.amazon.com/free/)

*Note : Pour un serveur Windows gratuit, AWS (pendant 1 an) ou Oracle Cloud (avec une configuration avancée) sont les seules options viables. Pour Linux, Oracle Cloud est imbattable sur le long terme.*
