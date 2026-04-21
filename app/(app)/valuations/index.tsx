import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
  useCalculateVergleichswert,
  useCalculateSubstanzwert,
  useCalculateErtragswert,
  useGenerateValuationPdf,
  useSendValuationReport,
} from '../../../lib/api/valuations';
import type {
  VergleichswertInput,
  VergleichswertResult,
  SubstanzwertInput,
  SubstanzwertResult,
  ErtragswertInput,
  ErtragswertResult,
  Property,
} from '../../../lib/api/valuations';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

/* ── Constants ──────────────────────────────────────────────── */

type Method = 'vergleichswert' | 'substanzwert' | 'ertragswert';
type LandCategoryKey = 'terreno_urbano' | 'terreno_agricola' | 'terreno_forestal' | 'terreno_pastizal';

const COUNTRIES = [
  { value: 'ES', label: 'ES' },
  { value: 'DE', label: 'DE' },
  { value: 'PT', label: 'PT' },
  { value: 'AT', label: 'AT' },
  { value: 'FR', label: 'FR' },
  { value: 'IT', label: 'IT' },
  { value: 'NL', label: 'NL' },
  { value: 'BE', label: 'BE' },
  { value: 'CH', label: 'CH' },
  { value: 'GR', label: 'GR' },
  { value: 'PL', label: 'PL' },
  { value: 'CZ', label: 'CZ' },
  { value: 'HR', label: 'HR' },
  { value: 'HU', label: 'HU' },
  { value: 'GB', label: 'GB' },
];

const HOUSE_CONDITIONS: { id: string; labelKey: string; multiplier: number }[] = [
  { id: 'like_new', labelKey: 'valuation_condLikeNew', multiplier: 1.10 },
  { id: 'good', labelKey: 'valuation_condGood', multiplier: 1.00 },
  { id: 'average', labelKey: 'valuation_condAverage', multiplier: 0.90 },
  { id: 'needs_renovation', labelKey: 'valuation_condRenovation', multiplier: 0.75 },
  { id: 'ruin', labelKey: 'valuation_condRuin', multiplier: 0.50 },
];

const LAND_CONDITIONS: { id: string; labelKey: string; multiplier: number }[] = [
  { id: 'good', labelKey: 'valuation_landCondGood', multiplier: 1.00 },
  { id: 'average', labelKey: 'valuation_landCondAverage', multiplier: 0.80 },
  { id: 'poor', labelKey: 'valuation_landCondPoor', multiplier: 0.55 },
];

const LAND_CATEGORIES: { key: LandCategoryKey; labelKey: string }[] = [
  { key: 'terreno_urbano', labelKey: 'valuation_terrenoUrbano' },
  { key: 'terreno_agricola', labelKey: 'valuation_terrenoAgricola' },
  { key: 'terreno_forestal', labelKey: 'valuation_terrenoForestal' },
  { key: 'terreno_pastizal', labelKey: 'valuation_terrenoPastizal' },
];

const GEBAEUDETYPEN = [
  { value: 'Einfamilienhaus', labelKey: 'valuation_typEfh' },
  { value: 'Doppelhaushaelfte', labelKey: 'valuation_typDhh' },
  { value: 'Reihenhaus', labelKey: 'valuation_typRh' },
  { value: 'Mehrfamilienhaus', labelKey: 'valuation_typMfh' },
  { value: 'Wohnung/Apartment', labelKey: 'valuation_typWohnung' },
  { value: 'Villa', labelKey: 'valuation_typVilla' },
  { value: 'Finca/Landhaus', labelKey: 'valuation_typFinca' },
];

const AUSSTATTUNGEN = [
  { value: 'einfach', labelKey: 'valuation_qualEinfach' },
  { value: 'mittel', labelKey: 'valuation_qualMittel' },
  { value: 'gehoben', labelKey: 'valuation_qualGehoben' },
  { value: 'luxurioes', labelKey: 'valuation_qualLuxurioes' },
];

const ZUSTAENDE = [
  { value: 'sanierungsbeduerftig', labelKey: 'valuation_zustandSanierung' },
  { value: 'normal', labelKey: 'valuation_zustandNormal' },
  { value: 'renoviert', labelKey: 'valuation_zustandRenoviert' },
  { value: 'neuwertig', labelKey: 'valuation_zustandNeuwertig' },
];

const BAR_COLORS: Record<Method, string> = {
  vergleichswert: colors.accent,
  substanzwert: '#34c759',
  ertragswert: '#ff9500',
};

/* ── Main Component ─────────────────────────────────────────── */

