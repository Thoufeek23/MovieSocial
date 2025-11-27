import { Link, Stack, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View className="flex-1 bg-zinc-950 items-center justify-center p-5">
        <View className="items-center mb-8">
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text className="text-3xl font-bold text-white mt-6 text-center">
            Oops!
          </Text>
          <Text className="text-lg font-semibold text-white mt-2 text-center">
            This screen doesn't exist.
          </Text>
          <Text className="text-gray-400 text-center mt-2 max-w-[80%]">
            The page you are looking for might have been moved, deleted, or possibly never existed.
          </Text>
        </View>

        <Link href="/(tabs)/" asChild>
          <TouchableOpacity className="bg-emerald-500 px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 w-full max-w-xs items-center">
            <Text className="text-white font-bold text-lg">Go to Home</Text>
          </TouchableOpacity>
        </Link>
        
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 p-3 w-full max-w-xs items-center"
        >
          <Text className="text-gray-400 font-semibold text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}