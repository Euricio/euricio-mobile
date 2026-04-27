import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAgentSignContract } from '../../lib/api/contracts';
import { EmptySignatureError } from '../../lib/api/agentSignaturePayload';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

interface AgentSignatureCardProps {
  contractId: string;
  /**
   * Stored agent signature value. The backend persists this as a PNG data
   * URL on `contracts.agent_signature_png`, so it can be passed straight to
   * `<Image source={{ uri }} />` without any extra resolving.
   */
  agentSignaturePng: string | null | undefined;
  agentSignedAt: string | null | undefined;
  /** When true the card is locked (e.g. signature request already sent or contract signed). */
  locked?: boolean;
  onSigned?: () => void;
}

/**
 * Standalone broker/agent signature pad. Captures the agent's signature as
 * a separate PNG image and POSTs it to /api/contracts/[id]/agent-sign — it
 * is NOT drawn into the contract PDF. Once `agent_signed_at` is present
 * the parent screen can unlock the "Solicitar firma" / signature request
 * action.
 */
export function AgentSignatureCard({
  contractId,
  agentSignaturePng,
  agentSignedAt,
  locked = false,
  onSigned,
}: AgentSignatureCardProps) {
  const { t, formatDate } = useI18n();
  const agentSign = useAgentSignContract();
  const [padOpen, setPadOpen] = useState(false);

  const hasSignature = !!agentSignedAt;
  const canEdit = !locked;

  const handleSignaturePng = async (base64: string) => {
    try {
      await agentSign.mutateAsync({
        contractId,
        signaturePngBase64: base64,
      });
      setPadOpen(false);
      onSigned?.();
    } catch (err) {
      const message =
        err instanceof EmptySignatureError
          ? t('agentSign_emptyError')
          : err instanceof Error && err.message
            ? err.message
            : t('agentSign_saveError');
      Alert.alert(t('error'), message);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="create-outline" size={18} color={colors.primary} />
        <Text style={styles.title}>{t('agentSign_title')}</Text>
        {hasSignature ? (
          <View style={styles.statusBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.success}
            />
            <Text style={styles.statusText}>{t('agentSign_signedBadge')}</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={colors.warning}
            />
            <Text style={[styles.statusText, { color: colors.warning }]}>
              {t('agentSign_pendingBadge')}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.help}>{t('agentSign_help')}</Text>

      {hasSignature && agentSignaturePng ? (
        <View style={styles.preview}>
          <Image
            source={{ uri: agentSignaturePng }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={[styles.preview, styles.previewEmpty]}>
          <Ionicons
            name="brush-outline"
            size={28}
            color={colors.textTertiary}
          />
          <Text style={styles.previewEmptyText}>
            {t('agentSign_emptyHint')}
          </Text>
        </View>
      )}

      {hasSignature && (
        <Text style={styles.signedAt}>
          {t('agentSign_signedAt')}{' '}
          {formatDate(agentSignedAt!, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          title={
            hasSignature ? t('agentSign_replace') : t('agentSign_open')
          }
          icon={
            <Ionicons
              name="create-outline"
              size={16}
              color={canEdit ? colors.white : colors.textTertiary}
            />
          }
          onPress={() => setPadOpen(true)}
          disabled={!canEdit || agentSign.isPending}
          loading={agentSign.isPending}
        />
        {locked && (
          <Text style={styles.lockedNote}>{t('agentSign_lockedNote')}</Text>
        )}
      </View>

      <SignaturePadModal
        visible={padOpen}
        onClose={() => setPadOpen(false)}
        onSubmit={handleSignaturePng}
        submitting={agentSign.isPending}
      />
    </Card>
  );
}

/* ── Signature pad modal ────────────────────────────────────────── */

const PAD_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; overscroll-behavior: none; touch-action: none; background: #ffffff; }
  #wrap { position: fixed; inset: 0; display: flex; flex-direction: column; }
  #canvas { flex: 1; width: 100%; touch-action: none; background: #ffffff; }
  #hint { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); text-align: center; color: #9ca3af; font-family: -apple-system, system-ui, sans-serif; font-size: 14px; pointer-events: none; }
  .baseline { position: absolute; left: 16px; right: 16px; bottom: 56px; height: 1px; background: #e5e7eb; pointer-events: none; }
  .x { position: absolute; left: 16px; bottom: 60px; color: #9ca3af; font-family: -apple-system, system-ui, sans-serif; font-size: 18px; pointer-events: none; }
</style>
</head>
<body>
  <div id="wrap">
    <canvas id="canvas"></canvas>
    <div id="hint">✍️</div>
    <div class="baseline"></div>
    <div class="x">×</div>
  </div>
<script>
(function() {
  var canvas = document.getElementById('canvas');
  var hint = document.getElementById('hint');
  var ctx = canvas.getContext('2d');
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var dirty = false;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }
  resize();
  window.addEventListener('resize', resize);

  var drawing = false;
  var last = null;

  function pos(evt) {
    var rect = canvas.getBoundingClientRect();
    var t = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function start(evt) {
    evt.preventDefault();
    drawing = true;
    last = pos(evt);
    if (!dirty) { dirty = true; hint.style.display = 'none'; postState(); }
  }
  function move(evt) {
    if (!drawing) return;
    evt.preventDefault();
    var p = pos(evt);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  }
  function end(evt) {
    if (!drawing) return;
    if (evt) evt.preventDefault();
    drawing = false;
    last = null;
  }

  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end, { passive: false });
  canvas.addEventListener('touchcancel', end, { passive: false });
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);

  function postState() {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'state', dirty: dirty })
      );
    } catch (e) {}
  }

  function clearAll() {
    var rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    dirty = false;
    hint.style.display = 'block';
    postState();
  }

  function exportPng() {
    var data = canvas.toDataURL('image/png');
    var base64 = data.indexOf(',') >= 0 ? data.split(',')[1] : data;
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'export', base64: base64 })
      );
    } catch (e) {}
  }

  window.__sig = { clear: clearAll, exportPng: exportPng };
  document.addEventListener('message', handleMessage);
  window.addEventListener('message', handleMessage);
  function handleMessage(e) {
    var msg;
    try { msg = JSON.parse(e.data); } catch (err) { return; }
    if (msg && msg.cmd === 'clear') clearAll();
    if (msg && msg.cmd === 'export') exportPng();
  }
})();
</script>
</body>
</html>`;

interface SignaturePadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (base64: string) => void | Promise<void>;
  submitting: boolean;
}

function SignaturePadModal({
  visible,
  onClose,
  onSubmit,
  submitting,
}: SignaturePadModalProps) {
  const { t } = useI18n();
  const webRef = useRef<WebView>(null);
  const [dirty, setDirty] = useState(false);
  const [exporting, setExporting] = useState(false);

  const html = useMemo(() => PAD_HTML, []);

  const send = (cmd: 'clear' | 'export') => {
    webRef.current?.injectJavaScript(
      `window.postMessage(${JSON.stringify(JSON.stringify({ cmd }))}); true;`,
    );
  };

  const handleSavePress = () => {
    if (!dirty || submitting || exporting) return;
    // Guard against the request leaving before the WebView has produced a
    // base64 payload — the export round-trip is asynchronous, so flip a
    // local "exporting" flag and let the message handler clear it.
    setExporting(true);
    send('export');
  };

  const onMessage = (evt: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(evt.nativeEvent.data);
      if (msg.type === 'state') setDirty(!!msg.dirty);
      if (msg.type === 'export') {
        setExporting(false);
        const base64 = typeof msg.base64 === 'string' ? msg.base64 : '';
        // A blank/effectively-blank canvas can return very short data URLs
        // (e.g. an all-white PNG). Surface a local message instead of
        // forwarding to the server only to get `missing_signature` back.
        if (!base64 || base64.length < 32) {
          Alert.alert(t('error'), t('agentSign_emptyError'));
          return;
        }
        onSubmit(base64);
      }
    } catch {
      // ignore malformed messages
      setExporting(false);
    }
  };

  const saveDisabled = !dirty || submitting || exporting;
  const saveBusy = submitting || exporting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="formSheet"
    >
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} disabled={saveBusy}>
            <Text style={modalStyles.headerCancel}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>
            {t('agentSign_padTitle')}
          </Text>
          <TouchableOpacity
            onPress={handleSavePress}
            disabled={saveDisabled}
          >
            <Text
              style={[
                modalStyles.headerSave,
                saveDisabled && modalStyles.headerSaveDisabled,
              ]}
            >
              {saveBusy ? '…' : t('save')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={modalStyles.padWrap}>
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            style={modalStyles.web}
            javaScriptEnabled
            domStorageEnabled={false}
            onMessage={onMessage}
            scrollEnabled={false}
            overScrollMode="never"
            bounces={false}
          />
          {saveBusy && (
            <View style={modalStyles.overlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>

        <View style={modalStyles.footer}>
          <Text style={modalStyles.footerHint}>{t('agentSign_padHint')}</Text>
          <TouchableOpacity
            onPress={() => send('clear')}
            disabled={!dirty || saveBusy}
            style={modalStyles.clearBtn}
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color={dirty && !saveBusy ? colors.primary : colors.textTertiary}
            />
            <Text
              style={[
                modalStyles.clearText,
                (!dirty || saveBusy) && { color: colors.textTertiary },
              ]}
            >
              {t('agentSign_clear')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ── styles ─────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.success + '15',
  },
  statusPending: {
    backgroundColor: colors.warning + '15',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  help: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  preview: {
    height: 110,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewEmpty: {
    borderStyle: 'dashed',
    gap: 6,
  },
  previewEmptyText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  signedAt: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.xs,
  },
  lockedNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  headerCancel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  headerSave: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  headerSaveDisabled: {
    color: colors.textTertiary,
  },
  padWrap: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  web: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  footerHint: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