export default function ValuationToolScreen() {
  const { t, formatPrice } = useI18n();

  // Property loading
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState('');

  // Active tab
  const [activeMethod, setActiveMethod] = useState<Method>('vergleichswert');

  // Shared fields
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('ES');
  const [livingArea, setLivingArea] = useState('');

  // Vergleichswert — Land categories
  const [landAreas, setLandAreas] = useState<Record<LandCategoryKey, string>>({
    terreno_urbano: '', terreno_agricola: '', terreno_forestal: '', terreno_pastizal: '',
  });
  const [landPrices, setLandPrices] = useState<Record<LandCategoryKey, string>>({
    terreno_urbano: '', terreno_agricola: '', terreno_forestal: '', terreno_pastizal: '',
  });
  const [landConditions, setLandConditions] = useState<Record<LandCategoryKey, string>>({
    terreno_urbano: 'good', terreno_agricola: 'good', terreno_forestal: 'good', terreno_pastizal: 'good',
  });
  const [urbanPriceOverride, setUrbanPriceOverride] = useState('');

  // Vergleichswert — House condition
  const [houseCondition, setHouseCondition] = useState('good');

  // Vergleichswert — Features
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [constructionYear, setConstructionYear] = useState('');
  const [terraceM2, setTerraceM2] = useState('');
  const [garageSpaces, setGarageSpaces] = useState(0);
  const [hasPool, setHasPool] = useState(false);
  const [hasSeaView, setHasSeaView] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [isFurnished, setIsFurnished] = useState(false);

  // Vergleichswert — Special conditions
  const [occupadoEnabled, setOccupadoEnabled] = useState(false);
  const [occupadoDeductionPct, setOccupadoDeductionPct] = useState('30');
  const [nudaPropiedadEnabled, setNudaPropiedadEnabled] = useState(false);
  const [usufructuaryAge, setUsufructuaryAge] = useState('');
  const [isCouple, setIsCouple] = useState(false);
  const [secondAge, setSecondAge] = useState('');

  // Vergleichswert — Custom factor
  const [customFactor, setCustomFactor] = useState(1.0);

  // Substanzwert fields
  const [landArea, setLandArea] = useState('');
  const [baujahr, setBaujahr] = useState('');
  const [gebaeudetyp, setGebaeudetyp] = useState('Einfamilienhaus');
  const [ausstattung, setAusstattung] = useState('mittel');
  const [zustand, setZustand] = useState('normal');

  // Ertragswert fields
  const [mieteinnahmen, setMieteinnahmen] = useState('');
  const [bewirtschaftungskosten, setBewirtschaftungskosten] = useState('');
  const [liegenschaftszins, setLiegenschaftszins] = useState('5.0');
  const [restnutzungsdauer, setRestnutzungsdauer] = useState('40');

  // Results
  const [vergleichswertResult, setVergleichswertResult] = useState<VergleichswertResult | null>(null);
  const [substanzwertResult, setSubstanzwertResult] = useState<SubstanzwertResult | null>(null);
  const [ertragswertResult, setErtragswertResult] = useState<ErtragswertResult | null>(null);

  // Send dialog
  const [sendOpen, setSendOpen] = useState(false);
  const [sendMethods, setSendMethods] = useState<Method[]>([]);
  const [sendEmail, setSendEmail] = useState('');
  const [sendName, setSendName] = useState('');
  const [sendLang, setSendLang] = useState<'de' | 'en' | 'es'>('de');

  // Mutations
  const calcVergleich = useCalculateVergleichswert();
  const calcSubstanz = useCalculateSubstanzwert();
  const calcErtrag = useCalculateErtragswert();
  const generatePdf = useGenerateValuationPdf();
  const sendReport = useSendValuationReport();

  // No customer-facing warning on fallback prices. The backend now always
  // returns a meaningful value via province/national fallback, so end users
  // never see a "please enter manually" prompt. Source tracking happens
  // server-side via price_source field for internal quality monitoring.
  function maybeWarnPriceFetch(
    _data: { price_source?: string; price_fetch_error_code?: string | null } | null | undefined,
  ) {
    // Intentionally a no-op — kept as a stub so existing call sites still compile.
  }

  // Load properties from Supabase
  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('id, title, address, city, postal_code, price, size_m2, rooms, bathrooms, has_garage, garage_spaces, has_terrace, terrace_m2, has_pool, has_sea_view, has_elevator, is_furnished, condition, legal_status, terreno_urbano_m2, terreno_agricola_m2, terreno_forestal_m2, terreno_pastizal_m2')
      .order('title');
    setProperties((data || []) as Property[]);
  }

  // Auto-fill from selected property
  const handlePropertySelect = useCallback((val: string) => {
    setPropertyId(val);
    if (!val) return;
    const prop = properties.find(p => String(p.id) === val);
    if (!prop) return;

    if (prop.size_m2) setLivingArea(String(prop.size_m2));
    if (prop.rooms) setBedrooms(prop.rooms);
    if (prop.bathrooms) setBathrooms(prop.bathrooms);
    if (prop.has_garage && prop.garage_spaces) setGarageSpaces(prop.garage_spaces);
    if (prop.has_terrace && prop.terrace_m2) setTerraceM2(String(prop.terrace_m2));
    if (prop.has_pool != null) setHasPool(prop.has_pool);
    if (prop.has_sea_view != null) setHasSeaView(prop.has_sea_view);
    if (prop.has_elevator != null) setHasElevator(prop.has_elevator);
    if (prop.is_furnished != null) setIsFurnished(prop.is_furnished);
    if (prop.condition) {
      const condMap: Record<string, string> = {
        new: 'like_new', like_new: 'like_new', good: 'good',
        needs_renovation: 'needs_renovation', ruin: 'ruin',
      };
      setHouseCondition(condMap[prop.condition] || 'good');
    }
    if (prop.legal_status === 'occupied') setOccupadoEnabled(true);
    if (prop.postal_code) setPostalCode(prop.postal_code);
    setLandAreas(prev => ({
      ...prev,
      terreno_urbano: prop.terreno_urbano_m2 ? String(prop.terreno_urbano_m2) : prev.terreno_urbano,
      terreno_agricola: prop.terreno_agricola_m2 ? String(prop.terreno_agricola_m2) : prev.terreno_agricola,
      terreno_forestal: prop.terreno_forestal_m2 ? String(prop.terreno_forestal_m2) : prev.terreno_forestal,
      terreno_pastizal: prop.terreno_pastizal_m2 ? String(prop.terreno_pastizal_m2) : prev.terreno_pastizal,
    }));
    if (prop.size_m2) setLandArea(String(prop.size_m2));
  }, [properties]);

  /* ── Calculations ─────────────────────────────────────────── */

  const handleCalculateVergleichswert = () => {
    const selectedCondition = HOUSE_CONDITIONS.find(c => c.id === houseCondition);
    const conditionMultiplier = selectedCondition?.multiplier ?? 1.0;

    let effectiveAge: number | undefined;
    if (nudaPropiedadEnabled && usufructuaryAge) {
      const age1 = parseInt(usufructuaryAge);
      if (isCouple && secondAge) {
        effectiveAge = Math.min(age1, parseInt(secondAge));
      } else {
        effectiveAge = age1;
      }
    }

    const input: VergleichswertInput = {
      postal_code: postalCode,
      country,
      living_area_sqm: parseFloat(livingArea) || 0,
      land_categories: {
        terreno_urbano: { area_m2: parseFloat(landAreas.terreno_urbano) || 0, condition: landConditions.terreno_urbano as 'good' | 'average' | 'poor' },
        terreno_agricola: { area_m2: parseFloat(landAreas.terreno_agricola) || 0, price_per_m2: parseFloat(landPrices.terreno_agricola) || 0, condition: landConditions.terreno_agricola as 'good' | 'average' | 'poor' },
        terreno_forestal: { area_m2: parseFloat(landAreas.terreno_forestal) || 0, price_per_m2: parseFloat(landPrices.terreno_forestal) || 0, condition: landConditions.terreno_forestal as 'good' | 'average' | 'poor' },
        terreno_pastizal: { area_m2: parseFloat(landAreas.terreno_pastizal) || 0, price_per_m2: parseFloat(landPrices.terreno_pastizal) || 0, condition: landConditions.terreno_pastizal as 'good' | 'average' | 'poor' },
      },
      terreno_urbano_price_override: urbanPriceOverride ? parseFloat(urbanPriceOverride) : undefined,
      condition_factor: 1.0,
      condition_multiplier: conditionMultiplier,
      condition_label: houseCondition,
      custom_adjustment_factor: customFactor,
      property_id: propertyId ? parseInt(propertyId) : undefined,
      bedrooms,
      bathrooms,
      construction_year: constructionYear ? parseInt(constructionYear) : undefined,
      terrace_m2: parseFloat(terraceM2) || 0,
      garage_spaces: garageSpaces,
      has_pool: hasPool,
      has_sea_view: hasSeaView,
      has_elevator: hasElevator,
      furnished: isFurnished,
      occupado_enabled: occupadoEnabled,
      occupado_deduction_pct: occupadoEnabled ? parseFloat(occupadoDeductionPct) || 30 : 0,
      nuda_propiedad_enabled: nudaPropiedadEnabled,
      usufructuary_age: effectiveAge,
    };

    calcVergleich.mutate(input, {
      onSuccess: (data) => {
        setVergleichswertResult(data);
        maybeWarnPriceFetch(data);
      },
      onError: (err) => Alert.alert(t('error'), err.message),
    });
  };

  const handleCalculateSubstanzwert = () => {
    const input: SubstanzwertInput = {
      postal_code: postalCode,
      country,
      wohnflaeche: parseFloat(livingArea) || 0,
      grundstuecksflaeche: parseFloat(landArea) || 0,
      baujahr: parseInt(baujahr),
      gebaeudetyp,
      ausstattungsqualitaet: ausstattung,
      zustand,
      property_id: propertyId ? parseInt(propertyId) : undefined,
    };

    calcSubstanz.mutate(input, {
      onSuccess: (data) => {
        setSubstanzwertResult(data);
        maybeWarnPriceFetch(data);
      },
      onError: (err) => Alert.alert(t('error'), err.message),
    });
  };

  const handleCalculateErtragswert = () => {
    const input: ErtragswertInput = {
      postal_code: postalCode,
      country,
      grundstuecksflaeche: parseFloat(landArea) || 0,
      monatliche_mieteinnahmen: parseFloat(mieteinnahmen),
      jaehrliche_bewirtschaftungskosten: bewirtschaftungskosten ? parseFloat(bewirtschaftungskosten) : undefined,
      liegenschaftszins: parseFloat(liegenschaftszins),
      restnutzungsdauer: parseInt(restnutzungsdauer),
      property_id: propertyId ? parseInt(propertyId) : undefined,
    };

    calcErtrag.mutate(input, {
      onSuccess: (data) => {
        setErtragswertResult(data);
        maybeWarnPriceFetch(data);
      },
      onError: (err) => Alert.alert(t('error'), err.message),
    });
  };

  const handleCalculate = () => {
    if (activeMethod === 'vergleichswert') handleCalculateVergleichswert();
    else if (activeMethod === 'substanzwert') handleCalculateSubstanzwert();
    else handleCalculateErtragswert();
  };

  const isCalculating = calcVergleich.isPending || calcSubstanz.isPending || calcErtrag.isPending;

  /* ── Send / PDF ───────────────────────────────────────────── */

  const openSendDialog = () => {
    const available: Method[] = [];
    if (vergleichswertResult) available.push('vergleichswert');
    if (substanzwertResult) available.push('substanzwert');
    if (ertragswertResult) available.push('ertragswert');
    setSendMethods(available);
    setSendOpen(true);
  };

  const getResultsPayload = () => {
    const r: Record<string, VergleichswertResult | SubstanzwertResult | ErtragswertResult> = {};
    if (sendMethods.includes('vergleichswert') && vergleichswertResult) r.vergleichswert = vergleichswertResult;
    if (sendMethods.includes('substanzwert') && substanzwertResult) r.substanzwert = substanzwertResult;
    if (sendMethods.includes('ertragswert') && ertragswertResult) r.ertragswert = ertragswertResult;
    return r;
  };

  const handleDownloadPdf = () => {
    if (sendMethods.length === 0) return;
    generatePdf.mutate(
      { methods: sendMethods, results: getResultsPayload(), language: sendLang, property_id: propertyId ? parseInt(propertyId) : undefined },
      {
        onSuccess: () => {
          // Share sheet already opened — just close modal silently
          setSendOpen(false);
        },
        onError: (err: any) => {
          // User cancelled share? don't show error. Check message.
          const msg = err?.message || '';
          if (!/cancel|dismiss/i.test(msg)) {
            Alert.alert(t('error'), t('valuation_pdfError'));
          }
        },
      },
    );
  };

  const handleSendEmail = () => {
    if (sendMethods.length === 0 || !sendEmail.trim()) return;
    sendReport.mutate(
      {
        methods: sendMethods,
        results: getResultsPayload(),
        customerEmail: sendEmail.trim(),
        customerName: sendName.trim() || undefined,
        language: sendLang,
        property_id: propertyId ? parseInt(propertyId) : undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(t('valuation_emailSent'));
          setSendOpen(false);
          setSendEmail('');
          setSendName('');
        },
        onError: () => Alert.alert(t('error'), t('valuation_emailError')),
      },
    );
  };

  const toggleSendMethod = (m: Method) => {
    setSendMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  /* ── Comparison data ──────────────────────────────────────── */

  const completedMethods: { method: Method; label: string; value: number }[] = [];
  if (vergleichswertResult) completedMethods.push({ method: 'vergleichswert', label: t('valuation_method_vergleichswert'), value: vergleichswertResult.adjusted_value });
  if (substanzwertResult) completedMethods.push({ method: 'substanzwert', label: t('valuation_method_substanzwert'), value: substanzwertResult.substanzwert });
  if (ertragswertResult) completedMethods.push({ method: 'ertragswert', label: t('valuation_method_ertragswert'), value: ertragswertResult.ertragswert });

  const hasAnyResult = completedMethods.length > 0;

  /* ── Validate ─────────────────────────────────────────────── */

  const canCalculate = () => {
    if (!postalCode) return false;
    if (activeMethod === 'vergleichswert') return true; // PLZ is enough
    if (activeMethod === 'substanzwert') return !!livingArea && !!baujahr;
    if (activeMethod === 'ertragswert') return !!mieteinnahmen && !!liegenschaftszins && !!restnutzungsdauer;
    return false;
  };

  /* ── Method tabs ──────────────────────────────────────────── */

  const methods: { key: Method; label: string }[] = [
    { key: 'vergleichswert', label: t('valuation_method_vergleichswert') },
    { key: 'substanzwert', label: t('valuation_method_substanzwert') },
    { key: 'ertragswert', label: t('valuation_method_ertragswert') },
  ];

  /* ── Nuda propiedad preview ───────────────────────────────── */

  const nudaPreview = (() => {
    if (!nudaPropiedadEnabled || !usufructuaryAge) return null;
    const age = isCouple && secondAge ? Math.min(parseInt(usufructuaryAge), parseInt(secondAge)) : parseInt(usufructuaryAge);
    if (isNaN(age) || age < 18) return null;
    const usufructPct = Math.max(10, Math.min(70, 89 - age));
    const nudaPct = 100 - usufructPct;
    return { usufructPct, nudaPct };
  })();

  /* ── Construction year age factor ─────────────────────────── */

  const ageFactor = (() => {
    if (!constructionYear) return null;
    const year = parseInt(constructionYear);
    if (isNaN(year) || year < 1800 || year > 2026) return null;
    const age = 2026 - year;
    let pct = 0;
    if (age <= 5) pct = 3;
    else if (age <= 15) pct = 0;
    else if (age <= 30) pct = -5;
    else if (age <= 50) pct = -10;
    else if (age <= 75) pct = -15;
    else pct = -20;
    return { age, pct };
  })();

  /* ── Bedroom factor display ───────────────────────────────── */

  const bedroomFactorDisplay = (() => {
    if (bedrooms === 2) return null;
    if (bedrooms === 0) return '-15%';
    if (bedrooms === 1) return '-8%';
    if (bedrooms === 3) return '+5%';
    if (bedrooms === 4) return '+10%';
    return '+15%';
  })();

  const bathroomFactorDisplay = (() => {
    if (bathrooms <= 1) return null;
    if (bathrooms === 2) return '+5%';
    if (bathrooms === 3) return '+10%';
    return '+15%';
  })();

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerTitle: t('valuation_title') }} />

      {/* ─── Method Tabs ─── */}
      <View style={styles.methodRow}>
        {methods.map((m) => (
          <TouchableOpacity
            key={m.key}
            onPress={() => setActiveMethod(m.key)}
            style={[styles.methodTab, activeMethod === m.key && styles.methodTabActive]}
          >
            <Text style={[styles.methodLabel, activeMethod === m.key && styles.methodLabelActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Shared Fields ─── */}
      <Text style={styles.sectionHeader}>{t('valuation_inputSection')}</Text>
      <Card>
        {/* Property Selector */}
        {properties.length > 0 && (
          <FormSelect
            label={t('valuation_linkProperty')}
            value={propertyId}
            onChange={handlePropertySelect}
            placeholder={t('valuation_selectProperty')}
            options={properties.map(p => ({
              label: `${p.title}${p.city ? ' · ' + p.city : ''}`,
              value: String(p.id),
            }))}
          />
        )}

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormInput
              label={t('valuation_postalCode')}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="07001"
              keyboardType="number-pad"
              required
            />
          </View>
          <View style={styles.halfField}>
            <FormSelect
              label={t('valuation_country')}
              value={country}
              onChange={setCountry}
              options={COUNTRIES}
            />
          </View>
        </View>

        {/* Living Area — for Vergleichswert & Substanzwert */}
        {activeMethod !== 'ertragswert' && (
          <FormInput
            label={t('valuation_livingArea')}
            value={livingArea}
            onChangeText={setLivingArea}
            placeholder="120"
            keyboardType="numeric"
            required={activeMethod === 'substanzwert'}
          />
        )}

        {/* Land Area — single field for Substanzwert & Ertragswert */}
        {activeMethod !== 'vergleichswert' && (
          <FormInput
            label={t('valuation_landArea')}
            value={landArea}
            onChangeText={setLandArea}
            placeholder="500"
            keyboardType="numeric"
          />
        )}
      </Card>

      {/* ═══════ VERGLEICHSWERT-SPECIFIC FIELDS ═══════ */}
      {activeMethod === 'vergleichswert' && (
        <>
          {/* Land Categories */}
          <Text style={styles.sectionHeader}>{t('valuation_landCategoriesTitle')}</Text>
          <Card>
            {LAND_CATEGORIES.map((cat) => {
              const areaVal = parseFloat(landAreas[cat.key]) || 0;
              return (
                <View key={cat.key} style={styles.landCategoryBlock}>
                  <FormInput
                    label={`${t(cat.labelKey)} (m²)`}
                    value={landAreas[cat.key]}
                    onChangeText={(v) => setLandAreas(prev => ({ ...prev, [cat.key]: v }))}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  {/* Price override for urbano, manual price for others */}
                  {areaVal > 0 && (
                    <>
                      {cat.key === 'terreno_urbano' ? (
                        <FormInput
                          label={t('valuation_urbanPriceOverride')}
                          value={urbanPriceOverride}
                          onChangeText={setUrbanPriceOverride}
                          placeholder={t('valuation_pricePlaceholder')}
                          keyboardType="numeric"
                        />
                      ) : (
                        <FormInput
                          label={`${t('valuation_priceOverride')} (€/m²)`}
                          value={landPrices[cat.key]}
                          onChangeText={(v) => setLandPrices(prev => ({ ...prev, [cat.key]: v }))}
                          placeholder={t('valuation_priceAutoPlaceholder')}
                          keyboardType="numeric"
                        />
                      )}
                      {/* Land condition selector */}
                      <Text style={styles.miniLabel}>{t('valuation_landCondition')}</Text>
                      <View style={styles.segmentRow}>
                        {LAND_CONDITIONS.map((lc) => (
                          <TouchableOpacity
                            key={lc.id}
                            onPress={() => setLandConditions(prev => ({ ...prev, [cat.key]: lc.id }))}
                            style={[styles.segmentBtn, landConditions[cat.key] === lc.id && styles.segmentBtnActive]}
                          >
                            <Text style={[styles.segmentBtnText, landConditions[cat.key] === lc.id && styles.segmentBtnTextActive]}>
                              {t(lc.labelKey)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </Card>

          {/* House Condition */}
          <Text style={styles.sectionHeader}>{t('valuation_houseCondition')}</Text>
          <Card>
            <View style={styles.conditionRow}>
              {HOUSE_CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond.id}
                  onPress={() => setHouseCondition(cond.id)}
                  style={[styles.conditionTab, houseCondition === cond.id && styles.conditionTabActive]}
                >
                  <Text style={[styles.conditionLabel, houseCondition === cond.id && styles.conditionLabelActive]}>
                    {t(cond.labelKey)}
                  </Text>
                  <Text style={[styles.conditionMult, houseCondition === cond.id && styles.conditionMultActive]}>
                    {cond.multiplier > 1 ? '+' : ''}{Math.round((cond.multiplier - 1) * 100)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Features & Characteristics */}
          <Text style={styles.sectionHeader}>{t('valuation_featuresSection')}</Text>
          <Card>
            {/* Steppers */}
            <View style={styles.stepperRow}>
              {/* Bedrooms */}
              <View style={styles.stepperItem}>
                <Text style={styles.miniLabel}>{t('valuation_bedrooms')}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => setBedrooms(Math.max(0, bedrooms - 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{bedrooms === 0 ? t('valuation_studio') : bedrooms}</Text>
                  <TouchableOpacity onPress={() => setBedrooms(Math.min(8, bedrooms + 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {bedroomFactorDisplay && (
                  <Text style={[styles.factorText, { color: bedroomFactorDisplay.startsWith('-') ? colors.error : colors.success }]}>
                    {bedroomFactorDisplay}
                  </Text>
                )}
              </View>

              {/* Bathrooms */}
              <View style={styles.stepperItem}>
                <Text style={styles.miniLabel}>{t('valuation_bathrooms')}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => setBathrooms(Math.max(1, bathrooms - 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{bathrooms}</Text>
                  <TouchableOpacity onPress={() => setBathrooms(Math.min(6, bathrooms + 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {bathroomFactorDisplay && (
                  <Text style={[styles.factorText, { color: colors.success }]}>{bathroomFactorDisplay}</Text>
                )}
              </View>

              {/* Garage */}
              <View style={styles.stepperItem}>
                <Text style={styles.miniLabel}>{t('valuation_garageSpaces')}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => setGarageSpaces(Math.max(0, garageSpaces - 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{garageSpaces}</Text>
                  <TouchableOpacity onPress={() => setGarageSpaces(Math.min(4, garageSpaces + 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {garageSpaces > 0 && (
                  <Text style={[styles.factorText, { color: colors.success }]}>+{(garageSpaces * 5000).toLocaleString()}</Text>
                )}
              </View>
            </View>

            {/* Terrace */}
            <FormInput
              label={t('valuation_terraceArea')}
              value={terraceM2}
              onChangeText={setTerraceM2}
              placeholder="0"
              keyboardType="numeric"
            />

            {/* Construction Year */}
            <FormInput
              label={t('valuation_constructionYear')}
              value={constructionYear}
              onChangeText={setConstructionYear}
              placeholder="1985"
              keyboardType="number-pad"
            />
            {ageFactor && (
              <Text style={[styles.factorText, { color: ageFactor.pct > 0 ? colors.success : ageFactor.pct < 0 ? colors.error : colors.textTertiary, marginBottom: spacing.sm }]}>
                {ageFactor.age} {t('valuation_yearsOld')} → {ageFactor.pct > 0 ? '+' : ''}{ageFactor.pct}%
              </Text>
            )}

            {/* Boolean toggles */}
            <Text style={[styles.miniLabel, { marginTop: spacing.sm }]}>{t('valuation_featureToggles')}</Text>
            <View style={styles.toggleRow}>
              {([
                { key: 'pool', state: hasPool, setter: setHasPool, labelKey: 'valuation_pool', effect: '+5%' },
                { key: 'sea_view', state: hasSeaView, setter: setHasSeaView, labelKey: 'valuation_seaView', effect: '+15%' },
                { key: 'elevator', state: hasElevator, setter: setHasElevator, labelKey: 'valuation_elevator', effect: '+3%' },
                { key: 'furnished', state: isFurnished, setter: setIsFurnished, labelKey: 'valuation_furnished', effect: '+3%' },
              ] as const).map((toggle) => (
                <TouchableOpacity
                  key={toggle.key}
                  onPress={() => toggle.setter(!toggle.state)}
                  style={[styles.togglePill, toggle.state && styles.togglePillActive]}
                >
                  <Text style={[styles.togglePillText, toggle.state && styles.togglePillTextActive]}>
                    {t(toggle.labelKey)} {toggle.effect}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Special Conditions */}
          <Text style={styles.sectionHeader}>{t('valuation_specialConditions')}</Text>
          <Card>
            {/* Occupado */}
            <View style={styles.toggleWithLabel}>
              <View style={styles.toggleLabelRow}>
                <Text style={styles.toggleMainLabel}>{t('valuation_occupado')}</Text>
                <Switch
                  value={occupadoEnabled}
                  onValueChange={setOccupadoEnabled}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={occupadoEnabled ? colors.primary : colors.surface}
                />
              </View>
              <Text style={styles.toggleDesc}>{t('valuation_occupadoDesc')}</Text>
            </View>

            {occupadoEnabled && (
              <View style={styles.indented}>
                <FormInput
                  label={t('valuation_occupadoDeductionPct')}
                  value={occupadoDeductionPct}
                  onChangeText={setOccupadoDeductionPct}
                  placeholder="30"
                  keyboardType="numeric"
                />
                <Text style={styles.helpText}>{t('valuation_occupadoRecommendation')}</Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Nuda Propiedad */}
            <View style={styles.toggleWithLabel}>
              <View style={styles.toggleLabelRow}>
                <Text style={styles.toggleMainLabel}>{t('valuation_nudaPropiedad')}</Text>
                <Switch
                  value={nudaPropiedadEnabled}
                  onValueChange={setNudaPropiedadEnabled}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={nudaPropiedadEnabled ? colors.primary : colors.surface}
                />
              </View>
              <Text style={styles.toggleDesc}>{t('valuation_nudaPropiedadDesc')}</Text>
            </View>

            {nudaPropiedadEnabled && (
              <View style={styles.indented}>
                <FormInput
                  label={t('valuation_usufructuaryAge')}
                  value={usufructuaryAge}
                  onChangeText={setUsufructuaryAge}
                  placeholder="70"
                  keyboardType="number-pad"
                />
                <View style={styles.toggleLabelRow}>
                  <Text style={styles.miniLabel}>{t('valuation_couple')}</Text>
                  <Switch
                    value={isCouple}
                    onValueChange={setIsCouple}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={isCouple ? colors.primary : colors.surface}
                  />
                </View>
                {isCouple && (
                  <FormInput
                    label={t('valuation_secondAge')}
                    value={secondAge}
                    onChangeText={setSecondAge}
                    placeholder="65"
                    keyboardType="number-pad"
                  />
                )}
                {nudaPreview && (
                  <View style={styles.nudaPreview}>
                    <Text style={styles.nudaPreviewText}>
                      {t('valuation_usufructPct')}: {nudaPreview.usufructPct}% | {t('valuation_nudaPropiedadPct')}: {nudaPreview.nudaPct}%
                    </Text>
                  </View>
                )}
                <Text style={styles.helpText}>{t('valuation_nudaFormula')}</Text>
              </View>
            )}
          </Card>

          {/* Custom Factor */}
          <Text style={styles.sectionHeader}>{t('valuation_customFactor')}</Text>
          <Card>
            <Text style={styles.sliderLabel}>
              {t('valuation_customFactorValue')}: {customFactor.toFixed(2)}
            </Text>
            <Slider
              minimumValue={0.5}
              maximumValue={2.0}
              value={customFactor}
              onValueChange={setCustomFactor}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
              step={0.01}
            />
            <Text style={styles.helpText}>{t('valuation_customFactorHelp')}</Text>
          </Card>
        </>
      )}

      {/* ═══════ SUBSTANZWERT-SPECIFIC FIELDS ═══════ */}
      {activeMethod === 'substanzwert' && (
        <>
          <Text style={styles.sectionHeader}>{t('valuation_substanzwertFields')}</Text>
          <Card>
            <FormInput
              label={t('valuation_baujahr')}
              value={baujahr}
              onChangeText={setBaujahr}
              placeholder="1995"
              keyboardType="number-pad"
              required
            />
            <FormSelect
              label={t('valuation_gebaeudetyp')}
              value={gebaeudetyp}
              onChange={setGebaeudetyp}
              options={GEBAEUDETYPEN.map(g => ({ label: t(g.labelKey), value: g.value }))}
            />
            <FormSelect
              label={t('valuation_ausstattungsqualitaet')}
              value={ausstattung}
              onChange={setAusstattung}
              options={AUSSTATTUNGEN.map(a => ({ label: t(a.labelKey), value: a.value }))}
            />
            <FormSelect
              label={t('valuation_zustand')}
              value={zustand}
              onChange={setZustand}
              options={ZUSTAENDE.map(z => ({ label: t(z.labelKey), value: z.value }))}
            />
          </Card>
        </>
      )}

      {/* ═══════ ERTRAGSWERT-SPECIFIC FIELDS ═══════ */}
      {activeMethod === 'ertragswert' && (
        <>
          <Text style={styles.sectionHeader}>{t('valuation_ertragswertFields')}</Text>
          <Card>
            <FormInput
              label={t('valuation_mieteinnahmen')}
              value={mieteinnahmen}
              onChangeText={setMieteinnahmen}
              placeholder="1500"
              keyboardType="numeric"
              required
            />
            <FormInput
              label={t('valuation_bewirtschaftungskosten')}
              value={bewirtschaftungskosten}
              onChangeText={setBewirtschaftungskosten}
              placeholder=""
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>{t('valuation_bewirtschaftungskostenHelp')}</Text>
            <FormInput
              label={t('valuation_liegenschaftszins')}
              value={liegenschaftszins}
              onChangeText={setLiegenschaftszins}
              placeholder="5.0"
              keyboardType="numeric"
              required
            />
            <Text style={styles.helpText}>{t('valuation_liegenschaftszinsHelp')}</Text>
            <FormInput
              label={t('valuation_restnutzungsdauer')}
              value={restnutzungsdauer}
              onChangeText={setRestnutzungsdauer}
              placeholder="40"
              keyboardType="number-pad"
              required
            />
          </Card>
        </>
      )}

      {/* ═══════ CALCULATE BUTTON ═══════ */}
      <View style={styles.calculateSection}>
        <Button
          title={isCalculating ? t('valuation_calculating') : t('valuation_calculate')}
          onPress={handleCalculate}
          loading={isCalculating}
          disabled={!canCalculate()}
        />
      </View>

      {/* ═══════ VERGLEICHSWERT RESULT ═══════ */}
      {activeMethod === 'vergleichswert' && vergleichswertResult && (
        <VergleichswertResultDisplay result={vergleichswertResult} t={t} formatPrice={formatPrice} />
      )}

      {/* ═══════ SUBSTANZWERT RESULT ═══════ */}
      {activeMethod === 'substanzwert' && substanzwertResult && (
        <SubstanzwertResultDisplay result={substanzwertResult} t={t} formatPrice={formatPrice} />
      )}

      {/* ═══════ ERTRAGSWERT RESULT ═══════ */}
      {activeMethod === 'ertragswert' && ertragswertResult && (
        <ErtragswertResultDisplay result={ertragswertResult} t={t} formatPrice={formatPrice} />
      )}

      {/* ═══════ COMPARISON VIEW ═══════ */}
      {completedMethods.length >= 2 && (
        <ComparisonView methods={completedMethods} t={t} formatPrice={formatPrice} />
      )}

      {completedMethods.length === 1 && (
        <Text style={styles.comparisonHint}>{t('valuation_comparisonHint')}</Text>
      )}

      {/* ═══════ SEND BUTTON ═══════ */}
      {hasAnyResult && (
        <View style={styles.sendBtnRow}>
          <Button
            title={t('valuation_sendReport')}
            onPress={openSendDialog}
            variant="secondary"
            icon={<Ionicons name="send-outline" size={16} color={colors.primary} />}
          />
        </View>
      )}

      {/* ═══════ SEND DIALOG MODAL ═══════ */}
      <Modal visible={sendOpen} transparent animationType="fade" onRequestClose={() => setSendOpen(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('valuation_sendTitle')}</Text>
                  <TouchableOpacity onPress={() => setSendOpen(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={styles.modalScrollContent}
                >
                  {/* Method checkboxes */}
                  <Text style={styles.miniLabel}>{t('valuation_selectMethods')}</Text>
                  {vergleichswertResult && (
                    <TouchableOpacity onPress={() => toggleSendMethod('vergleichswert')} style={styles.checkboxRow}>
                      <Ionicons
                        name={sendMethods.includes('vergleichswert') ? 'checkbox' : 'square-outline'}
                        size={22} color={sendMethods.includes('vergleichswert') ? colors.primary : colors.textTertiary}
                      />
                      <Text style={styles.checkboxLabel}>{t('valuation_method_vergleichswert')}</Text>
                      <Text style={[styles.checkboxValue, { color: colors.accent }]}>{formatPrice(vergleichswertResult.adjusted_value)}</Text>
                    </TouchableOpacity>
                  )}
                  {substanzwertResult && (
                    <TouchableOpacity onPress={() => toggleSendMethod('substanzwert')} style={styles.checkboxRow}>
                      <Ionicons
                        name={sendMethods.includes('substanzwert') ? 'checkbox' : 'square-outline'}
                        size={22} color={sendMethods.includes('substanzwert') ? colors.primary : colors.textTertiary}
                      />
                      <Text style={styles.checkboxLabel}>{t('valuation_method_substanzwert')}</Text>
                      <Text style={[styles.checkboxValue, { color: '#34c759' }]}>{formatPrice(substanzwertResult.substanzwert)}</Text>
                    </TouchableOpacity>
                  )}
                  {ertragswertResult && (
                    <TouchableOpacity onPress={() => toggleSendMethod('ertragswert')} style={styles.checkboxRow}>
                      <Ionicons
                        name={sendMethods.includes('ertragswert') ? 'checkbox' : 'square-outline'}
                        size={22} color={sendMethods.includes('ertragswert') ? colors.primary : colors.textTertiary}
                      />
                      <Text style={styles.checkboxLabel}>{t('valuation_method_ertragswert')}</Text>
                      <Text style={[styles.checkboxValue, { color: '#ff9500' }]}>{formatPrice(ertragswertResult.ertragswert)}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Customer email */}
                  <FormInput
                    label={t('valuation_customerEmail')}
                    value={sendEmail}
                    onChangeText={setSendEmail}
                    placeholder="kunde@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required
                  />

                  {/* Customer name */}
                  <FormInput
                    label={t('valuation_customerName')}
                    value={sendName}
                    onChangeText={setSendName}
                    placeholder="Max Mustermann"
                  />

                  {/* Language selector */}
                  <Text style={styles.miniLabel}>{t('valuation_reportLanguage')}</Text>
                  <View style={styles.segmentRow}>
                    {(['de', 'en', 'es'] as const).map((l) => (
                      <TouchableOpacity
                        key={l}
                        onPress={() => setSendLang(l)}
                        style={[styles.segmentBtn, sendLang === l && styles.segmentBtnActive]}
                      >
                        <Text style={[styles.segmentBtnText, sendLang === l && styles.segmentBtnTextActive]}>
                          {l === 'de' ? 'Deutsch' : l === 'en' ? 'English' : 'Español'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.modalActions}>
                    <Button
                      title={generatePdf.isPending ? t('valuation_generatingPdf') : t('valuation_downloadPdf')}
                      onPress={handleDownloadPdf}
                      loading={generatePdf.isPending}
                      disabled={sendMethods.length === 0}
                      variant="outline"
                      icon={<Ionicons name="download-outline" size={16} color={colors.primary} />}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title={sendReport.isPending ? t('valuation_sendingEmail') : t('valuation_sendEmail')}
                      onPress={handleSendEmail}
                      loading={sendReport.isPending}
                      disabled={sendMethods.length === 0 || !sendEmail.trim()}
                      icon={<Ionicons name="mail-outline" size={16} color={colors.white} />}
                      style={{ flex: 1 }}
                    />
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

/* ── Result Display Components ──────────────────────────────── */

function BreakdownRow({ label, value, highlight, separator }: { label: string; value: string; highlight?: boolean; separator?: boolean }) {
  if (separator) {
    return <View style={styles.breakdownSeparator} />;
  }
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, highlight && styles.breakdownHighlight]} numberOfLines={2}>{label}</Text>
      {value ? <Text style={[styles.breakdownValue, highlight && styles.breakdownHighlightValue]}>{value}</Text> : null}
    </View>
  );
}

function VergleichswertResultDisplay({ result: r, t, formatPrice }: { result: VergleichswertResult; t: (k: string) => string; formatPrice: (n: number | null) => string }) {
  const headlineValue = r.nuda_propiedad_enabled && r.nuda_propiedad_value != null
    ? r.nuda_propiedad_value
    : r.adjusted_value;

  const rows: { label: string; value: string; highlight?: boolean; separator?: boolean }[] = [];

  // Building section
  if (r.living_area_sqm > 0) {
    rows.push({ label: `${t('valuation_buildingValue')} (${r.living_area_sqm} m² × ${formatPrice(r.avg_sqm_built)})`, value: formatPrice(r.building_value ?? r.base_value_built) });

    if (r.condition_multiplier != null && r.condition_multiplier !== 1.0) {
      const pctStr = `${r.condition_multiplier > 1 ? '+' : ''}${Math.round((r.condition_multiplier - 1) * 100)}%`;
      rows.push({ label: `${t('valuation_conditionAdjustment')} (${pctStr})`, value: formatPrice((r.building_value ?? r.base_value_built) * r.condition_multiplier) });
    }

    if (r.bedroom_factor != null && r.bedroom_factor !== 1.0) {
      const pctStr = `${r.bedroom_factor > 1 ? '+' : ''}${Math.round((r.bedroom_factor - 1) * 100)}%`;
      rows.push({ label: `${t('valuation_bedroomFactor')}: ${r.bedrooms === 0 ? t('valuation_studio') : r.bedrooms} (${pctStr})`, value: '' });
    }

    if (r.bathroom_factor != null && r.bathroom_factor !== 1.0) {
      rows.push({ label: `${t('valuation_bathroomFactor')}: ${r.bathrooms} (+${Math.round((r.bathroom_factor - 1) * 100)}%)`, value: '' });
    }

    if (r.age_factor != null && r.age_factor !== 1.0 && r.construction_year != null) {
      const pctStr = `${r.age_factor > 1 ? '+' : ''}${Math.round((r.age_factor - 1) * 100)}%`;
      rows.push({ label: `${t('valuation_ageFactor')} ${r.construction_year} (${pctStr})`, value: '' });
    }

    rows.push({ label: t('valuation_adjustedBuildingValue'), value: formatPrice(r.adjusted_building_value ?? r.base_value_built) });
    rows.push({ label: '', value: '', separator: true });
  }

  // Land categories
  if (r.land_categories) {
    const cats = r.land_categories;
    const catDefs: { key: keyof typeof cats; labelKey: string }[] = [
      { key: 'terreno_urbano', labelKey: 'valuation_terrenoUrbano' },
      { key: 'terreno_agricola', labelKey: 'valuation_terrenoAgricola' },
      { key: 'terreno_forestal', labelKey: 'valuation_terrenoForestal' },
      { key: 'terreno_pastizal', labelKey: 'valuation_terrenoPastizal' },
    ];
    for (const cd of catDefs) {
      const c = cats[cd.key];
      if (c && c.area_m2 > 0) {
        rows.push({ label: `${t(cd.labelKey)} (${c.area_m2} m² × ${formatPrice(c.price_per_m2)})`, value: formatPrice(c.value) });
      }
    }
  }

  // Terrace & Garage
  if (r.terrace_m2 != null && r.terrace_m2 > 0 && r.terrace_value != null) {
    rows.push({ label: `${t('valuation_terracePremium')} (${r.terrace_m2} m²)`, value: formatPrice(r.terrace_value) });
  }
  if (r.garage_spaces != null && r.garage_spaces > 0 && r.garage_value != null) {
    rows.push({ label: `${t('valuation_parkingPremium')} (${r.garage_spaces})`, value: formatPrice(r.garage_value) });
  }

  rows.push({ label: '', value: '', separator: true });

  // Subtotal
  if (r.subtotal != null) {
    rows.push({ label: t('valuation_subtotal'), value: formatPrice(r.subtotal) });
  }

  // Feature premiums
  if (r.has_sea_view && r.sea_view_factor != null) rows.push({ label: `${t('valuation_seaView')} (+15%)`, value: '' });
  if (r.has_pool && r.pool_factor != null) rows.push({ label: `${t('valuation_pool')} (+5%)`, value: '' });
  if (r.has_elevator && r.elevator_factor != null) rows.push({ label: `${t('valuation_elevator')} (+3%)`, value: '' });
  if (r.furnished && r.furnished_factor != null) rows.push({ label: `${t('valuation_furnished')} (+3%)`, value: '' });

  if (r.gross_total != null && (r.has_pool || r.has_sea_view || r.has_elevator || r.furnished)) {
    rows.push({ label: t('valuation_grossTotal'), value: formatPrice(r.gross_total) });
  }

  if (r.custom_adjustment_factor !== 1.0) {
    rows.push({ label: t('valuation_customFactorLabel'), value: r.custom_adjustment_factor.toFixed(2) });
  }

  // Occupado
  if (r.occupado_enabled && r.occupado_deduction != null) {
    rows.push({ label: '', value: '', separator: true });
    rows.push({ label: t('valuation_valueBeforeOccupado'), value: formatPrice(r.value_before_occupado ?? r.adjusted_value) });
    rows.push({ label: `${t('valuation_occupadoDeduction')} (-${r.occupado_deduction_pct ?? 30}%)`, value: `- ${formatPrice(r.occupado_deduction)}` });
    rows.push({ label: t('valuation_valueAfterOccupado'), value: formatPrice(r.value_after_occupado ?? r.adjusted_value), highlight: !r.nuda_propiedad_enabled });
  }

  // Nuda propiedad
  if (r.nuda_propiedad_enabled && r.nuda_propiedad_value != null) {
    rows.push({ label: '', value: '', separator: true });
    rows.push({ label: t('valuation_fullPropertyValue'), value: formatPrice(r.occupado_enabled ? (r.value_after_occupado ?? r.adjusted_value) : r.adjusted_value) });
    rows.push({ label: `${t('valuation_usufructPct')} (${r.usufruct_pct ?? 0}%)`, value: formatPrice(r.usufruct_value ?? 0) });
    rows.push({ label: `${t('valuation_nudaPropiedadPct')} (${r.nuda_propiedad_pct ?? 0}%)`, value: formatPrice(r.nuda_propiedad_value), highlight: true });
  }

  return (
    <>
      <Text style={styles.sectionHeader}>{t('valuation_resultTitle')}</Text>
      <Card>
        {/* Headline */}
        <View style={styles.headlineBox}>
          <Text style={styles.headlineLabel}>
            {r.nuda_propiedad_enabled ? t('valuation_nudaPropiedadValue') : t('valuation_adjustedValue')}
          </Text>
          <Text style={styles.headlineValue}>{formatPrice(headlineValue)}</Text>
          <Text style={styles.headlineRange}>
            {t('valuation_valueRange')}: {formatPrice(r.min_value)} – {formatPrice(r.max_value)}
          </Text>
        </View>

        {/* Breakdown table */}
        {rows.map((row, i) => (
          <BreakdownRow key={i} {...row} />
        ))}

        {/* Price source is tracked internally only — never shown to end users. */}
      </Card>
    </>
  );
}

function SubstanzwertResultDisplay({ result: r, t, formatPrice }: { result: SubstanzwertResult; t: (k: string) => string; formatPrice: (n: number | null) => string }) {
  const rows = [
    { label: t('valuation_bodenwert'), value: formatPrice(r.bodenwert) },
    { label: t('valuation_avgSqmLand'), value: `${formatPrice(r.avg_sqm_land)}/m²` },
    { label: t('valuation_landAreaLabel'), value: `${r.grundstuecksflaeche} m²` },
    { label: t('valuation_nhk'), value: `${formatPrice(r.normalherstellungskosten)}/m²` },
    { label: t('valuation_livingAreaLabel'), value: `${r.wohnflaeche} m²` },
    { label: t('valuation_herstellungskosten'), value: formatPrice(r.herstellungskosten) },
    { label: t('valuation_gesamtnutzungsdauer'), value: `${r.gesamtnutzungsdauer} ${t('valuation_years')}` },
    { label: t('valuation_restnutzungsdauerLabel'), value: `${r.restnutzungsdauer} ${t('valuation_years')}` },
    { label: t('valuation_alterswertminderung'), value: `- ${formatPrice(r.alterswertminderung)}` },
    { label: t('valuation_zeitwertGebaeude'), value: formatPrice(r.zeitwert_gebaeude) },
  ];

  return (
    <>
      <Text style={styles.sectionHeader}>{t('valuation_substanzwertResult')}</Text>
      <Card>
        <View style={styles.headlineBox}>
          <Text style={styles.headlineLabel}>{t('valuation_substanzwertValue')}</Text>
          <Text style={styles.headlineValue}>{formatPrice(r.substanzwert)}</Text>
        </View>
        {rows.map((row, i) => (
          <BreakdownRow key={i} label={row.label} value={row.value} />
        ))}
        {/* Price source is tracked internally only — never shown to end users. */}
      </Card>
    </>
  );
}

function ErtragswertResultDisplay({ result: r, t, formatPrice }: { result: ErtragswertResult; t: (k: string) => string; formatPrice: (n: number | null) => string }) {
  const rows = [
    { label: t('valuation_jahresrohertrag'), value: formatPrice(r.jahresrohertrag) },
    { label: t('valuation_bewirtschaftungskostenLabel'), value: `- ${formatPrice(r.bewirtschaftungskosten)}` },
    { label: t('valuation_reinertrag'), value: formatPrice(r.reinertrag) },
    { label: t('valuation_ertragBodenwert'), value: formatPrice(r.bodenwert) },
    { label: t('valuation_bodenwertverzinsung'), value: `- ${formatPrice(r.bodenwertverzinsung)}` },
    { label: t('valuation_reinertragsanteilGebaeude'), value: formatPrice(r.reinertragsanteil_gebaeude) },
    { label: t('valuation_vervielfaeltiger'), value: r.vervielfaeltiger.toFixed(4) },
    { label: t('valuation_ertragswertGebaeude'), value: formatPrice(r.ertragswert_gebaeude) },
    { label: t('valuation_avgSqmLand'), value: `${formatPrice(r.avg_sqm_land)}/m²` },
    { label: t('valuation_landAreaLabel'), value: `${r.grundstuecksflaeche} m²` },
  ];

  return (
    <>
      <Text style={styles.sectionHeader}>{t('valuation_ertragswertResult')}</Text>
      <Card>
        <View style={styles.headlineBox}>
          <Text style={styles.headlineLabel}>{t('valuation_ertragswertValue')}</Text>
          <Text style={styles.headlineValue}>{formatPrice(r.ertragswert)}</Text>
        </View>
        {rows.map((row, i) => (
          <BreakdownRow key={i} label={row.label} value={row.value} />
        ))}
        {/* Price source is tracked internally only — never shown to end users. */}
      </Card>
    </>
  );
}

/* ── Comparison View ────────────────────────────────────────── */

function ComparisonView({ methods, t, formatPrice }: {
  methods: { method: Method; label: string; value: number }[];
  t: (k: string) => string;
  formatPrice: (n: number | null) => string;
}) {
  const values = methods.map(m => m.value);
  const maxVal = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <>
      <Text style={styles.sectionHeader}>{t('valuation_comparisonTitle')}</Text>
      <Card>
        {methods.map((m) => {
          const pct = maxVal > 0 ? (m.value / maxVal) * 100 : 0;
          return (
            <View key={m.method} style={styles.barChartItem}>
              <View style={styles.barChartHeader}>
                <Text style={styles.barChartLabel}>{m.label}</Text>
                <Text style={styles.barChartValue}>{formatPrice(m.value)}</Text>
              </View>
              <View style={styles.barChartTrack}>
                <View style={[styles.barChartFill, { width: `${pct}%`, backgroundColor: BAR_COLORS[m.method] }]} />
              </View>
            </View>
          );
        })}

        <View style={styles.comparisonSummary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('valuation_comparisonAverage')}</Text>
            <Text style={styles.summaryValue}>{formatPrice(avg)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('valuation_comparisonRange')}</Text>
            <Text style={styles.summaryRangeValue}>
              {formatPrice(Math.min(...values) * 0.95)} – {formatPrice(Math.max(...values) * 1.05)}
            </Text>
          </View>
        </View>
      </Card>
    </>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },

  // Method tabs
  methodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  methodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  methodTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  methodLabelActive: { color: colors.white },

  // Land categories
  landCategoryBlock: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  // Segment controls (land conditions, language selector)
  segmentRow: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },

  // House condition tabs
  conditionRow: {
    flexDirection: 'row',
    gap: 2,
  },
  conditionTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  conditionTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  conditionLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  conditionLabelActive: { color: colors.white },
  conditionMult: {
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: 2,
  },
  conditionMultActive: { color: 'rgba(255,255,255,0.8)' },

  // Steppers
  stepperRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepperItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stepperBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  stepperValue: {
    width: 40,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  // Toggle pills
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  togglePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  togglePillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  togglePillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  togglePillTextActive: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },

  // Special conditions
  toggleWithLabel: {
    marginBottom: spacing.sm,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  toggleMainLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  toggleDesc: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  indented: {
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },

  // Nuda propiedad preview
  nudaPreview: {
    padding: spacing.sm,
    backgroundColor: colors.accentLight ? '#F5C66833' : 'rgba(232, 168, 56, 0.15)',
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
  },
  nudaPreviewText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
    textAlign: 'center',
  },

  // Slider
  sliderLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },

  // Mini label
  miniLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  // Help text
  helpText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },

  // Factor text
  factorText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // Calculate button
  calculateSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  // Result display
  headlineBox: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  headlineLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  headlineValue: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    letterSpacing: -0.5,
  },
  headlineRange: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Breakdown table
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  breakdownValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  breakdownHighlight: {
    color: colors.accent,
    fontWeight: fontWeight.semibold,
  },
  breakdownHighlightValue: {
    color: colors.accent,
    fontWeight: fontWeight.bold,
  },
  breakdownSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  // Price source
  priceSource: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },

  // Comparison
  comparisonHint: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },

  barChartItem: {
    marginBottom: spacing.md,
  },
  barChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  barChartLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  barChartValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  barChartTrack: {
    width: '100%',
    height: 20,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barChartFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
    minWidth: 4,
  },

  comparisonSummary: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  summaryRangeValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },

  // Send button
  sendBtnRow: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalKeyboardView: {
    width: '100%',
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '100%',
  },
  modalScrollContent: {
    flexGrow: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  // Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  checkboxValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
