import React from 'react';
import { StyleSheet, SafeAreaView, Image } from 'react-native';

export default function SignContractImg({ route }) {
  const { contractUrl } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={{ uri: contractUrl }}
        style={styles.image}
        resizeMode={styles.image}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    resizeMode: 'contain',
  },
}); 