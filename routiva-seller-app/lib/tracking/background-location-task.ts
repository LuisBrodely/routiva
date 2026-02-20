import { getUserContext } from '@/lib/auth/get-user-context';
import { supabase } from '@/lib/supabase/client';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { pushSellerLocation } from '@/features/seller-tracking/api/seller-tracking-api';

const SELLER_BACKGROUND_LOCATION_TASK = 'seller-background-location-task';

TaskManager.defineTask(SELLER_BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;

  const payload = data as { locations?: Location.LocationObject[] } | undefined;
  const latest = payload?.locations?.[payload.locations.length - 1];
  if (!latest) return;

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) return;

    const userContext = await getUserContext(sessionData.session.user.id);
    if (userContext.role !== 'SELLER' || !userContext.empresaId || !userContext.vendedorId) return;

    await pushSellerLocation(userContext.empresaId, userContext.vendedorId, {
      latitud: latest.coords.latitude,
      longitud: latest.coords.longitude,
      precisionMetros: latest.coords.accuracy,
      velocidadKmh: latest.coords.speed !== null && latest.coords.speed >= 0 ? latest.coords.speed * 3.6 : null,
    });
  } catch {
    return;
  }
});

async function ensureBackgroundPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    throw new Error('No se otorgo permiso de ubicacion');
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') {
    throw new Error('No se otorgo permiso de ubicacion en segundo plano');
  }
}

export async function startBackgroundLocationTracking() {
  await ensureBackgroundPermissions();

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(SELLER_BACKGROUND_LOCATION_TASK);
  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(SELLER_BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 120_000,
    distanceInterval: 60,
    pausesUpdatesAutomatically: true,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Routiva Seller activo',
      notificationBody: 'Enviando ubicacion en segundo plano',
      notificationColor: '#0f172a',
    },
  });
}

export async function stopBackgroundLocationTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(SELLER_BACKGROUND_LOCATION_TASK);
  if (!started) return;
  await Location.stopLocationUpdatesAsync(SELLER_BACKGROUND_LOCATION_TASK);
}

export async function getBackgroundTrackingStatus() {
  return Location.hasStartedLocationUpdatesAsync(SELLER_BACKGROUND_LOCATION_TASK);
}
