import { BleManager } from 'react-native-ble-plx';
import IRManager from 'react-native-ir-manager';
import { Platform, PermissionsAndroid } from 'react-native';

class RemoteService {
  private bleManager: BleManager;

  constructor() {
    this.bleManager = new BleManager();
  }

  // --- Bluetooth Logic ---

  async requestBluetoothPermissions() {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async scanAndConnect() {
    console.log('Scanning for Bluetooth TV...');
    this.bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        return;
      }
      if (device && (device.name?.includes('TV') || device.name?.includes('Remote'))) {
        console.log('Found device:', device.name);
        this.bleManager.stopDeviceScan();
        // Logique de connexion ici
      }
    });
  }

  async sendBluetoothCommand(command: string) {
    console.log(`Sending BT command: ${command}`);
    // Implémentation spécifique au protocole de la TV (ex: GATT characteristics)
  }

  // --- Infrared Logic ---

  async checkIRSupport() {
    if (Platform.OS === 'android') {
      try {
        const hasIr = await IRManager.hasIrEmitter();
        return hasIr;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async sendIRCommand(pattern: number[], frequency: number = 38000) {
    if (Platform.OS === 'android') {
      try {
        await IRManager.transmit(frequency, pattern);
        console.log('IR Pattern transmitted');
      } catch (e) {
        console.error('IR Transmission failed', e);
      }
    }
  }

  // Helper pour les codes IR standards (Exemple Samsung)
  getSamsungPowerCode() {
    // Exemple de pattern IR (simplifié)
    return [4500, 4500, 560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 560];
  }
}

export default new RemoteService();
