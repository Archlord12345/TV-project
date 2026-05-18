import { BleManager, Device } from 'react-native-ble-plx';
import IRManager from 'react-native-ir-manager';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

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
   * Scanne les appareils Bluetooth à proximité et tente une connexion.
   */
  async scanAndConnect(onDeviceFound?: (device: Device) => void): Promise<void> {
    console.log('Démarrage du scan Bluetooth...');
    
    this.bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Erreur de scan:', error);
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
      this.bleManager.stopDeviceScan();
      const connected = await device.connect();
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      this.connectedDevice = discovered;
      console.log(`Connecté à ${device.name}`);
      return true;
    } catch (e) {
      console.error('La connexion a échoué', e);
      return false;
    }
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
    } catch (e) {
      console.error("L'envoi IR a échoué", e);
    }
  }

  /**
   * Récupère les motifs de signaux IR (Exemple Samsung).
   */
  private getIRPattern(command: string): number[] {
    const patterns: Record<string, number[]> = {
      'POWER': [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 4500],
      'VOL_UP': [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 4500],
      'VOL_DOWN': [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 1690, 560, 560, 560, 560, 560, 1690, 560, 1690, 560, 1690, 560, 1690, 560, 4500],
    };

    return patterns[command] || [];
  }
}

export default new RemoteService();
