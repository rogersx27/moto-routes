import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from './src/navigation/AppNavigator';
import { DatabaseService } from './src/services';

export default function App() {
  // Initialize SQLite schema on app start
  //todo: esto puedo ser un hook, abstraerlo ayuda a mantener el código limpio y las dependencias bajo control
  useEffect(() => {
    DatabaseService.initSchema();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
