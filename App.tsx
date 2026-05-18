import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
} from 'react-native';
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
  Radio
} from 'lucide-react-native';
import RemoteService from './src/services/RemoteService';

const { width } = Dimensions.get('window');

const RemoteButton = ({ icon: Icon, label, onPress, color = '#333', size = 24 }: any) => (
  <TouchableOpacity 
    style={[styles.button, { backgroundColor: color }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    {Icon && <Icon color="white" size={size} />}
    {label && <Text style={styles.buttonText}>{label}</Text>}
  </TouchableOpacity>
);

const App = () => {
  const [connectionMode, setConnectionMode] = useState<'IR' | 'BT'>('IR');

  const handlePress = async (command: string) => {
    console.log(`Sending ${command} via ${connectionMode}`);
    
    if (connectionMode === 'IR') {
      const pattern = RemoteService.getSamsungPowerCode(); // Exemple
      await RemoteService.sendIRCommand(pattern);
    } else {
      await RemoteService.sendBluetoothCommand(command);
    }
  };

  React.useEffect(() => {
    const init = async () => {
      if (connectionMode === 'BT') {
        const hasPermission = await RemoteService.requestBluetoothPermissions();
        if (hasPermission) {
          RemoteService.scanAndConnect();
        }
      }
    };
    init();
  }, [connectionMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header / Status */}
      <View style={styles.header}>
        <Text style={styles.title}>Smart Remote</Text>
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            onPress={() => setConnectionMode('IR')}
            style={[styles.modeButton, connectionMode === 'IR' && styles.activeMode]}
          >
            <Radio size={16} color={connectionMode === 'IR' ? 'white' : '#888'} />
            <Text style={[styles.modeText, connectionMode === 'IR' && styles.activeModeText]}>IR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setConnectionMode('BT')}
            style={[styles.modeButton, connectionMode === 'BT' && styles.activeMode]}
          >
            <Bluetooth size={16} color={connectionMode === 'BT' ? 'white' : '#888'} />
            <Text style={[styles.modeText, connectionMode === 'BT' && styles.activeModeText]}>BT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Power & Top Buttons */}
      <View style={styles.topSection}>
        <RemoteButton icon={Power} color="#FF3B30" onPress={() => handlePress('POWER')} size={32} />
      </View>

      {/* Navigation Pad */}
      <View style={styles.navSection}>
        <View style={styles.navPad}>
          <TouchableOpacity style={styles.navUp} onPress={() => handlePress('UP')}>
            <ChevronUp color="white" size={32} />
          </TouchableOpacity>
          <View style={styles.navMiddle}>
            <TouchableOpacity style={styles.navLeft} onPress={() => handlePress('LEFT')}>
              <ChevronLeft color="white" size={32} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navOk} onPress={() => handlePress('OK')}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navRight} onPress={() => handlePress('RIGHT')}>
              <ChevronRight color="white" size={32} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.navDown} onPress={() => handlePress('DOWN')}>
            <ChevronDown color="white" size={32} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Controls Section */}
      <View style={styles.controlsSection}>
        <View style={styles.controlRow}>
          <View style={styles.verticalControl}>
            <TouchableOpacity onPress={() => handlePress('VOL_UP')}><ChevronUp color="white" /></TouchableOpacity>
            <Text style={styles.controlLabel}>VOL</Text>
            <TouchableOpacity onPress={() => handlePress('VOL_DOWN')}><ChevronDown color="white" /></TouchableOpacity>
          </View>
          
          <View style={styles.centerControls}>
            <RemoteButton icon={VolumeX} onPress={() => handlePress('MUTE')} />
            <RemoteButton icon={Home} onPress={() => handlePress('HOME')} />
          </View>

          <View style={styles.verticalControl}>
            <TouchableOpacity onPress={() => handlePress('CH_UP')}><ChevronUp color="white" /></TouchableOpacity>
            <Text style={styles.controlLabel}>CH</Text>
            <TouchableOpacity onPress={() => handlePress('CH_DOWN')}><ChevronDown color="white" /></TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Menu */}
      <View style={styles.bottomSection}>
        <RemoteButton icon={ArrowLeft} label="Back" onPress={() => handlePress('BACK')} />
        <RemoteButton icon={Menu} label="Menu" onPress={() => handlePress('MENU')} />
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeMode: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    color: '#888',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  activeModeText: {
    color: 'white',
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  navSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  navPad: {
    width: 220,
    height: 220,
    backgroundColor: '#333',
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navUp: { position: 'absolute', top: 15 },
  navDown: { position: 'absolute', bottom: 15 },
  navLeft: { position: 'absolute', left: 15 },
  navRight: { position: 'absolute', right: 15 },
  navMiddle: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navOk: {
    width: 70,
    height: 70,
    backgroundColor: '#444',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  okText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  controlsSection: {
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verticalControl: {
    backgroundColor: '#333',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: 120,
    justifyContent: 'space-between',
  },
  controlLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerControls: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 20,
  },
});

export default App;
