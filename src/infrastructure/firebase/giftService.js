import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

class GiftService {
  async sendGift({ recipient, gift, senderProfile }) {
    const sender = auth.currentUser;
    if (!sender?.uid) {
      throw new Error("You need to sign in before sending gifts.");
    }

    if (!recipient?.uid) {
      throw new Error("Recipient is missing.");
    }

    if (!gift?.id) {
      throw new Error("Gift payload is missing.");
    }

    await addDoc(collection(db, "gifts"), {
      senderId: sender.uid,
      senderName:
        senderProfile?.name ||
        sender.displayName ||
        sender.email?.split("@")[0] ||
        "You",
      senderAvatarUrl: senderProfile?.avatarUrl || sender.photoURL || null,
      recipientId: recipient.uid,
      recipientName:
        recipient.name ||
        recipient.displayName ||
        recipient.email?.split("@")[0] ||
        "Friend",
      giftId: gift.id,
      giftTitle: gift.title,
      giftSubtitle: gift.subtitle,
      giftPrice: gift.price,
      giftImage: gift.image,
      status: "sent",
      createdAt: serverTimestamp(),
    });
  }
}

export const giftService = new GiftService();
