import { db, collection, addDoc } from './firebaseConfig';
import { User } from './domain/entities/User';
import { BumpPost } from './domain/entities/BumpPost';
import { LocationData } from './domain/entities/LocationData';
import { MapManager } from './domain/entities/MapManager';

export const seedMockData = async () => {
  try {
    // 1. Tạo LocationData (Quan hệ 1-1 với BumpPost)
    const location = new LocationData(10.762622, 106.660172, "Quận 10, TP. Hồ Chí Minh");

    // 2. Tạo User (Quan hệ 1-n với BumpPost)
    const user = new User(null, "harry_dev", "harry@example.com", "https://i.pravatar.cc/150");
    const userRef = await addDoc(collection(db, "users"), user.toFirestore());

    // 3. Tạo BumpPost
    const post = new BumpPost(null, userRef.id, "https://picsum.photos/400", "Bumping from Class!", location);
    const postRef = await addDoc(collection(db, "posts"), post.toFirestore());

    // 4. Tạo MapManager (Aggregation: Chứa danh sách Post)
    const mapManager = new MapManager("main_map_01", 15);
    mapManager.addPost(post); // Thêm post vào danh sách quản lý của bản đồ

    const mapRef = await addDoc(collection(db, "mapConfigs"), mapManager.toFirestore());

    console.log("Dữ liệu đã được tạo thành công theo sơ đồ lớp!");
    return { userId: userRef.id, postId: postRef.id, mapId: mapRef.id };

  } catch (error) {
    console.error("Lỗi Seeding: ", error);
    throw error;
  }
};
