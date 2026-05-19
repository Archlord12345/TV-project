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

    try {
      // 1. Découverte des services et caractéristiques si ce n'est pas déjà fait
      const services = await this.connectedDevice.services();
      
      // On cherche une caractéristique writable
      // Priorité au service HID (0x1812) et caractéristique Report (0x2A4D)
      let targetChar: any = null;

      for (const service of services) {
        const chars = await service.characteristics();
        for (const char of chars) {
          // Si on trouve une caractéristique HID Report, on la prend
          if (char.uuid.toLowerCase().includes('2a4d')) {
            targetChar = char;
            break;
          }
          // Sinon, on prend la première qui permet l'écriture
          if (!targetChar && (char.isWritableWithResponse || char.isWritableWithoutResponse)) {
            targetChar = char;
          }
        }
        if (targetChar && targetChar.uuid.toLowerCase().includes('2a4d')) break;
      }

      if (!targetChar) {
        throw new Error('Aucune caractéristique compatible trouvée pour l\'envoi de commandes');
      }

      // 2. Encodage de la commande
      // Note : Chaque constructeur a son propre protocole.
      // Pour une démo fonctionnelle, on envoie la chaîne en Base64 ou un octet de contrôle.
      const payload = this.getBluetoothPayload(command);
      
      if (targetChar.isWritableWithoutResponse) {
        await targetChar.writeWithoutResponse(payload);
      } else {
        await targetChar.writeWithResponse(payload);
      }
      
      console.log(`[BT] Commande ${command} envoyée avec succès via ${targetChar.uuid}`);
    } catch (e) {
      console.error('[BT] Échec de l\'envoi de la commande:', e);
      throw e;
    }
  }

  /**
   * Encode une commande pour le Bluetooth (Base64).
   */
  private getBluetoothPayload(command: string): string {
    // Mapping simple pour la démo. En production, cela dépend du protocole de la TV.
    const commandMap: Record<string, string> = {
      'POWER': 'AQ==', // 0x01
      'VOL_UP': 'Ag==', // 0x02
      'VOL_DOWN': 'Aw==', // 0x03
      'OK': 'BA==', // 0x04
      'UP': 'BQ==',
      'DOWN': 'Bg==',
      'LEFT': 'Bw==',
      'RIGHT': 'CA==',
    };
    return commandMap[command] || 'AA==';
  }

  // --- Logique Infrarouge (IR) ---

  /**
   * Vérifie si l'appareil supporte l'émission infrarouge.
   */
  async checkIRSupport(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return await IRManager.hasIrEmitter();
    } catch {
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
    // Protocole Samsung : Header (4500, 4500), Bit 0 (560, 560), Bit 1 (560, 1690)
    const S_HDR = [4500, 4500];
    const S_0 = [560, 560];
    const S_1 = [560, 1690];
    const S_FOOTER = [560, 4500];

    // Protocole NEC (LG/Sony/Autres) : Header (9000, 4500), Bit 0 (560, 560), Bit 1 (560, 1690)
    const N_HDR = [9000, 4500];

    // Helper pour construire un motif à partir d'une valeur hexadécimale (32 bits)
    const buildPattern = (hex: number, type: 'SAMSUNG' | 'NEC' = 'SAMSUNG') => {
      let p = [...(type === 'SAMSUNG' ? S_HDR : N_HDR)];
      for (let i = 31; i >= 0; i--) {
        /* eslint-disable no-bitwise */
        p.push(...((hex >> i) & 1 ? S_1 : S_0));
        /* eslint-enable no-bitwise */
      }
      p.push(...S_FOOTER);
      return p;
    };

    const patterns: Record<string, number[]> = {
      // Samsung Standard (Address 0x0707)
      'POWER': buildPattern(0xE0E040BF),
      'VOL_UP': buildPattern(0xE0E0E01F),
      'VOL_DOWN': buildPattern(0xE0E0D02F),
      'CH_UP': buildPattern(0xE0E048B7),
      'CH_DOWN': buildPattern(0xE0E008F7),
      'OK': buildPattern(0xE0E016E9),
      'UP': buildPattern(0xE0E006F9),
      'DOWN': buildPattern(0xE0E08679),
      'LEFT': buildPattern(0xE0E0A659),
      'RIGHT': buildPattern(0xE0E046B9),
      'MENU': buildPattern(0xE0E058A7),
      'HOME': buildPattern(0xE0E018E7),
      'BACK': buildPattern(0xE0E01AE5),
      'MUTE': buildPattern(0xE0E0F00F),
      
      // LG/NEC Standard (Exemple pour extension future)
      'LG_POWER': buildPattern(0x20DF10EF, 'NEC'),
    };

    return patterns[command] || [];
  }
}

export default new RemoteService();
