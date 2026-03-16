import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { getPlaceSuggestions, generateSessionToken } from '../utils/Maps.js';

// ─── LocationInput ─────────────────────────────────────────────────────────
// Props:
//   label        string
//   placeholder  string
//   value        { address, lat, lng } | null
//   onSelect     (location | null) => void
//   error        string | undefined
//   icon         string emoji

const LocationInput = ({
  label,
  placeholder,
  value,
  onSelect,
  error,
  icon = '📍',
}) => {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [focused,     setFocused]     = useState(false);
  const debounceRef = useRef(null);
  // sessionToken kept for API shape compatibility — Nominatim doesn't use it
  const sessionRef  = useRef(generateSessionToken());

  const fetchSuggestions = useCallback(async (text) => {
    if (text.trim().length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      // Nominatim returns lat/lng directly — no second details call needed
      const results = await getPlaceSuggestions(text);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // 350ms debounce — respects Nominatim 1 req/sec policy
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 350);
  };

  const handleSelectSuggestion = (suggestion) => {
    // Nominatim gives us lat/lng in the suggestion itself — no extra API call
    setSuggestions([]);
    setQuery('');
    setFocused(false);
    sessionRef.current = generateSessionToken();
    onSelect({
      address: suggestion.description,  // full address string sent to backend
      lat:     suggestion.lat,
      lng:     suggestion.lng,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSelect(null);
    setFocused(false);
  };

  // ── Selected state ────────────────────────────────────────────────────────
  if (value?.address && !focused) {
    return (
      <View className="mb-1">
        {label && <Text className="text-black font-medium text-sm mb-[6px]">{label}</Text>}
        <TouchableOpacity
          className="flex-row items-center bg-green-50 border border-green-300 rounded-[10px] px-3 py-[10px]"
          onPress={() => { setFocused(true); onSelect(null); }}
          activeOpacity={0.8}
        >
          <Text className="text-sm mr-2">✓</Text>
          <Text className="text-green-700 font-medium text-[13px] flex-1" numberOfLines={2}>
            {value.address}
          </Text>
          <Text className="text-black font-bold text-xs ml-2">Change</Text>
        </TouchableOpacity>
        {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      </View>
    );
  }

  // Border color: dynamic — must stay inline
  const borderColor = error ? '#EF4444' : focused ? '#000' : '#E5E7EB';

  return (
    <View className="mb-1">
      {label && <Text className="text-black font-medium text-sm mb-[6px]">{label}</Text>}

      {/* Input row */}
      <View
        className="flex-row items-center bg-white rounded-xl px-4 py-[14px]"
        style={{ borderWidth: 1.5, borderColor }}
      >
        <Text className="text-sm mr-2">{icon}</Text>
        <TextInput
          className="flex-1 text-[15px] text-black p-0"
          placeholder={placeholder || 'Search location...'}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => { setFocused(false); setSuggestions([]); }, 200)}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color="#9CA3AF" className="ml-2" />}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} className="p-1 ml-2">
            <Text className="text-[18px] text-gray-400 leading-5">×</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <View
          className="bg-white rounded-xl border border-gray-200 mt-1 max-h-60"
          style={{
            shadowColor:   '#000',
            shadowOffset:  { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius:  12,
            elevation:     6,
            zIndex:        999,
          }}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                className={`flex-row items-center px-4 py-3 ${
                  index < suggestions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Text className="text-sm mr-[10px]">📍</Text>
                <View className="flex-1">
                  <Text className="text-black font-medium text-sm" numberOfLines={1}>
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text className="text-gray-400 text-xs mt-[2px]" numberOfLines={1}>
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default LocationInput;