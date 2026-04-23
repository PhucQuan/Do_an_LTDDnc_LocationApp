import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { imageUploadService } from "../supabase/imageUploadService";
import { locationService } from "./locationService";

function isDataAvatar(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

class AvatarMigrationService {
  constructor() {
    this._activeMigration = null;
  }

  async migrateCurrentUserAvatarIfNeeded(profileOverride = null) {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return null;
    }

    if (this._activeMigration) {
      return this._activeMigration;
    }

    this._activeMigration = (async () => {
      let profile = profileOverride || null;
      if (!profile) {
        const snapshot = await getDoc(doc(db, "users", uid));
        profile = snapshot.data() || null;
      }

      const avatarUrl = profile?.avatarUrl || null;

      if (!isDataAvatar(avatarUrl)) {
        return avatarUrl;
      }

      const uploadedUrl = await imageUploadService.uploadAvatarDataUri(
        avatarUrl,
        uid,
      );

      await updateDoc(doc(db, "users", uid), {
        avatarUrl: uploadedUrl,
      });

      locationService.clearCache();
      await locationService.updateMyAvatar(uploadedUrl);

      return uploadedUrl;
    })();

    try {
      return await this._activeMigration;
    } finally {
      this._activeMigration = null;
    }
  }
}

export const avatarMigrationService = new AvatarMigrationService();
