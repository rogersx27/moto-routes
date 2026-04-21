import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MapScreen } from '../screens/MapScreen';
import { RoutesListScreen } from '../screens/RoutesListScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';

export type RootStackParamList = {
  RoutesList: undefined;
  Map: { routeId?: string };
  RouteDetail: { routeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="RoutesList">
      <Stack.Screen
        name="RoutesList"
        component={RoutesListScreen}
        options={{ title: 'Mis Rutas' }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Mapa', headerBackTitle: 'Rutas' }}
      />
      <Stack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
        options={{ title: 'Detalle de Ruta', headerBackTitle: 'Rutas' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);
