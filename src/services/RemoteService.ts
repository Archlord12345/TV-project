import { BleManager, Device } from 'react-native-ble-plx';
// @ts-ignore
import IRManager from 'react-native-ir-manager';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Modes de connexion supportés par l'application.
 */
export enum ConnectionMode {
  IR = 'IR',
  BT = 'BT'
}
class RemoteService {
  private bleManager: BleManager;
  private connectedDevice: Device | null = null;
  private scanning = false;

  constructor() {
    this.bleManager = new BleManager();
  }

  // --- Logique Commune ---

  /**
   * Demande les permissions nécessaires pour le Bluetooth et la Localisation (Android).
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version as number;
      let permissions = [];

      if (apiLevel >= 31) {
        // Android 12+ nécessite ces permissions spécifiques pour le Bluetooth
        permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
      } else {
        // Versions antérieures
        permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      return Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Erreur lors de la demande de permissions:', err);
      return false;
    }
  }

  // --- Logique Bluetooth ---

  /**
   * Arrête le scan en cours proprement et attend que la pile Bluetooth se stabilise.
   */
  async stopScan(): Promise<void> {
    if (this.scanning) {
      console.log('Arrêt du scan Bluetooth...');
      this.bleManager.stopDeviceScan();
      this.scanning = false;
      // Temps de stabilisation indispensable pour éviter les collisions sur la pile BLE (iOS/Android)
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
    } else {
      // Sécurité : force l'arrêt du scan natif
      this.bleManager.stopDeviceScan();
    }
  }

  /**
   * Scanne les appareils Bluetooth à proximité et tente une connexion.
   */
  async scanAndConnect(onDeviceFound?: (device: Device) => void): Promise<void> {
    if (this.scanning) {
      console.log('Scan Bluetooth déjà en cours, ignoré.');
      return;
    }

    console.log('Démarrage du scan Bluetooth...');
    this.scanning = true;

    this.bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        this.scanning = false;
        // On ignore l'erreur d'annulation de scan qui est normale (errorCode === 2)
        if (error.errorCode !== 2) {
            console.error('Erreur de scan:', error);
        }
        return;
      }

      if (device && (device.name || device.localName)) {
        console.log(`Appareil trouvé : ${device.name || device.localName}`);
        if (onDeviceFound) onDeviceFound(device);
        
        // Auto-connexion simple si l'appareil semble être une TV
        if (device.name?.toLowerCase().includes('tv')) {
          this.connectToDevice(device);
        }
      }
    });
  }

  /**
   * Se connecte à un appareil Bluetooth spécifique.
   */
  async connectToDevice(device: Device): Promise<boolean> {
    try {
      // Si l'appareil est déjà celui auquel on est connecté, on s'arrête là
      if (this.connectedDevice && this.connectedDevice.id === device.id) {
        const isConnected = await device.isConnected();
        if (isConnected) {
            console.log(`Déjà connecté à ${device.name}`);
            return true;
        }
      }

      // Arrête le scan et attend que la pile Bluetooth se stabilise avant de connecter
      await this.stopScan();
      
      console.log(`Tentative de connexion à ${device.name || device.localName || device.id}...`);
      const connected = await device.connect();
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      this.connectedDevice = discovered;
      console.log(`Connecté à ${device.name}`);
      return true;
    } catch (e: any) {
      // On gère le cas "already connected" proprement
      if (e.message?.includes('already connected')) {
          this.connectedDevice = device;
          return true;
      }
      console.error('La connexion a échoué', e);
      return false;
    }
  }

  /**
   * Se déconnecte de l'appareil Bluetooth actuellement connecté.
   */
  async disconnectDevice(): Promise<void> {
    if (this.connectedDevice) {
      console.log(`Déconnexion de ${this.connectedDevice.name || this.connectedDevice.id}...`);
      try {
        await this.connectedDevice.cancelConnection();
      } catch (e) {
        console.error('Erreur lors de la déconnexion:', e);
      }
      this.connectedDevice = null;
    }
  }

  /**
   * Retourne l'appareil actuellement connecté.
   */
  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  /**
   * Envoie une commande via Bluetooth (protocole GATT).
   */
  async sendBluetoothCommand(command: string): Promise<void> {
    if (!this.connectedDevice) {
      console.warn('Aucun appareil Bluetooth connecté');
      return;
    }
    console.log(`[BT] Envoi de la commande : ${command}`);
    // Ici, on écrirait normalement dans une caractéristique GATT spécifique.
  }

  // --- Logique Infrarouge (IR) ---

  /**
   * Vérifie si l'appareil supporte l'émission infrarouge.
   */
  async checkIRSupport(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await IRManager.hasIrEmitter();
    } catch (e) {
      return false;
    }
  }

  /**
   * Envoie une commande via Infrarouge.
   */
  async sendIRCommand(command: string): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const pattern = this.getIRPattern(command);
      if (pattern.length === 0) {
        console.warn(`Aucun motif IR défini pour la commande : ${command}`);
        return;
      }

      await IRManager.transmit(38000, pattern);
      console.log(`[IR] Motif transmis pour : ${command}`);
    } catch (e: any) {
      throw e; // On remonte l'erreur pour la gérer dans l'UI
    }
  }

  /**
   * Récupère les motifs de signaux IR (Exemples Samsung/Standards).
   */
  private getIRPattern(command: string): number[] {
    const commonPattern = [560, 560, 560, 1690, 560, 560, 560, 560]; // Motif générique de remplissage
    
    const patterns: Record<string, number[]> = {
      'POWER': [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 4500],
      'VOL_UP': [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 4500],
      'VOL_DOWN': [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 4500],
      'OK': [4500, 4500, 560, 560, 560, 1690, 560, 560, ...commonPattern],
      'UP': [4500, 4500, 560, 1690, 560, 560, 560, 1690, ...commonPattern],
      'DOWN': [4500, 4500, 560, 560, 560, 560, 560, 1690, ...commonPattern],
      'LEFT': [4500, 4500, 560, 1690, 1690, 560, 560, 560, ...commonPattern],
      'RIGHT': [4500, 4500, 1690, 560, 560, 1690, 560, 560, ...commonPattern],
      'MENU': [4500, 4500, 560, 560, 1690, 1690, 560, 560, ...commonPattern],
      'HOME': [4500, 4500, 1690, 1690, 560, 560, 560, 1690, ...commonPattern],
      'BACK': [4500, 4500, 560, 1690, 560, 560, 1690, 1690, ...commonPattern],
      'MUTE': [4500, 4500, 1690, 560, 1690, 560, 560, 560, ...commonPattern],
      'CH_UP': [4500, 4500, 560, 560, 560, 1690, 1690, 560, ...commonPattern],
      'CH_DOWN': [4500, 4500, 1690, 1690, 560, 560, 560, 560, ...commonPattern],
    };

    return patterns[command] || [];
  }
}

export default new RemoteService();
