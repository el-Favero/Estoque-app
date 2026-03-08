import { Stack } from "expo-router";
import { EstoqueProvider } from "./context/estoqueStorage";

export default function RootLayout() {
  return (
    <EstoqueProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </EstoqueProvider>
  );
}