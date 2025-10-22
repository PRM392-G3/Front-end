import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Image as ImageIcon, Mic, Send } from 'lucide-react-native';

export default function ChatScreen() {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>Nguyễn Văn A</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </View>
        <View style={styles.headerActions} />
      </View>

      <ScrollView style={styles.messages}>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>Hôm nay</Text>
        </View>

        <View style={styles.receivedMessageContainer}>
          <View style={styles.messageAvatar} />
          <View style={[styles.messageBubble, styles.receivedBubble]}>
            <Text style={styles.receivedText}>Chào bạn! Bạn khỏe không?</Text>
            <Text style={styles.messageTime}>14:30</Text>
          </View>
        </View>

        <View style={styles.sentMessageContainer}>
          <View style={[styles.messageBubble, styles.sentBubble]}>
            <Text style={styles.sentText}>Mình khỏe, cảm ơn bạn!</Text>
            <Text style={styles.messageTime}>14:32</Text>
          </View>
        </View>

        <View style={styles.receivedMessageContainer}>
          <View style={styles.messageAvatar} />
          <View style={[styles.messageBubble, styles.receivedBubble]}>
            <Text style={styles.receivedText}>Tuyệt vời! Hẹn gặp lại bạn sớm nhé</Text>
            <Text style={styles.messageTime}>14:35</Text>
          </View>
        </View>

        <View style={styles.sentMessageContainer}>
          <View style={[styles.messageBubble, styles.sentBubble]}>
            <Text style={styles.sentText}>Được rồi, hẹn gặp lại!</Text>
            <Text style={styles.messageTime}>14:36</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <ImageIcon size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={COLORS.gray}
            multiline
          />
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Mic size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton}>
          <Send size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    marginRight: RESPONSIVE_SPACING.sm,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerStatus: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  headerActions: {
    width: 40,
  },
  messages: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: RESPONSIVE_SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  receivedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  sentMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray,
    marginRight: RESPONSIVE_SPACING.xs,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  receivedBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  sentBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  receivedText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    marginBottom: 4,
  },
  sentText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.gray,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    maxHeight: 100,
  },
  textInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
});
