import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, SafeAreaView, PermissionsAndroid } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapView, Camera, PointAnnotation, setAccessToken } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import config from '../utils/config';

// Configuração do MapLibre
setAccessToken(null); // MapLibre não precisa de token

// API key for MapTiler (Free tier)
const MAPTILER_API_KEY = 'BgWPMxygTe3Bgf6VpRQL'; // Free public key, replace with your own for production

// Estilos básicos para o MapLibre usando OpenStreetMap
const osmStyle = {
  version: 8,
  name: "OSM",
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap Contributors",
      maxzoom: 19
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

// Estilo alternativo usando MapTiler
const mapTilerStyle = {
  version: 8,
  name: "MapTiler",
  sources: {
    "openmaptiles": {
      type: "vector",
      url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_API_KEY}`
    }
  },
  glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_API_KEY}`,
  sprite: `https://api.maptiler.com/maps/streets/sprite?key=${MAPTILER_API_KEY}`,
  layers: []
};

// Usar estilo do MapTiler diretamente (mais completo e pronto)
const mapTilerCompleteStyle = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`;

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parâmetros passados pela notificação
  const hasCoordinates = params.latitude && params.longitude;

  // Parse coordinates, handling both period and comma as decimal separators
  const parseCoordinate = (coord: string): number => {
    if (!coord) return 0;
    // Replace comma with period for proper parsing
    return parseFloat(coord.replace(',', '.'));
  };

  const latitude = hasCoordinates ? parseCoordinate(params.latitude as string) : 0;
  const longitude = hasCoordinates ? parseCoordinate(params.longitude as string) : 0;

  console.log('Map coordinates:', { latitude, longitude });
  const title = (params.title as string) || 'Localização';
  const message = (params.message as string) || '';

  // Additional params that might be passed from notification
  const id = (params.id as string) || '';
  const placa = (params.placa as string) || '';
  const endereco = (params.end as string) || '';
  const velocidade = (params.vel as string) || '';
  const data = (params.dt as string) || '';
  const ignicao = (params.ign as string) || 'false';

  // Estado do mapa
  const [useOsmStyle, setUseOsmStyle] = useState(false); // Use MapTiler by default

  // Estado do modal de informações
  const [showInfoModal, setShowInfoModal] = useState(true);

  // Solicitar permissões necessárias
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
          ]);
          console.log("Permissões de localização solicitadas");
        }
      } catch (err) {
        console.warn("Erro ao solicitar permissão:", err);
      }
    };

    requestLocationPermission();
  }, []);

  // Handle map load completion
  const onMapReady = () => {
    console.log('Map is ready');
    // Ensure the info modal is shown when the map loads
    setShowInfoModal(true);
  };

  // Handle map load errors
  const onMapError = () => {
    console.error('Erro ao carregar o mapa');

    // If we're not using OSM style, try switching to it
    if (!useOsmStyle) {
      console.log('Tentando alternar para OpenStreetMap');
      setUseOsmStyle(true);
    }
  };

  // Voltar para a tela anterior
  const goBack = () => {
    router.back();
  };

  // Formatações e textos auxiliares
  const getVelocidadeText = () => {
    if (!velocidade) return 'N/A';
    return `${velocidade} km/h`;
  };

  const getIgnicaoText = () => {
    if (!ignicao) return 'N/A';
    return ignicao === 'true' ? 'Ligada' : 'Desligada';
  };

  const formatData = () => {
    if (!data) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return data;
  };

  // Escolher qual estilo usar
  const currentStyle = useOsmStyle ? osmStyle : mapTilerCompleteStyle;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapStyle={currentStyle}
        onDidFinishLoadingMap={onMapReady}
        onDidFailLoadingMap={onMapError}
      >
        {hasCoordinates && (
          <>
            <Camera
              defaultSettings={{
                centerCoordinate: [longitude, latitude],
                zoomLevel: 18
              }}
            />

            <PointAnnotation
              id="destinationPoint"
              coordinate={[longitude, latitude]}
              title={title}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker} />
              </View>
            </PointAnnotation>
          </>
        )}
      </MapView>

      {/* Botão de voltar */}
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Modal de informações no rodapé */}
      {showInfoModal ? (
        <View style={styles.infoModalContainer}>
          <View style={styles.infoModal}>
            <View style={styles.infoModalHeader}>
              <Ionicons name="notifications-outline" size={18} color={config.colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoModalTitle}>
                {title ? title : 'Detalhes da Notificação'}
              </Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Ionicons name="chevron-down" size={24} color={config.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoModalContent}>

               {message ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{message.replace('Mot:', ' Mot:')}</Text>
                </View>
              ) : null}

              {/* Display vehicle information if available  and no message */}
              
              {!message && placa ? (
                <View style={styles.infoRow}>
                  <Ionicons name="car" size={18} color={config.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>Placa: {placa}</Text>
                </View>
              ) : null}

              {!message && endereco ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color={config.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>{endereco}</Text>
                </View>
              ) : null}

              {!message && velocidade ? (
                <View style={styles.infoRow}>
                  <Ionicons name="speedometer" size={18} color={config.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>Velocidade: {velocidade} km/h</Text>
                </View>
              ) : null}

              {!message && ignicao ? (
                <View style={styles.infoRow}>
                  <Ionicons name="key" size={18} color={config.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    Ignição: {
                      ignicao === '1' || ignicao === 'true' ? 'Ligada' :
                      ignicao === '0' || ignicao === 'false' ? 'Desligada' :
                      ignicao === '4' ? 'Desligada' :
                      `Estado ${ignicao}`
                    }
                  </Text>
                </View>
              ) : null}

              {!message && data ? (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color={config.colors.primary} style={styles.infoIcon} />
                  <Text style={styles.infoText}>Data: {data}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowInfoModal(true)}
        >
          <View style={styles.infoButtonContent}>
            <Ionicons name="information-circle" size={24} color="#fff" />
            <Text style={styles.infoButtonText}>Informações</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: config.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
  },

  buttonText: {
    color: '#fff',
    marginLeft: 5,
  },
  titleContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  markerContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: config.colors.primary,
    borderWidth: 3,
    borderColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoModalContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: config.colors.primary,
    flex: 1,
  },
  infoModalContent: {
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  infoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: config.colors.primary,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});