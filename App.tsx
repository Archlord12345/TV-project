import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Device } from 'react-native-ble-plx';
import { 
  Power, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  ArrowLeft,
  Menu,
  Bluetooth,
  RefreshCcw,
  Zap,
  Tv
} from 'lucide-react-native';
import RemoteService, { ConnectionMode } from './src/services/RemoteService';

/**
 * Composant réutilisable pour les boutons de la télécommande.
 */
const RemoteButton = ({ icon: Icon, label, onPress, color = '#333', size = 28, style }: any) => (
  <TouchableOpacity 
    style={[styles.button, { backgroundColor: color }, style]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    {Icon && <Icon color="white" size={size} />}
    {label && <Text style={styles.buttonText}>{label}</Text>}
  </TouchableOpacity>
);

const App = () => {
  const [mode, setMode] = useState<ConnectionMode>(ConnectionMode.IR);
  const [isIRSupported, setIsIRSupported] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const hasPermission = await RemoteService.requestPermissions();
        if (!hasPermission) {
          console.warn('Permissions non accordées');
          return;
        }
        const supported = await RemoteService.checkIRSupport();
        setIsIRSupported(supported);
      } catch (e) {
        console.error("Erreur d'initialisation :", e);
      }
    };
    
    // Délai pour s'assurer que l'activité est attachée
    const timer = setTimeout(checkSupport, 1000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Gère l'envoi d'une commande selon le mode sélectionné (IR ou BT).
   */
  const handleCommand = async (command: string) => {
    console.log(`Envoi de la commande ${command} via ${mode}`);
    try {
        if (mode === ConnectionMode.IR) {
          await RemoteService.sendIRCommand(command);
        } else {
          if (!connectedDeviceName) {
            Alert.alert('Non connecté', 'Veuillez d\'abord vous connecter à une TV Bluetooth.');
            return;
          }
          await RemoteService.sendBluetoothCommand(command);
        }
    } catch (e: any) {
        if (e.message?.includes('IR Manager not available')) {
            Alert.alert('Infrarouge non supporté', 'Votre appareil ne possède pas d\'émetteur infrarouge ou l\'accès est refusé.');
        } else {
            console.error('Erreur de commande:', e);
        }
    }
  };

  /**
   * Démarre un scan pour trouver des appareils Bluetooth.
   */
  const startScan = async () => {
    setDevices([]); // Réinitialise la liste
    setIsScanning(true);
    
    await RemoteService.scanAndConnect((device) => {
      setDevices((prevDevices) => {
        // Éviter les doublons
        const exists = prevDevices.find((d) => d.id === device.id);
        if (!exists) {
          return [...prevDevices, device];
        }
        return prevDevices;
      });
    });

    // Arrête le scan après 10 secondes
    setTimeout(() => setIsScanning(false), 10000);
  };

  /**
   * Tente de se connecter à un appareil sélectionné.
   */
  const handleConnect = async (device: Device) => {
    const success = await RemoteService.connectToDevice(device);
    if (success) {
      setConnectedDeviceName(device.name || device.localName || 'Appareil Inconnu');
      Alert.alert('Succès', `Connecté à ${device.name || device.localName}`);
    } else {
      Alert.alert('Erreur', 'Impossible de se connecter à cet appareil');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Télécommande Universelle</Text>
          <Text style={styles.subtitle}>
            {mode === ConnectionMode.IR ? 'Mode Infrarouge' : 'Mode Bluetooth'}
            {connectedDeviceName && ` - Connecté à ${connectedDeviceName}`}
            {isIRSupported === false && mode === ConnectionMode.IR && ' (Appareil non compatible)'}
          </Text>
        </View>
        
        <View style={styles.modeToggle}>
          <TouchableOpacity 
            onPress={() => setMode(ConnectionMode.IR)}
            style={[styles.modeBtn, mode === ConnectionMode.IR && styles.activeMode]}
          >
            <Zap size={18} color={mode === ConnectionMode.IR ? 'white' : '#888'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setMode(ConnectionMode.BT)}
            style={[styles.modeBtn, mode === ConnectionMode.BT && styles.activeMode]}
          >
            <Bluetooth size={18} color={mode === ConnectionMode.BT ? 'white' : '#888'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* État de connexion / Scan Bluetooth */}
        {mode === ConnectionMode.BT && (
          <View style={styles.bluetoothSection}>
            <TouchableOpacity style={styles.scanBar} onPress={startScan} disabled={isScanning}>
              <RefreshCcw size={16} color="white" />
              <Text style={styles.scanText}>{isScanning ? 'Recherche en cours...' : 'Rechercher des appareils'}</Text>
            </TouchableOpacity>

            {/* Liste des appareils trouvés */}
            {devices.length > 0 && (
              <View style={styles.deviceList}>
                <Text style={styles.listTitle}>Appareils TV détectés :</Text>
                {devices.map((device) => (
                  <TouchableOpacity 
                    key={device.id} 
                    style={styles.deviceItem}
                    onPress={() => handleConnect(device)}
                  >
                    <Tv size={20} color="#007AFF" />
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.name || device.localName || 'Inconnu'}</Text>
                      <Text style={styles.deviceId}>{device.id}</Text>
                    </View>
                    <Text style={styles.connectLabel}>Connecter</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Commandes du haut */}
        <View style={styles.topRow}>
          <RemoteButton icon={Power} color="#FF3B30" onPress={() => handleCommand('POWER')} size={36} />
          <RemoteButton icon={Menu} color="#444" onPress={() => handleCommand('MENU')} />
        </View>

        {/* Pavé directionnel */}
        <View style={styles.navContainer}>
          <View style={styles.navPad}>
            <TouchableOpacity style={styles.navBtn} onPress={() => handleCommand('UP')}>
              <ChevronUp color="white" size={40} />
            </TouchableOpacity>
            
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.navBtn} onPress={() => handleCommand('LEFT')}>
                <ChevronLeft color="white" size={40} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.okBtn} onPress={() => handleCommand('OK')}>
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.navBtn} onPress={() => handleCommand('RIGHT')}>
                <ChevronRight color="white" size={40} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.navBtn} onPress={() => handleCommand('DOWN')}>
              <ChevronDown color="white" size={40} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section principale des contrôles */}
        <View style={styles.controlsGrid}>
          {/* Colonne Volume */}
          <View style={styles.verticalControl}>
            <TouchableOpacity onPress={() => handleCommand('VOL_UP')} style={styles.vertBtn}>
              <ChevronUp color="white" size={32} />
            </TouchableOpacity>
            <Text style={styles.vertLabel}>VOL</Text>
            <TouchableOpacity onPress={() => handleCommand('VOL_DOWN')} style={styles.vertBtn}>
              <ChevronDown color="white" size={32} />
            </TouchableOpacity>
          </View>

          {/* Colonne du milieu */}
          <View style={styles.centerCol}>
            <RemoteButton icon={Home} onPress={() => handleCommand('HOME')} color="#007AFF" />
            <RemoteButton icon={VolumeX} onPress={() => handleCommand('MUTE')} color="#444" />
            <RemoteButton icon={ArrowLeft} onPress={() => handleCommand('BACK')} color="#444" />
          </View>

          {/* Colonne Chaîne */}
          <View style={styles.verticalControl}>
            <TouchableOpacity onPress={() => handleCommand('CH_UP')} style={styles.vertBtn}>
              <ChevronUp color="white" size={32} />
            </TouchableOpacity>
            <Text style={styles.vertLabel}>CH</Text>
            <TouchableOpacity onPress={() => handleCommand('CH_DOWN')} style={styles.vertBtn}>
              <ChevronDown color="white" size={32} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 25,
    padding: 4,
  },
  modeBtn: {
    padding: 10,
    borderRadius: 20,
  },
  activeMode: {
    backgroundColor: '#007AFF',
  },
  bluetoothSection: {
    marginBottom: 10,
  },
  scanBar: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    margin: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  scanText: {
    color: 'white',
    fontWeight: '600',
  },
  deviceList: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  listTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deviceName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  deviceId: {
    color: '#666',
    fontSize: 12,
  },
  connectLabel: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  navContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  navPad: {
    width: 240,
    height: 240,
    backgroundColor: '#1E1E1E',
    borderRadius: 120,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navBtn: {
    padding: 15,
  },
  okBtn: {
    width: 80,
    height: 80,
    backgroundColor: '#2A2A2A',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  okText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  controlsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  verticalControl: {
    backgroundColor: '#1E1E1E',
    borderRadius: 40,
    width: 70,
    height: 180,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  vertBtn: {
    padding: 10,
  },
  vertLabel: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centerCol: {
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 180,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
  },
});

export default App;
