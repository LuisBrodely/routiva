import * as SecureStore from 'expo-secure-store';

const ACCESS_GROUP = 'routiva.auth';

export const secureStorage = {
  getItem: async (key: string) =>
    SecureStore.getItemAsync(key, {
      keychainService: ACCESS_GROUP,
    }),
  setItem: async (key: string, value: string) =>
    SecureStore.setItemAsync(key, value, {
      keychainService: ACCESS_GROUP,
    }),
  removeItem: async (key: string) =>
    SecureStore.deleteItemAsync(key, {
      keychainService: ACCESS_GROUP,
    }),
};
